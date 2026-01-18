import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

export default function PremiumGate({ starredCount, onUnlock, householdId }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  React.useEffect(() => {
    if (starredCount >= 3) {
      checkPremiumStatus();
    }
  }, [starredCount]);

  const checkPremiumStatus = async () => {
    if (!householdId) {
      console.warn('Cannot check premium status: no household ID provided');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('households')
        .select('is_premium')
        .eq('id', householdId)
        .single();

      if (error) {
        console.error('Error checking premium status:', error);
        setIsVisible(true);
        return;
      }

      if (!data?.is_premium) {
        setIsVisible(true);
      }
    } catch (err) {
      console.error('Error checking premium:', err);
      setIsVisible(true);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCVCChange = (e) => {
    setCardCVC(e.target.value.replace(/\D/g, '').substring(0, 3));
  };

  const handleTestCardClick = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/25');
    setCardCVC('123');
  };

  const handleUnlock = async () => {
    if (!cardNumber || !cardExpiry || !cardCVC) {
      alert('Please fill in all card details');
      return;
    }

    setIsProcessing(true);

    try {
      // Update household to premium - using exact column name is_premium (lowercase, underscore)
      const { data, error } = await supabase
        .from('households')
        .update({ 
          is_premium: true,
          premium_activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', householdId)
        .select();

      console.log('Premium update result:', { data, error, householdId });

      if (error) {
        console.error('Error unlocking premium:', error);
        alert(`Error: ${error.message}`);
        setIsProcessing(false);
        return;
      }

      // Trigger confetti celebration with indigo/teal colors
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#2dd4bf', '#818cf8', '#5eead4']
      });

      // Additional burst after delay
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#2dd4bf']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#2dd4bf']
        });
      }, 300);

      // Immediately update local state and close gate
      setIsVisible(false);
      if (onUnlock) {
        onUnlock();
      }
      
      // Small delay before reload to allow state update
      setTimeout(() => {
        // Force page reload to clear schema cache and recognize premium status
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" />

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-2xl bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Indigo Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600" />

          {/* Content */}
          <div className="p-8 sm:p-12">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
              >
                <span className="text-2xl">⭐</span>
                <span className="text-sm font-medium text-indigo-400">Pro Edition Unlocked</span>
              </motion.div>
            </div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-semibold text-center mb-4 text-white"
            >
              Household Command: Pro Edition
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-300 text-center mb-8"
            >
              You've identified {starredCount} major projects. Ready to simplify the rest?
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mb-8"
            >
              <div className="flex items-start gap-4 p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Sub-Task Auto-Generator</h3>
                  <p className="text-slate-400 text-sm">AI-powered task breakdown for complex projects</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Cognitive Load Heatmaps</h3>
                  <p className="text-slate-400 text-sm">Visualize mental load distribution over time</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">🔄</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">Sunday Sync Dashboard</h3>
                  <p className="text-slate-400 text-sm">Streamlined weekly planning and review</p>
                </div>
              </div>
            </motion.div>

            {/* Wife Back Guarantee - Muted Style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 p-6 bg-slate-800/20 border border-white/5 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">💍</span>
                <div>
                  <p className="text-slate-400 text-sm mb-2 font-medium">Wife Back Guarantee</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    One-time <span className="text-indigo-400">$9.99</span> fee. If this doesn't reduce your mental load in 30 days,{' '}
                    <span className="text-slate-400">Kyle does all the dishes for a month</span>.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stripe-style Card Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 space-y-4"
            >
              <div className="p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleTestCardClick}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Auto-fill Test Card
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expiry
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="p-4 bg-slate-800/30 border border-white/5 rounded-xl backdrop-blur-sm">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardCVC}
                    onChange={handleCVCChange}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>🔒</span>
                <span>Secure payment processing</span>
              </div>
            </motion.div>

            {/* Unlock Button - Clean rounded teal/indigo matching The Cockpit screen */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleUnlock}
              disabled={isProcessing}
              className="w-full py-5 px-8 bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-semibold text-lg rounded-xl hover:from-teal-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unlocking...
                </span>
              ) : (
                'Unlock for $9.99'
              )}
            </motion.button>

            {/* Fine Print */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-xs text-slate-500"
            >
              One-time payment • No subscription • 30-day guarantee
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
