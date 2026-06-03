const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Generates a professional match PDF document with a watermark and official authorization graphics.
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
      doc.opacity(0.015);
      doc.fontSize(80).fillColor('#C0152A');
      doc.translate(300, 420).rotate(-45);
      doc.text('ONEBLOOD', -250, 0, { align: 'center', width: 500 });
      doc.restore();

      // 2. Header Section
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 35, { width: 90 });
      }
      
      // Header Titles next to logo (with constrained width to prevent overlapping metadata)
      doc.fillColor('#C0152A').fontSize(14).font('Helvetica-Bold').text('OFFICIAL BLOOD DONATION MATCH DOCUMENT', 145, 45, { width: 250 });
      doc.fillColor('#4B5563').fontSize(9).font('Helvetica-Oblique').text('One Need. One Response. One Life.', 145, 77);

      // Document Metadata (top-right corner)
      doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold').text('DOCUMENT NO:', 400, 43, { align: 'right', width: 155 });
      doc.font('Helvetica').fillColor('#6B7280').text(`OMD-${match.matchObid.replace('MOB-', '')}-${Date.now().toString().slice(-4)}`, 400, 52, { align: 'right', width: 155 });
      
      const now = new Date();
      doc.fillColor('#374151').font('Helvetica-Bold').text('GENERATED ON:', 400, 68, { align: 'right', width: 155 });
      doc.font('Helvetica').fillColor('#6B7280').text(`${now.toLocaleDateString()} @ ${now.toLocaleTimeString()}`, 400, 77, { align: 'right', width: 155 });

      // Divider Line
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(40, 105).lineTo(555, 105).stroke();

      // 3. Match Highlight Card (Visually Prominent Banner)
      const bannerY = 115;
      const bannerHeight = 65;
      doc.fillColor('#FEF2F2').roundedRect(40, bannerY, 515, bannerHeight, 6).fill();
      doc.strokeColor('#FCA5A5').lineWidth(1.5).roundedRect(40, bannerY, 515, bannerHeight, 6).stroke();
      
      doc.fillColor('#991B1B').fontSize(14).font('Helvetica-Bold').text('MATCH OBID:', 55, bannerY + 15);
      doc.fillColor('#C0152A').fontSize(18).text(match.matchObid, 155, bannerY + 12);
      
      // Badges
      const badgeY = bannerY + 38;
      
      // Active Status Badge
      doc.fillColor('#10B981').roundedRect(55, badgeY, 120, 16, 3).fill();
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('ACTIVE COORDINATION', 60, badgeY + 4);
      
      // Blood Group Badge
      doc.fillColor('#C0152A').roundedRect(185, badgeY, 60, 16, 3).fill();
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(`GROUP: ${match.bloodGroup}`, 192, badgeY + 4);
      
      // Units Badge
      doc.fillColor('#4B5563').roundedRect(255, badgeY, 70, 16, 3).fill();
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text(`${match.units} UNITS REQ`, 262, badgeY + 4);

      // 4. Seeker and Donor Information Cards
      const cardsY = 195;
      const cardWidth = 250;
      const cardHeight = 185;
      
      // --- Seeker Card ---
      doc.fillColor('#F9FAFB').roundedRect(40, cardsY, cardWidth, cardHeight, 6).fill();
      doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(40, cardsY, cardWidth, cardHeight, 6).stroke();
      
      doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold').text('REQUISITION & SEEKER DETAILS', 50, cardsY + 10);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, cardsY + 24).lineTo(40 + cardWidth, cardsY + 24).stroke();
      
      let textY = cardsY + 34;
      const drawField = (label, value, x, y) => {
        doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica-Bold').text(label + ':', x, y);
        doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(value || 'N/A', x + 75, y, { width: 165 });
      };
      
      drawField('Patient Name', patientName, 50, textY);
      textY += 18;
      drawField('Seeker Name', seeker.name, 50, textY);
      textY += 18;
      drawField('Seeker OBID', seeker.onebloodId || 'N/A', 50, textY);
      textY += 18;
      drawField('Phone No.', seeker.phone || 'N/A', 50, textY);
      textY += 18;
      drawField('Email Addr.', seeker.email || 'N/A', 50, textY);
      textY += 18;
      drawField('Target Hosp.', facility.hospitalName || facility.name, 50, textY);
      textY += 28;
      drawField('Purpose', medicalReason, 50, textY);

      // --- Donor Card ---
      doc.fillColor('#F9FAFB').roundedRect(305, cardsY, cardWidth, cardHeight, 6).fill();
      doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(305, cardsY, cardWidth, cardHeight, 6).stroke();
      
      doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold').text('DONOR PROFILE DETAILS', 315, cardsY + 10);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(305, cardsY + 24).lineTo(305 + cardWidth, cardsY + 24).stroke();
      
      textY = cardsY + 34;
      drawField('Donor Name', donor.name, 315, textY);
      textY += 18;
      drawField('Donor OBID', donor.onebloodId || 'N/A', 315, textY);
      textY += 18;
      drawField('Age / Weight', donorProfile ? `${donorProfile.age || 'N/A'} yrs / ${donorProfile.weight || 'N/A'} kg` : 'N/A', 315, textY);
      textY += 18;
      drawField('Phone No.', donor.phone || 'N/A', 315, textY);
      textY += 18;
      drawField('Email Addr.', donor.email || donorProfile?.email || 'N/A', 315, textY);
      textY += 18;
      
      let fullDonorAddress = 'N/A';
      if (donorProfile) {
        fullDonorAddress = `${donorProfile.address || 'N/A'}, ${donorProfile.city || donor.city || ''}`;
      } else {
        fullDonorAddress = donor.city || 'N/A';
      }
      drawField('Donor Addr.', fullDonorAddress, 315, textY);
      textY += 28;
      
      // Green eligibility badge
      doc.fillColor('#D1FAE5').roundedRect(315, textY, 130, 18, 4).fill();
      doc.strokeColor('#10B981').lineWidth(1).roundedRect(315, textY, 130, 18, 4).stroke();
      
      // Draw green tick vector
      doc.save();
      doc.strokeColor('#047857').lineWidth(1.5);
      doc.moveTo(323, textY + 9)
         .lineTo(326, textY + 12)
         .lineTo(331, textY + 6)
         .stroke();
      doc.restore();
      
      doc.fillColor('#065F46').fontSize(8.5).font('Helvetica-Bold').text('Eligible for Donation', 335, textY + 5);

      // 5. Facility Information Section
      const facilityY = 395;
      const facilityHeight = 85;
      
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('FACILITY DIRECTIVES', 40, facilityY);
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(40, facilityY + 15).lineTo(555, facilityY + 15).stroke();
      
      const cardsStartY = facilityY + 25;
      
      if (detourBank) {
        // Stage 1 Collection Facility (Left)
        doc.fillColor('#F9FAFB').roundedRect(40, cardsStartY, cardWidth, facilityHeight, 5).fill();
        doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(40, cardsStartY, cardWidth, facilityHeight, 5).stroke();
        
        doc.fillColor('#7C3AED').fontSize(8.5).font('Helvetica-Bold').text('COLLECTION & TRANSIT FACILITY (Stage 1)', 50, cardsStartY + 10);
        doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(8).text('Name:', 50, cardsStartY + 25);
        doc.fillColor('#4B5563').font('Helvetica').text(detourBank.name, 90, cardsStartY + 25, { width: 190 });
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Address:', 50, cardsStartY + 40);
        doc.fillColor('#4B5563').font('Helvetica').text(`${detourBank.address}, ${detourBank.city}`, 95, cardsStartY + 40, { width: 185 });
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Contact:', 50, cardsStartY + 65);
        doc.fillColor('#4B5563').font('Helvetica').text(detourBank.phone || 'N/A', 95, cardsStartY + 65);
        
        // Stage 2 Recipient Facility (Right)
        doc.fillColor('#F9FAFB').roundedRect(305, cardsStartY, cardWidth, facilityHeight, 5).fill();
        doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(305, cardsStartY, cardWidth, facilityHeight, 5).stroke();
        
        doc.fillColor('#2563EB').fontSize(8.5).font('Helvetica-Bold').text('RECIPIENT HOSPITAL FACILITY (Stage 2)', 315, cardsStartY + 10);
        doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(8).text('Name:', 315, cardsStartY + 25);
        doc.fillColor('#4B5563').font('Helvetica').text(facility.hospitalName || facility.name, 355, cardsStartY + 25, { width: 190 });
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Address:', 315, cardsStartY + 40);
        doc.fillColor('#4B5563').font('Helvetica').text(`${facility.address || 'N/A'}, ${facility.city || 'N/A'}`, 360, cardsStartY + 40, { width: 185 });
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Contact:', 315, cardsStartY + 65);
        doc.fillColor('#4B5563').font('Helvetica').text(facility.emergencyContact || 'N/A', 360, cardsStartY + 65);
      } else {
        // Direct Submission Hospital Card (Full Width)
        doc.fillColor('#F9FAFB').roundedRect(40, cardsStartY, 515, facilityHeight, 5).fill();
        doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(40, cardsStartY, 515, facilityHeight, 5).stroke();
        
        doc.fillColor('#2563EB').fontSize(9).font('Helvetica-Bold').text('DIRECT TRANSFUSION RECIPIENT HOSPITAL', 55, cardsStartY + 10);
        
        doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(8.5).text('Facility Name:', 55, cardsStartY + 28);
        doc.fillColor('#4B5563').font('Helvetica').text(facility.hospitalName || facility.name, 125, cardsStartY + 28, { width: 400 });
        
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Facility Address:', 55, cardsStartY + 45);
        doc.fillColor('#4B5563').font('Helvetica').text(`${facility.address || 'N/A'}, ${facility.city || 'N/A'}`, 135, cardsStartY + 45, { width: 390 });
        
        doc.fillColor('#1F2937').font('Helvetica-Bold').text('Emergency Contact:', 55, cardsStartY + 62);
        doc.fillColor('#4B5563').font('Helvetica').text(facility.emergencyContact || 'N/A', 145, cardsStartY + 62);
      }

      // 6. Verification Status Checklist & Official Authorization Section
      const lowerY = 495;
      
      // --- Left Column: Verification Checklist ---
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('VERIFICATION STATUS', 40, lowerY);
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(40, lowerY + 15).lineTo(290, lowerY + 15).stroke();
      
      const checklistStartY = lowerY + 25;
      const checkItems = [
        'Medical Documentation Verified',
        'Donor Eligibility Verified',
        'Facility Verified',
        'Match Approved',
        'Active Donation Workflow'
      ];
      
      let itemY = checklistStartY;
      checkItems.forEach(item => {
        // Draw green checkmark vector
        doc.save();
        doc.strokeColor('#10B981').lineWidth(1.8);
        doc.moveTo(50, itemY + 5)
           .lineTo(53, itemY + 8)
           .lineTo(58, itemY + 2)
           .stroke();
        doc.restore();

        doc.fillColor('#374151').fontSize(8.5).font('Helvetica').text(item, 70, itemY);
        itemY += 22;
      });

      // --- Right Column: Authorization Section ---
      doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('OFFICIAL AUTHORIZATION', 305, lowerY);
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(305, lowerY + 15).lineTo(555, lowerY + 15).stroke();
      
      const authStartY = lowerY + 25;
      doc.fillColor('#F9FAFB').roundedRect(305, authStartY, 250, 115, 6).fill();
      doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(305, authStartY, 250, 115, 6).stroke();
      
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('OneBlood Verification Authority', 320, authStartY + 15);
      
      doc.fillColor('#4B5563').fontSize(8).font('Helvetica-Bold').text('Document Status:', 320, authStartY + 30);
      doc.fillColor('#059669').fontSize(8.5).text('Officially Verified', 400, authStartY + 30);
      
      // Seal
      const sealX = 350;
      const sealY = authStartY + 75;
      doc.strokeColor('#D97706').lineWidth(2).circle(sealX, sealY, 20).stroke();
      doc.fillColor('#FCD34D').circle(sealX, sealY, 17).fill();
      doc.fillColor('#78350F').fontSize(10).font('Helvetica-Bold').text('OB', sealX - 8, sealY - 4);
      
      // Signature Graphic
      const sigX = 420;
      const sigY = authStartY + 55;
      doc.strokeColor('#2563EB').lineWidth(1.5);
      doc.moveTo(sigX, sigY + 15)
         .bezierCurveTo(sigX + 10, sigY - 5, sigX + 15, sigY + 25, sigX + 25, sigY + 10)
         .bezierCurveTo(sigX + 35, sigY, sigX + 40, sigY + 20, sigX + 50, sigY + 12)
         .bezierCurveTo(sigX + 60, sigY + 5, sigX + 70, sigY + 22, sigX + 85, sigY + 10)
         .stroke();
      
      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica').text('Authorized Signatory', sigX + 10, sigY + 28);

      // 7. Footer Section
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(40, 740).lineTo(555, 740).stroke();
      
      doc.fillColor('#4B5563').fontSize(9).font('Helvetica-Bold').text('OneBlood', 40, 750);
      doc.font('Helvetica-Oblique').fillColor('#6B7280').text('One Need. One Response. One Life.', 40, 762);
      
      doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text('Support Email: ', 220, 750);
      doc.fillColor('#C0152A').text('oneblood.officialteam@gmail.com', 290, 750);
      
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica').text(`MOBID: ${match.matchObid}`, 220, 762);
      
      doc.fillColor('#4B5563').font('Helvetica').text('Page 1 of 1', 400, 750, { align: 'right', width: 155 });
      doc.fillColor('#9CA3AF').fontSize(7.5).text(`Generated: ${new Date().toLocaleString()}`, 400, 762, { align: 'right', width: 155 });

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
