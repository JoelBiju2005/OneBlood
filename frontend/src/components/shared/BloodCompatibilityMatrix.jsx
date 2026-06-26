import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../../utils/animations';
import { Check, X, Info } from 'lucide-react';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const COMPATIBILITY_MAP = {
  // Recipient: [compatible donors]
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

export default function BloodCompatibilityMatrix() {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const isCompatible = (recipient, donor) => {
    return COMPATIBILITY_MAP[recipient]?.includes(donor) || false;
  };

  const handleCellHover = (rowIdx, colIdx) => {
    setHoveredRow(rowIdx);
    setHoveredCol(colIdx);
  };

  const handleCellLeave = () => {
    setHoveredRow(null);
    setHoveredCol(null);
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border backdrop-blur-md shadow-card transition-colors duration-300"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-display text-neutral-900 dark:text-ob-white">
            Blood Compatibility Matrix
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Hover over cells to see donor-recipient compatibility relationships.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700/60 flex items-center justify-center">
              <X className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
            </div>
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">Incompatible</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        <div className="min-w-[640px]">
          {/* Grid Container */}
          <div className="grid grid-cols-9 gap-1.5 md:gap-2">
            {/* Top-Left Empty Header Cell */}
            <div className="relative flex flex-col justify-end items-end p-2 h-14 md:h-16 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold border-r border-b border-neutral-200 dark:border-neutral-800">
              <div className="absolute top-2 left-2">Recip. ↓</div>
              <div className="absolute bottom-2 right-2">Donor →</div>
            </div>

            {/* Column Headers (Donors) */}
            {BLOOD_TYPES.map((type, colIdx) => (
              <div
                key={`col-${type}`}
                className={`flex items-center justify-center h-14 md:h-16 rounded-xl font-mono text-sm font-bold transition-all duration-200 ${
                  hoveredCol === colIdx
                    ? 'bg-ob-red-700 text-white shadow-glow-red scale-[1.03]'
                    : 'bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {type}
              </div>
            ))}

            {/* Rows */}
            {BLOOD_TYPES.map((rowType, rowIdx) => (
              <React.Fragment key={`row-${rowType}`}>
                {/* Row Header (Recipient) */}
                <div
                  className={`flex items-center justify-center h-12 md:h-14 rounded-xl font-mono text-sm font-bold transition-all duration-200 ${
                    hoveredRow === rowIdx
                      ? 'bg-ob-red-700 text-white shadow-glow-red scale-[1.03]'
                      : 'bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {rowType}
                </div>

                {/* Compatibility Cells */}
                {BLOOD_TYPES.map((colType, colIdx) => {
                  const compatible = isCompatible(rowType, colType);
                  const isHovered = hoveredRow === rowIdx || hoveredCol === colIdx;
                  const isDirectIntersection = hoveredRow === rowIdx && hoveredCol === colIdx;

                  return (
                    <button
                      key={`cell-${rowType}-${colType}`}
                      onMouseEnter={() => handleCellHover(rowIdx, colIdx)}
                      onMouseLeave={handleCellLeave}
                      onClick={() => setSelectedCell({ recipient: rowType, donor: colType, compatible })}
                      className={`relative flex items-center justify-center h-12 md:h-14 rounded-xl font-mono transition-all duration-150 border active:scale-95 ${
                        compatible
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/25 hover:border-emerald-500'
                          : 'bg-neutral-200/40 dark:bg-neutral-800/20 border-neutral-300/40 dark:border-neutral-800/40 text-neutral-400 dark:text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-400'
                      } ${
                        isDirectIntersection
                          ? 'ring-2 ring-ob-red-700 ring-offset-2 ring-offset-white dark:ring-offset-ob-ink scale-[1.05] z-10'
                          : isHovered
                          ? 'opacity-90 scale-[1.02]'
                          : ''
                      }`}
                    >
                      {compatible ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Info Display Section */}
      <div className="mt-8 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex gap-3 text-sm text-neutral-600 dark:text-neutral-300">
        <Info className="w-5 h-5 text-ob-red-700 shrink-0 mt-0.5" />
        <div>
          {selectedCell ? (
            <p>
              <strong className="font-semibold text-neutral-900 dark:text-ob-white font-mono">{selectedCell.donor}</strong>
              {' donor to '}
              <strong className="font-semibold text-neutral-900 dark:text-ob-white font-mono">{selectedCell.recipient}</strong>
              {' recipient: '}
              {selectedCell.compatible ? (
                <span className="text-emerald-500 font-medium">Compatible match. This transfusion can proceed safely.</span>
              ) : (
                <span className="text-ob-red-700 font-medium">Incompatible. The recipient's antibodies will react against the donor's blood cells.</span>
              )}
            </p>
          ) : (
            <p>
              Select a cell or hover over the grid to check clinical compatibility. For example, <span className="font-semibold font-mono text-neutral-900 dark:text-ob-white">O-</span> is the universal red cell donor (can give to all), while <span className="font-semibold font-mono text-neutral-900 dark:text-ob-white">AB+</span> is the universal recipient (can receive from all).
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
