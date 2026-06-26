import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Ambulance, AlertTriangle, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmergencyFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Call 108',
      icon: <PhoneCall className="w-4 h-4" />,
      onClick: () => window.open('tel:108'),
      offset: { x: -60, y: -10 },
    },
    {
      label: 'Call 112',
      icon: <Phone className="w-4 h-4" />,
      onClick: () => window.open('tel:112'),
      offset: { x: -45, y: -50 },
    },
    {
      label: 'Emergency Request',
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: () => { setIsOpen(false); navigate('/request/new'); },
      offset: { x: -10, y: -75 },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Radial Menu Options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: action.offset.x, y: action.offset.y }}
                exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                onClick={action.onClick}
                className="absolute bottom-0 right-0 flex items-center gap-2 bg-white dark:bg-ob-ink-90 border border-ob-glass-border-light dark:border-ob-glass-border rounded-pill px-4 py-2.5 shadow-float-light dark:shadow-float hover:border-ob-red-700/50 transition-colors whitespace-nowrap active:scale-[0.97]"
              >
                <span className="text-ob-red-700">{action.icon}</span>
                <span className="text-[13px] font-medium text-ob-black dark:text-ob-white">{action.label}</span>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow-red transition-all duration-200 ${
          isOpen
            ? 'bg-ob-ink-80 dark:bg-ob-ink-80 border border-ob-glass-border'
            : 'bg-ob-red-700 hover:bg-ob-red-600'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-ob-white" />
        ) : (
          <Phone className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
};

export default EmergencyFAB;
