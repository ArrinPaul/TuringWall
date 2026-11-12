import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { allConcepts, definitionFor } from '../character/fieldGuide';

interface FieldGuideProps {
  onClose: () => void;
}

export const FieldGuide: React.FC<FieldGuideProps> = ({ onClose }) => {
  const concepts = allConcepts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      data-testid="field-guide"
      className="fixed inset-0 z-40 bg-ink text-paper font-body flex flex-col items-center p-6 md:p-10 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
              Field guide
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-paper mt-1">
              {concepts.length} tells to know
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            Close [Esc]
          </button>
        </div>

        <p className="text-muted text-sm md:text-base mb-6 max-w-xl">
          Every round in this game is tagged with one of these patterns. This is the actual
          vocabulary behind the guesses &mdash; the same kind of pattern recognition used to study
          how language models and generative systems behave.
        </p>

        <ol className="space-y-3">
          {concepts.map((concept, i) => (
            <li key={concept} className="bg-panel border border-panel-line border-l-4 border-l-signal p-4 text-left">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-signal text-xs shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-lg text-paper">{concept}</span>
              </div>
              <p className="text-muted text-sm mt-1 leading-relaxed">{definitionFor(concept)}</p>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
};
