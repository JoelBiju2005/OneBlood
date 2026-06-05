import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ASSETS_URL } from '../../utils/api';
import { Check, Clipboard, Users, Share2, Phone, Mail, FileText, AlertCircle, Info, Landmark, CheckCircle } from 'lucide-react';

export default function NoticeBoardCard({ notice, viewerId, viewerRole, onRespond, urgencyColors, isOwner, onApprove }) {
  const [showResponses, setShowResponses] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refBloodGroup, setRefBloodGroup] = useState('B+');
  const [refNote, setRefNote] = useState('');

  const urgencyLabel = {
    critical: 'CRITICAL',
    urgent: 'URGENT',
    moderate: 'MODERATE',
    planned: 'PLANNED'
  };

  const donorActions = [
    { action: 'can_donate',   label: 'I Can Donate',            icon: <HeartPulseIcon className="w-3.5 h-3.5" />, desc: 'Volunteer yourself as a donor' },
    { action: 'know_someone', label: 'Refer Someone',           icon: <Users className="w-3.5 h-3.5" />, desc: 'Refer another eligible donor' },
    { action: 'shared',       label: 'I Shared This',           icon: <Share2 className="w-3.5 h-3.5" />, desc: 'Let them know you spread the word' },
  ];

  const handleActionClick = (action) => {
    if (action === 'know_someone') {
      setIsReferralOpen(true);
    } else {
      onRespond(notice._id, action);
    }
  };

  const borderLeftColor = urgencyColors[notice.urgency] || '#dc2626';

  return (
    <div 
      className="glass-card p-6 flex flex-col justify-between text-left hover:border-opacity-10 border-l-4 transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 shadow-sm"
      style={{ borderLeftColor }}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span 
            className="text-[10px] font-black px-2.5 py-1 rounded-full text-white uppercase tracking-wider"
            style={{ backgroundColor: borderLeftColor }}
          >
            {urgencyLabel[notice.urgency] || notice.urgency.toUpperCase()}
          </span>
          <span className="text-xl font-bold font-mono text-[#C0152A] bg-red-500/10 px-3 py-1 rounded-xl">
            {notice.bloodGroup}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-snug">
          {notice.patientName} needs {notice.unitsNeeded} unit(s) of {notice.component}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center mb-3">
          <Landmark className="w-4 h-4 mr-1.5 text-blue-500" /> {notice.hospital}, <span className="text-slate-800 dark:text-white font-semibold ml-1">{notice.city}</span>
        </p>

        {notice.message && (
          <p className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-3 rounded-xl mb-4 leading-relaxed">
            "{notice.message}"
          </p>
        )}

        <div className="space-y-2 mb-4 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Posted by:</span>
            <span className="text-slate-800 dark:text-white font-medium">{notice.seekerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
          <div className="flex justify-between">
            <span>Contact Number:</span>
            <a href={`tel:${notice.contactNumber}`} className="text-red-500 hover:underline font-semibold">
              {notice.contactNumber}
            </a>
          </div>
        </div>

        {notice.doctorLetterUrl ? (
          <a 
            href={notice.doctorLetterUrl.startsWith('http') || notice.doctorLetterUrl.startsWith('blob:') ? notice.doctorLetterUrl : `${ASSETS_URL}${notice.doctorLetterUrl}`} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 mb-4 transition-colors gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> View Doctor's Letter (Verified)
          </a>
        ) : (
          <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-500 mb-4 gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Unverified (No Letter Attached)
          </span>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
        {/* ── Response section ── */}
        {isOwner ? (
          // Seeker view: expandable with full donor details
          <div className="space-y-2">
            <button
              onClick={() => setShowResponses(!showResponses)}
              className={`w-full py-2 px-3 border text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                (notice.responses?.length || 0) > 0
                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-[#C0152A]'
                  : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${(notice.responses?.length || 0) > 0 ? 'bg-[#C0152A] animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                {notice.responses?.length || 0} response(s) logged
              </span>
              <span className="text-slate-400">{showResponses ? '▲ Hide' : '▼ View All'}</span>
            </button>

            {showResponses && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 rounded-xl">
                {(!notice.responses || notice.responses.length === 0) ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-4">No responses yet. They'll appear here in real-time.</p>
                ) : (
                  notice.responses.map((resp, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/8 rounded-xl p-3 space-y-2 text-left animate-fadeIn">

                      {/* Top row: name + action badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-black text-[#C0152A] shrink-0">
                            {resp.donorName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{resp.donorName || 'Anonymous'}</span>
                              {resp.donorId && (
                                <Link
                                  to={`/donor/${resp.donorId}`}
                                  className="text-[9px] text-[#C0152A] hover:underline font-bold shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Profile ↗
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action badge */}
                        <span className={`text-[8px] shrink-0 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${
                          resp.action === 'can_donate'   ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20' :
                          resp.action === 'know_someone' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                          resp.action === 'contacted'    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                                                           'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {resp.action === 'can_donate'   ? 'Will Donate' :
                           resp.action === 'know_someone' ? 'Referred' :
                           resp.action === 'contacted'    ? 'Contacted' : 'Shared'}
                        </span>
                      </div>

                      {/* Contact details for can_donate responses */}
                      {resp.action === 'can_donate' && (resp.donorPhone || resp.donorEmail) && (
                        <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5 space-y-1.5">
                          <p className="text-[8px] font-bold text-[#C0152A] uppercase tracking-widest mb-1">Contact Donor Directly</p>
                          {resp.donorPhone && (
                            <a
                              href={`tel:${resp.donorPhone}`}
                              className="flex items-center gap-2 text-[11px] font-bold text-slate-800 dark:text-white hover:text-red-500 transition-colors group"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              {resp.donorPhone}
                            </a>
                          )}
                          {resp.donorEmail && (
                            <a
                              href={`mailto:${resp.donorEmail}`}
                              className="flex items-center gap-2 text-[11px] text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors group"
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              {resp.donorEmail}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Referral details for know_someone */}
                      {resp.action === 'know_someone' && (resp.referralName || resp.referralPhone || resp.referralBloodGroup) && (
                        <div className="bg-purple-500/5 border border-purple-500/15 rounded-lg p-2.5 space-y-1">
                          <p className="text-[8px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Referred Person</p>
                          {resp.referralName && (
                            <p className="text-[11px] text-slate-850 dark:text-white font-bold flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {resp.referralName}
                              {resp.referralBloodGroup && <span className="ml-2 text-[9px] bg-red-500/20 text-[#C0152A] px-1.5 py-0.5 rounded font-black">{resp.referralBloodGroup}</span>}
                            </p>
                          )}
                          {resp.referralPhone && (
                            <a href={`tel:${resp.referralPhone}`} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                              <Phone className="w-3 h-3" /> {resp.referralPhone}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Note */}
                      {resp.note && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-white/3 border border-slate-100 dark:border-white/5 rounded-lg p-2">
                          "{resp.note}"
                        </p>
                      )}

                      {/* Approve Donor button — visible for can_donate responses */}
                      {isOwner && resp.action === 'can_donate' && notice.status !== 'fulfilled' && (
                        <button
                          onClick={() => onApprove && onApprove(notice._id, resp.donorId, resp.donorName)}
                          className="w-full mt-2 py-2 bg-[#C0152A] hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve & Select Facility
                        </button>
                      )}

                      {/* Timestamp */}
                      <p className="text-[8px] text-slate-500 dark:text-slate-600 text-right">
                        {new Date(resp.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          // Non-seeker view: simple count
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {notice.responses?.length || 0} response(s) logged
          </p>
        )}


        {viewerRole === 'donor' && (notice.status === 'open' || notice.status === 'active') && (
          <div className="grid grid-cols-3 gap-2">
            {donorActions.map(da => (
              <button 
                key={da.action} 
                className="py-2.5 px-2 bg-slate-50 dark:bg-white/5 hover:bg-[#C0152A] hover:text-white border border-slate-200 dark:border-white/5 hover:border-transparent text-slate-705 dark:text-slate-300 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                onClick={() => handleActionClick(da.action)}
                title={da.desc}
              >
                {da.icon}
                <span>{da.label}</span>
              </button>
            ))}
          </div>
        )}

        {isReferralOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left p-5 space-y-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-1.5 border-b border-slate-100 dark:border-white/5 pb-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Refer a Potential Donor</span>
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter contact name"
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={refPhone}
                    onChange={(e) => setRefPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Blood Group</label>
                  <select 
                    value={refBloodGroup}
                    onChange={(e) => setRefBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-red-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Optional Message / Notes</label>
                  <textarea 
                    placeholder="Any additional details..."
                    value={refNote}
                    onChange={(e) => setRefNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-red-500 h-16 resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setIsReferralOpen(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-center"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!refName || !refPhone) {
                      alert('Please fill name and phone number');
                      return;
                    }
                    onRespond(notice._id, 'know_someone', refNote, {
                      referralName: refName,
                      referralPhone: refPhone,
                      referralBloodGroup: refBloodGroup
                    });
                    setIsReferralOpen(false);
                    // Reset fields
                    setRefName('');
                    setRefPhone('');
                    setRefNote('');
                  }}
                  className="flex-1 py-2 bg-[#C0152A] hover:bg-red-700 text-white font-bold rounded-xl text-center"
                >
                  Submit Referral
                </button>
              </div>
            </div>
          </div>
        )}

        {/* If the viewer is the seeker who posted this notice */}
        {isOwner && (notice.status === 'open' || notice.status === 'active') && (
          <button 
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-700/20"
            onClick={() => onRespond(notice._id, 'close')}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark as Fulfilled</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Temporary sub-component wrapper for HeartPulse icon replacement
function HeartPulseIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.3" />
    </svg>
  );
}
