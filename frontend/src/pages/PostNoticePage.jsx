import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const URGENCY_OPTIONS = [
  { value: 'critical', label: '🔴 Critical — Needed within hours', description: 'Life-threatening emergency, no time to spare' },
  { value: 'urgent',   label: '🟠 Urgent — Needed within 24 hrs', description: 'Surgery or procedure tomorrow' },
  { value: 'moderate', label: '🟡 Moderate — Needed within 2–3 days', description: 'Some time available but actively searching' },
  { value: 'planned',  label: '🟢 Planned — Scheduled procedure', description: 'Elective surgery, planning ahead' },
];

export default function PostNoticePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    patientName: '', bloodGroup: '', component: 'Whole Blood',
    unitsNeeded: 1, hospital: '', city: '', contactNumber: '',
    urgency: '', message: '',
  });
  const [doctorLetter, setDoctorLetter] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (doctorLetter) {
        fd.append('doctorLetter', doctorLetter);
      }
      const { data } = await api.post('/noticeboard', fd);
      navigate('/noticeboard/posted', { state: { notice: data } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-left py-12 px-4 sm:px-6 lg:px-8 relative font-sans">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Header and Step Indicators */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-heading text-white">📋 Post a Blood Need</h1>
          <p className="text-slate-400 font-body text-xs md:text-sm">
            Your request will appear on the public requests board. A doctor's letter adds credibility and priority.
          </p>
          
          <div className="flex justify-center items-center space-x-2 pt-2">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                    step >= s ? 'bg-oneblood-crimson text-white border-transparent' : 'bg-white/5 border border-white/10 text-slate-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div 
                    className={`w-12 h-[2px] transition-all duration-300 ${
                      step > s ? 'bg-oneblood-crimson' : 'bg-white/10'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <div className="glass-card p-8 bg-slate-900/40 border border-white/5 rounded-3xl space-y-6">
          
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-2">Basic Information</h2>
              
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Patient Name *</label>
                <input 
                  value={form.patientName} 
                  onChange={e => set('patientName', e.target.value)} 
                  placeholder="Full name of the patient" 
                  className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Blood Group *</label>
                  <select 
                    value={form.bloodGroup} 
                    onChange={e => set('bloodGroup', e.target.value)}
                    className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                  >
                    <option value="">Select Group</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Blood Component</label>
                  <select 
                    value={form.component} 
                    onChange={e => set('component', e.target.value)}
                    className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                  >
                    {['Whole Blood','Platelets','Plasma','RBC','Cryoprecipitate'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Units Needed *</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={form.unitsNeeded} 
                  onChange={e => set('unitsNeeded', parseInt(e.target.value, 10) || 1)} 
                  className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Hospital Name *</label>
                <input 
                  value={form.hospital} 
                  onChange={e => set('hospital', e.target.value)} 
                  placeholder="Hospital where blood is needed" 
                  className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">City *</label>
                  <input 
                    value={form.city} 
                    onChange={e => set('city', e.target.value)} 
                    placeholder="City" 
                    className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Contact Number *</label>
                  <input 
                    value={form.contactNumber} 
                    onChange={e => set('contactNumber', e.target.value)} 
                    placeholder="Phone number for calls" 
                    className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Additional Message (optional)</label>
                <textarea 
                  value={form.message} 
                  onChange={e => set('message', e.target.value)} 
                  placeholder="Any extra details for potential donors…" 
                  maxLength={500} 
                  rows={3}
                  className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3.5 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none resize-none"
                />
              </div>

              <button 
                className="w-full py-4 bg-oneblood-crimson hover:bg-red-700 text-white font-bold rounded-xl transition-all cursor-pointer text-center text-sm disabled:opacity-40 disabled:cursor-not-allowed" 
                onClick={() => setStep(2)}
                disabled={!form.patientName || !form.bloodGroup || !form.hospital || !form.city || !form.contactNumber}
              >
                Next: Set Urgency &rarr;
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 text-left">
              <h2 className="text-xl font-bold text-white mb-2">How Urgent Is This?</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                This sets the priority badge on your requests board post. Be accurate — it helps donors prioritize.
              </p>
              
              <div className="space-y-3">
                {URGENCY_OPTIONS.map(opt => {
                  const isSelected = form.urgency === opt.value;
                  return (
                    <div 
                      key={opt.value}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 flex flex-col space-y-1 ${
                        isSelected 
                          ? 'bg-oneblood-crimson/10 border-oneblood-crimson' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                      onClick={() => set('urgency', opt.value)}
                    >
                      <div className="text-sm font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.description}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                  onClick={() => setStep(1)}
                >
                  &larr; Back
                </button>
                <button 
                  className="flex-1 py-3.5 bg-oneblood-crimson hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setStep(3)}
                  disabled={!form.urgency}
                >
                  Next: Doctor's Letter &rarr;
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-left">
              <h2 className="text-xl font-bold text-white mb-2">Upload Doctor's Letter (Recommended)</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                A verified doctor's prescription helps donors trust your post. Supported formats: PDF, JPG, PNG (max 5MB).
              </p>
              
              <div 
                className="border-2 border-dashed border-white/15 hover:border-oneblood-crimson/50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 bg-white/5"
                onClick={() => document.getElementById('doctorLetterInput').click()}
              >
                {doctorLetter ? (
                  <div className="space-y-2">
                    <span className="text-3xl block">✅</span>
                    <p className="text-xs font-bold text-emerald-400 truncate">{doctorLetter.name}</p>
                    <p className="text-[10px] text-slate-500">{(doctorLetter.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-3xl block">📂</span>
                    <p className="text-xs font-bold text-slate-300">Click to upload or drag & drop</p>
                    <p className="text-[10px] text-slate-500">PDF, JPEG, or PNG up to 5MB</p>
                  </div>
                )}
                <input 
                  id="doctorLetterInput" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={e => setDoctorLetter(e.target.files[0])} 
                />
              </div>

              <p className="text-[11px] text-slate-500 italic text-center pt-2">
                You can skip this upload, but your requests board post will be displayed as "Unverified".
              </p>

              {error && (
                <div className="p-3.5 bg-oneblood-crimson/10 border border-oneblood-crimson/20 rounded-xl text-xs text-red-500 text-center font-semibold animate-pulse">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                  onClick={() => setStep(2)}
                >
                  &larr; Back
                </button>
                <button 
                  className="flex-1 py-3.5 bg-oneblood-crimson hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center"
                  onClick={handleSubmit} 
                  disabled={submitting}
                >
                  {submitting ? 'Posting…' : '🩸 Post to Requests Board'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
