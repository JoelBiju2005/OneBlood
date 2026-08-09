import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, HeartHandshake, ShieldAlert, BadgeCheck, Landmark, Truck, Activity } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { loadRazorpay } from '../utils/razorpay';
import useCountUp from '../utils/useCountUp';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, colorClass, suffix = "" }) => {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div
      ref={ref}
      className="bg-neutral-900/60 border border-ob-glass-border rounded-2xl p-6 text-center hover:border-ob-glass-hover hover:scale-[1.02] duration-300 transition-all"
    >
      <p className={`text-4xl lg:text-5xl font-mono font-black ${colorClass}`}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-neutral-400 mt-2 uppercase tracking-wider font-semibold">
        {label}
      </p>
    </div>
  );
};

export default function DonatePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: ''
  });

  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalRaised: 0, totalDonors: 0 });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/financial-donations/stats');
        if (data.success) {
          setStats({
            totalRaised: data.totalRaised,
            totalDonors: data.totalDonors
          });
        }
      } catch (err) {
        console.error('Failed to fetch public donation stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handlePresetSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setCustomAmount(val);
      setSelectedAmount(null);
    }
  };

  const activeAmount = selectedAmount !== null ? selectedAmount : parseInt(customAmount, 10) || 0;

  const handleDonate = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (activeAmount < 10 || activeAmount > 100000) {
      setError('Donation amount must be between ₹10 and ₹1,00,000.');
      return;
    }

    setLoading(true);

    // 1. Load Razorpay script
    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Could not load payment gateway. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    try {
      // 2. Create order on backend
      const { data } = await api.post('/financial-donations/create-order', {
        amount: activeAmount,
        donorName: form.name,
        donorEmail: form.email,
        donorPhone: form.phone || undefined,
        message: form.message || undefined,
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize payment.');
      }

      // 3. Open Razorpay checkout
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      data.amount,
        currency:    'INR',
        name:        'OneBlood',
        description: 'Financial Donation — Supporting Blood Transfusion Costs',
        image:       '/oneblood-logo.png', // Fallback to main logo if logo-crimson is absent
        order_id:    data.orderId,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verify = await api.post('/financial-donations/verify-payment', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            // 5. Navigate to success page
            navigate('/donate/success', {
              state: {
                receiptId:  verify.data.receiptId,
                paymentId:  verify.data.paymentId,
                amount:     verify.data.amount,
                donorName:  verify.data.donorName,
                donorEmail: verify.data.donorEmail,
              },
              replace: true
            });
          } catch (verificationErr) {
            setError('Payment was received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            setLoading(false);
          }
        },
        prefill: {
          name:    form.name,
          email:   form.email,
          contact: form.phone || '',
        },
        theme: {
          color: '#C0152A',   // OneBlood crimson in the Razorpay modal
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}. Please try again.`);
        setLoading(false);
      });
      razorpayInstance.open();

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 relative overflow-hidden">
      
      {/* Subtle Crimson Radial Glow at Top Center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[400px] rounded-full bg-ob-red-700/[0.08] blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section 1 — Mission Statement Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            Every drop of blood is precious.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ob-red-700 to-red-400 text-glow-red">So is every rupee that saves a life.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-neutral-400 leading-relaxed font-light"
          >
            OneBlood is a free platform. But the patients we serve often cannot afford
            the cost of blood transfusions, transport, or emergency processing fees.
            Your financial donation goes directly to covering these costs for those who need it most.
          </motion.p>

          {/* Impact Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Donations Coordinated" value={890} colorClass="text-ob-red-500" />
            <StatCard label="Donors Registered" value={1240} colorClass="text-blue-400" />
            <StatCard label="Admin fees charged" value={0} colorClass="text-emerald-400" suffix="%" />
          </div>
        </div>

        {/* Section 2 — Where your money goes */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-10 tracking-wide uppercase text-neutral-300">Where your contribution goes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-neutral-900/40 border border-ob-glass-border p-8 rounded-2xl flex flex-col items-center text-center hover:border-ob-glass-hover transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-ob-red-700/10 flex items-center justify-center text-ob-red-500 mb-6 border border-ob-red-700/20">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">🏥 Blood Transfusion Costs</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Many patients in Tier 2 and Tier 3 cities cannot afford the processing and transfusion fees charged by hospitals. Your donation covers these costs for verified patients on the OneBlood platform.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-neutral-900/40 border border-ob-glass-border p-8 rounded-2xl flex flex-col items-center text-center hover:border-ob-glass-hover transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">🚗 Emergency Transport</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Getting a donor to a hospital quickly can mean the difference between life and loss. We use donations to fund emergency transport for donors and patients who have no other means.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-neutral-900/40 border border-ob-glass-border p-8 rounded-2xl flex flex-col items-center text-center hover:border-ob-glass-hover transition duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">🧪 Blood Component Processing</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Platelets, plasma, and packed red blood cells require specialised processing before transfusion. Your contribution covers these laboratory costs for patients who cannot pay.
              </p>
            </div>

          </div>
        </div>

        {/* Section 3 — Donation form */}
        <div className="max-w-xl mx-auto bg-neutral-900/80 border border-ob-glass-border rounded-3xl p-8 sm:p-10 shadow-2xl relative">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-ob-red-700 to-transparent" />
          
          <h2 className="text-2xl font-extrabold text-center mb-8 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-ob-red-500 fill-ob-red-500 animate-pulse" />
            <span>Make a Financial Donation</span>
          </h2>

          <form onSubmit={handleDonate} className="space-y-6">
            
            {/* Donor Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Your Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-black/60 border border-ob-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ob-red-700 transition"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-black/60 border border-ob-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ob-red-700 transition"
                placeholder="Enter your email address"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-black/60 border border-ob-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ob-red-700 transition"
                placeholder="Enter your contact number"
              />
            </div>

            {/* Select Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Select Amount</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[100, 250, 500, 1000, 2500].map((amt) => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetSelect(amt)}
                      className={`py-2 px-1 text-center font-bold text-xs rounded-lg transition-all duration-200 border ${
                        isSelected
                          ? 'border-ob-red-500 text-white bg-ob-red-700/20 scale-[1.05]'
                          : 'border-ob-glass-border text-neutral-400 hover:border-neutral-500'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-bold">₹</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className={`w-full bg-black/60 border rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-ob-red-700 transition ${
                    selectedAmount === null ? 'border-ob-red-500' : 'border-ob-glass-border'
                  }`}
                  placeholder="Enter custom amount"
                />
              </div>
            </div>

            {/* Message (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Leave a message (optional)</label>
              <textarea
                maxLength={300}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full bg-black/60 border border-ob-glass-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ob-red-700 transition resize-none"
                placeholder="Your short note..."
              />
              <span className="text-[10px] text-neutral-500 block text-right mt-1">{form.message.length}/300 chars</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ob-red-700 hover:bg-ob-red-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 active:scale-[0.98] shadow-lg shadow-ob-red-700/20"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{loading ? 'Processing Secure Payment...' : 'Donate Securely via Razorpay'}</span>
            </button>

            {/* Badges footer */}
            <div className="pt-4 border-t border-ob-glass-border flex flex-col items-center justify-center text-xs text-neutral-500 gap-1.5 text-center">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-400">
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                <span>🔒 100% secure · Powered by Razorpay</span>
              </div>
              <p>All major cards, UPI, Net Banking accepted</p>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
