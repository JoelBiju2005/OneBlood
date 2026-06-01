import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ASSETS_URL } from '../../utils/api';

export default function NoticeBoardCard({ notice, viewerId, viewerRole, onRespond, urgencyColors, isOwner }) {
  const [showResponses, setShowResponses] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refBloodGroup, setRefBloodGroup] = useState('B+');
  const [refNote, setRefNote] = useState('');

  const urgencyLabel = {
    critical: '🔴 CRITICAL',
    urgent: '🟠 URGENT',
    moderate: '🟡 MODERATE',
    planned: '🟢 PLANNED'
  };

  const donorActions = [
    { action: 'can_donate',   label: '🩸 I Can Donate',            desc: 'Volunteer yourself as a donor' },
    { action: 'know_someone', label: '👥 Refer Someone',           desc: 'Refer another eligible donor' },
    { action: 'shared',       label: '🔗 I Shared This',           desc: 'Let them know you spread the word' },
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
      className="glass-card p-6 flex flex-col justify-between text-left hover:border-opacity-10 border-l-4 transition-all duration-300"
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
          <span className="text-xl font-bold font-mono text-oneblood-crimson_light bg-oneblood-crimson/10 px-3 py-1 rounded-xl">
            {notice.bloodGroup}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 leading-snug">
          {notice.patientName} needs {notice.unitsNeeded} unit(s) of {notice.component}
        </h3>
        
        <p className="text-sm text-slate-300 flex items-center mb-3">
          <span className="mr-1.5">🏥</span> {notice.hospital}, <span className="text-white font-semibold ml-1">{notice.city}</span>
        </p>

        {notice.message && (
          <p className="text-xs italic text-slate-400 bg-white/5 border border-white/5 p-3 rounded-xl mb-4 leading-relaxed">
            "{notice.message}"
          </p>
        )}

        <div className="space-y-2 mb-4 pt-2 border-t border-white/5 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>Posted by:</span>
            <span className="text-white font-medium">{notice.seekerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
          <div className="flex justify-between">
            <span>Contact Number:</span>
            <a href={`tel:${notice.contactNumber}`} className="text-oneblood-crimson_light hover:underline font-semibold">
              {notice.contactNumber}
            </a>
          </div>
        </div>

        {notice.doctorLetterUrl ? (
          <a 
            href={notice.doctorLetterUrl.startsWith('http') || notice.doctorLetterUrl.startsWith('blob:') ? notice.doctorLetterUrl : `${ASSETS_URL}${notice.doctorLetterUrl}`} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 mb-4 transition-colors"
          >
            <span className="mr-1">📄</span> View Doctor's Letter (Verified)
          </a>
        ) : (
          <span className="inline-flex items-center text-xs font-bold text-amber-500 mb-4">
            <span className="mr-1">⚠️</span> Unverified (No Letter Attached)
          </span>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 space-y-3">
        {/* ── Response section ── */}
        {isOwner ? (
          // Seeker view: expandable with full donor details
          <div className="space-y-2">
            <button
              onClick={() => setShowResponses(!showResponses)}
              className={`w-full py-2 px-3 border text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-between cursor-pointer ${
                (notice.responses?.length || 0) > 0
                  ? 'bg-oneblood-crimson/10 hover:bg-oneblood-crimson/20 border-oneblood-crimson/30 text-white'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${(notice.responses?.length || 0) > 0 ? 'bg-oneblood-crimson animate-pulse' : 'bg-slate-600'}`} />
                💬 {notice.responses?.length || 0} response(s) logged
              </span>
              <span className="text-slate-400">{showResponses ? '▲ Hide' : '▼ View All'}</span>
            </button>

            {showResponses && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 rounded-xl">
                {(!notice.responses || notice.responses.length === 0) ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-4">No responses yet. They'll appear here in real-time.</p>
                ) : (
                  notice.responses.map((resp, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-white/8 rounded-xl p-3 space-y-2 text-left animate-fadeIn">

                      {/* Top row: name + action badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-oneblood-crimson/20 border border-oneblood-crimson/30 flex items-center justify-center text-xs font-black text-oneblood-crimson shrink-0">
                            {resp.donorName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{resp.donorName || 'Anonymous'}</span>
                              {resp.donorId && (
                                <Link
                                  to={`/donor/${resp.donorId}`}
                                  className="text-[9px] text-oneblood-crimson hover:underline font-bold shrink-0"
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
                          resp.action === 'can_donate'   ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                          resp.action === 'know_someone' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                          resp.action === 'contacted'    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                                          'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                        }`}>
                          {resp.action === 'can_donate'   ? '🩸 Will Donate' :
                           resp.action === 'know_someone' ? '👥 Referred' :
                           resp.action === 'contacted'    ? '📞 Contacted' : '🔗 Shared'}
                        </span>
                      </div>

                      {/* Contact details for can_donate responses */}
                      {resp.action === 'can_donate' && (resp.donorPhone || resp.donorEmail) && (
                        <div className="bg-oneblood-crimson/5 border border-oneblood-crimson/15 rounded-lg p-2.5 space-y-1.5">
                          <p className="text-[8px] font-bold text-oneblood-crimson uppercase tracking-widest mb-1">Contact Donor Directly</p>
                          {resp.donorPhone && (
                            <a
                              href={`tel:${resp.donorPhone}`}
                              className="flex items-center gap-2 text-[11px] font-bold text-white hover:text-oneblood-crimson transition-colors group"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] group-hover:bg-emerald-500/30 transition-colors">📞</span>
                              {resp.donorPhone}
                            </a>
                          )}
                          {resp.donorEmail && (
                            <a
                              href={`mailto:${resp.donorEmail}`}
                              className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors group"
                            >
                              <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] group-hover:bg-blue-500/30 transition-colors">✉️</span>
                              {resp.donorEmail}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Referral details for know_someone */}
                      {resp.action === 'know_someone' && (resp.referralName || resp.referralPhone || resp.referralBloodGroup) && (
                        <div className="bg-purple-500/5 border border-purple-500/15 rounded-lg p-2.5 space-y-1">
                          <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest mb-1">Referred Person</p>
                          {resp.referralName && (
                            <p className="text-[11px] text-white font-bold">👤 {resp.referralName}
                              {resp.referralBloodGroup && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">{resp.referralBloodGroup}</span>}
                            </p>
                          )}
                          {resp.referralPhone && (
                            <a href={`tel:${resp.referralPhone}`} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                              📞 {resp.referralPhone}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Note */}
                      {resp.note && (
                        <p className="text-[10px] text-slate-400 italic bg-white/3 border border-white/5 rounded-lg p-2">
                          "{resp.note}"
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-[8px] text-slate-600 text-right">
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
          <p className="text-xs font-medium text-slate-400">
            💬 {notice.responses?.length || 0} response(s) logged
          </p>
        )}


        {viewerRole === 'donor' && (notice.status === 'open' || notice.status === 'active') && (
          <div className="grid grid-cols-2 gap-2">
            {donorActions.map(da => (
              <button 
                key={da.action} 
                className="py-2.5 px-2 bg-white/5 hover:bg-oneblood-crimson hover:text-white border border-white/5 hover:border-transparent text-slate-300 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1"
                onClick={() => handleActionClick(da.action)}
                title={da.desc}
              >
                {da.label}
              </button>
            ))}
          </div>
        )}

        {isReferralOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left p-5 space-y-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5 border-b border-white/5 pb-2">
                <span>👥 Refer a Potential Donor</span>
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter contact name"
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-oneblood-crimson"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={refPhone}
                    onChange={(e) => setRefPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-oneblood-crimson"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
                  <select 
                    value={refBloodGroup}
                    onChange={(e) => setRefBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-oneblood-crimson"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optional Message / Notes</label>
                  <textarea 
                    placeholder="Any additional details..."
                    value={refNote}
                    onChange={(e) => setRefNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-oneblood-crimson h-16 resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setIsReferralOpen(false)}
                  className="flex-1 py-2 border border-white/10 hover:bg-white/5 text-slate-400 font-bold rounded-xl text-center"
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
                  className="flex-1 py-2 bg-oneblood-crimson hover:bg-red-700 text-white font-bold rounded-xl text-center"
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
            <span>✅ Mark as Fulfilled</span>
          </button>
        )}
      </div>
    </div>
  );
}
