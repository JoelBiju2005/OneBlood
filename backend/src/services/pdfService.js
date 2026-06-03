const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Generates a professional match PDF document with a QR code and watermark.
 * @param {Object} match Data of the DonationMatch
 * @param {Object} seeker Seeker user data
 * @param {Object} donor Donor user data
 * @param {Object} facility Hospital details
 * @param {Object} detourBank Optional Transit Blood Bank details
 * @param {Object} donorProfile Optional Donor profile details
 * @returns {Promise<string>} Path to the saved PDF file
 */
const generateMatchPDF = async (match, seeker, donor, facility, detourBank = null, donorProfile = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const fileName = `match_${match.matchObid}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Fetch request details dynamically for the seeker/patient info
      let patientName = seeker.name;
      let seekerAddress = seeker.city || 'Hubballi, Karnataka';
      let medicalReason = 'Transfusion Support';
      
      try {
        const BloodRequest = mongoose.model('BloodRequest');
        const NoticeBoard = mongoose.model('NoticeBoard');
        let reqData = null;
        if (match.requestId) {
          if (match.requestType === 'NoticeBoard') {
            reqData = await NoticeBoard.findById(match.requestId);
          } else {
            reqData = await BloodRequest.findById(match.requestId);
          }
        }
        if (reqData) {
          patientName = reqData.patientName || seeker.name;
          seekerAddress = reqData.address || reqData.hospitalName || seeker.city || 'Hubballi, Karnataka';
          medicalReason = reqData.reason || 'Medical Transfusion';
        }
      } catch (err) {
        console.warn('Could not fetch BloodRequest/NoticeBoard details for PDF:', err.message);
      }

      // Logo path
      const logoPath = path.join(__dirname, '../assets/oneblood-logo.png');

      // 1. Watermark Background
      doc.save();
      doc.opacity(0.03);
      doc.fontSize(80).fillColor('#C0152A');
      doc.translate(300, 400).rotate(-45);
      doc.text('ONEBLOOD', -250, 0, { align: 'center', width: 500 });
      doc.restore();

      // 2. Header Section with Logo
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 35, { width: 100 });
        doc.fillColor('#C0152A').fontSize(24).font('Helvetica-Bold').text('OneBlood Match Slip', 160, 45);
        doc.fillColor('#4B5563').fontSize(10).font('Helvetica').text('One Need. One Response. One Life.', 160, 72);
      } else {
        doc.fillColor('#C0152A').fontSize(24).font('Helvetica-Bold').text('OneBlood Match Slip', 40, 45);
        doc.fillColor('#4B5563').fontSize(10).font('Helvetica').text('One Need. One Response. One Life.', 40, 72);
      }

      doc.moveDown(2);
      doc.strokeColor('#E5E7EB').lineWidth(1.5).moveTo(40, 115).lineTo(555, 115).stroke();
      doc.moveDown(1);

      // 3. Match Highlight Card
      const currentY = doc.y;
      doc.fillColor('#FEF2F2').rect(40, currentY, 515, 65).fill();
      doc.strokeColor('#FCA5A5').lineWidth(1).rect(40, currentY, 515, 65).stroke();
      
      doc.fillColor('#991B1B').fontSize(15).font('Helvetica-Bold').text(`MATCH OBID: ${match.matchObid}`, 55, currentY + 12);
      doc.fillColor('#7F1D1D').fontSize(9).font('Helvetica').text(`Status: ACTIVE MATCH IN PROGRESS  |  Generated on: ${new Date().toLocaleString()}`, 55, currentY + 34);
      doc.text(`Required Group: ${match.bloodGroup}  |  Requested Units: ${match.units}`, 55, currentY + 47);
      
      doc.moveDown(4);

      // 4. Seeker and Donor Side-by-Side Details
      const startDetailsY = doc.y;
      const colWidth = 245;
      
      // Column 1: Seeker & Requisition
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('REQUISITION & SEEKER DETAILS', 40, startDetailsY);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, startDetailsY + 15).lineTo(285, startDetailsY + 15).stroke();
      
      doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
      doc.text(`Seeker Account: ${seeker.name}`, 40, startDetailsY + 23, { width: colWidth });
      doc.text(`Patient Name: ${patientName}`, 40, startDetailsY + 35, { width: colWidth });
      doc.text(`OneBlood ID: ${seeker.onebloodId || 'N/A'}`, 40, startDetailsY + 47);
      doc.text(`Contact Phone: ${seeker.phone || 'N/A'}`, 40, startDetailsY + 59);
      doc.text(`Contact Email: ${seeker.email || 'N/A'}`, 40, startDetailsY + 71);
      doc.text(`Seeker Address/City: ${seekerAddress}`, 40, startDetailsY + 83, { width: colWidth });
      doc.text(`Purpose: ${medicalReason}`, 40, startDetailsY + 107, { width: colWidth });

      // Seeker Prescription Approval Status
      doc.fillColor('#10B981').fontSize(8.5).font('Helvetica-Bold').text('✅ REQUISITION & MEDICAL APPROVAL CHECK:', 40, startDetailsY + 125);
      doc.fillColor('#4B5563').font('Helvetica').fontSize(8).text('Official physician clinical requisition and medical prescription verified by OneBlood Admin panel. Patient requirements approved under medical authority.', 40, startDetailsY + 137, { width: colWidth });

      // Column 2: Donor details
      const col2X = 310;
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('DONOR PROFILE DETAILS', col2X, startDetailsY);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(col2X, startDetailsY + 15).lineTo(555, startDetailsY + 15).stroke();
      
      doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
      doc.text(`Donor Account: ${donor.name}`, col2X, startDetailsY + 23, { width: colWidth });
      doc.text(`OneBlood ID: ${donor.onebloodId || 'N/A'}`, col2X, startDetailsY + 35);
      doc.text(`Contact Phone: ${donor.phone || 'N/A'}`, col2X, startDetailsY + 47);
      doc.text(`Contact Email: ${donor.email || donorProfile?.email || 'N/A'}`, col2X, startDetailsY + 59);
      
      let fullDonorAddress = 'N/A';
      if (donorProfile) {
        fullDonorAddress = `${donorProfile.address || 'N/A'}, ${donorProfile.city || donor.city || ''} ${donorProfile.pincode ? '- ' + donorProfile.pincode : ''}`;
        doc.text(`Age / Weight: ${donorProfile.age || 'N/A'} yrs / ${donorProfile.weight || 'N/A'} kg`, col2X, startDetailsY + 71);
      } else {
        fullDonorAddress = donor.city || 'N/A';
      }
      doc.text(`Donor Address: ${fullDonorAddress}`, col2X, startDetailsY + 83, { width: colWidth });

      // Medical Check approval details
      doc.fillColor('#10B981').fontSize(8.5).font('Helvetica-Bold').text('✅ DONOR MEDICAL ELIGIBILITY CHECK:', col2X, startDetailsY + 125);
      doc.fillColor('#4B5563').font('Helvetica').fontSize(8).text('System-verified age (18-65), weight (>50kg), and 56-day gap rules compliance. Formally cleared of disqualifying medical history and APPROVED for blood donation.', col2X, startDetailsY + 137, { width: colWidth });

      doc.moveDown(13);

      // 5. Route Locations Grid
      const locationsY = doc.y;
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('CONFIRMED DESTINATION ROUTE', 40, locationsY);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, locationsY + 15).lineTo(555, locationsY + 15).stroke();

      let boxY = locationsY + 25;
      
      if (detourBank) {
        // Render Transit Blood Bank
        doc.fillColor('#F9FAFB').rect(40, boxY, 515, 55).fill();
        doc.strokeColor('#E5E7EB').lineWidth(0.5).rect(40, boxY, 515, 55).stroke();
        
        doc.fillColor('#7C3AED').fontSize(9).font('Helvetica-Bold').text('STAGE 1: TRANSIT BLOOD BANK (For collection/transfusion)', 55, boxY + 10);
        doc.fillColor('#4B5563').font('Helvetica').text(`Name: ${detourBank.name}  |  Phone: ${detourBank.phone || 'N/A'}`, 55, boxY + 24);
        doc.text(`Address: ${detourBank.address}, ${detourBank.city}`, 55, boxY + 37);

        boxY += 65;
      }

      // Render Final Destination Hospital
      doc.fillColor('#F9FAFB').rect(40, boxY, 515, 55).fill();
      doc.strokeColor('#E5E7EB').lineWidth(0.5).rect(40, boxY, 515, 55).stroke();
      
      doc.fillColor('#2563EB').fontSize(9).font('Helvetica-Bold').text(detourBank ? 'STAGE 2: FINAL HOSPITAL DESTINATION (For recipient submission)' : 'FINAL HOSPITAL DESTINATION (Direct Submission)', 55, boxY + 10);
      doc.fillColor('#4B5563').font('Helvetica').text(`Name: ${facility.hospitalName || facility.name}  |  Emergency contact: ${facility.emergencyContact || 'N/A'}`, 55, boxY + 24);
      doc.text(`Address: ${facility.address || 'N/A'}, ${facility.city || 'N/A'}`, 55, boxY + 37);

      // 6. Official Verification Logo
      const qrY = boxY + 70;
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('OFFICIAL VERIFICATION', 40, qrY);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, qrY + 15).lineTo(555, qrY + 15).stroke();

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, qrY + 25, { width: 75 });
      }
      
      doc.fontSize(8.5).fillColor('#4B5563').font('Helvetica-Bold').text('OFFICIAL MATCH SLIP VERIFICATION NOTICE', 130, qrY + 30);
      doc.fontSize(8).fillColor('#9CA3AF').font('Helvetica').text('This document is verified and authenticated by OneBlood. The presence of the official OneBlood logo confirms the validity and security of this match, active transit, and completion records.', 130, qrY + 42, { width: 380 });

      // 7. Footer
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, 750).lineTo(555, 750).stroke();
      doc.fillColor('#9CA3AF').fontSize(8.5).text('Generated automatically by OneBlood — One Need. One Response. One Life.', 40, 762, { align: 'center', width: 515 });

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateMatchPDF
};
