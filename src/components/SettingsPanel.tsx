import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPreferences, MotionPreference } from '../prefs/prefs';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: UserPreferences;
  onUpdatePrefs: (partial: Partial<Omit<UserPreferences, 'version'>>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const motionOptions: { id: MotionPreference; label: string; desc: string }[] = [
    {
      id: 'system',
      label: 'System default',
      desc: 'Follow your operating system prefers-reduced-motion setting.',
    },
    {
      id: 'reduce',
      label: 'Reduce motion',
      desc: 'Minimize animations and disable celebratory confetti.',
    },
    {
      id: 'full',
      label: 'Full motion',
      desc: 'Enable standard card transitions and milestone confetti celebrations.',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        data-testid="settings-panel"
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm text-paper font-body flex flex-col items-center p-4 sm:p-6 md:p-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-xl pb-12 my-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 border-b border-panel-line pb-4">
            <div>
              <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em] block mb-1">
                Configuration
              </span>
              <h2 id="settings-heading" className="text-2xl sm:text-3xl font-serif text-paper">
                Preferences
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="px-3 py-1.5 min-h-10 border border-control-line bg-panel hover:bg-panel-line text-muted hover:text-paper font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>Close</span>
              <span className="text-muted text-[10px]">[Esc]</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Sound Preference */}
            <div className="p-4 bg-panel border border-panel-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-paper">Sound Effects</h3>
                  <p className="text-xs sm:text-sm text-muted font-mono mt-0.5">
                    Audio cues on correct and incorrect choices (Shortcut: M).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdatePrefs({ sound: !prefs.sound })}
                  role="switch"
                  aria-checked={prefs.sound}
                  aria-label="Toggle sound effects"
                  className={`min-h-10 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border transition-colors cursor-pointer ${
                    prefs.sound
                      ? 'bg-signal text-ink border-signal'
                      : 'bg-ink text-muted border-control-line hover:text-paper'
                  }`}
                >
                  {prefs.sound ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>

            {/* Motion Preference */}
            <div className="p-4 bg-panel border border-panel-line space-y-3">
              <div>
                <h3 className="font-serif text-lg text-paper">Motion &amp; Animations</h3>
                <p className="text-xs sm:text-sm text-muted font-mono mt-0.5">
                  Controls animated reveals, card transitions, and confetti effects.
                </p>
              </div>

              <div className="space-y-2 pt-1" role="radiogroup" aria-label="Motion Preference">
                {motionOptions.map((opt) => {
                  const isSelected = prefs.motion === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => onUpdatePrefs({ motion: opt.id })}
                      className={`w-full text-left p-3 border transition-colors cursor-pointer min-h-10 flex flex-col justify-center ${
                        isSelected
                          ? 'border-signal bg-signal/10 text-paper'
                          : 'border-control-line bg-ink/60 hover:bg-ink text-muted hover:text-paper'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs sm:text-sm uppercase tracking-wider font-semibold">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="text-signal font-mono text-xs uppercase">Active</span>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs text-muted mt-0.5 font-sans">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Preference */}
            <div className="p-4 bg-panel border border-panel-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-paper">Leaderboard Name Privacy</h3>
                  <p className="text-xs sm:text-sm text-muted font-mono mt-0.5">
                    Show player name on leaderboard cards and exported stats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePrefs({ showNameOnLeaderboard: !prefs.showNameOnLeaderboard })
                  }
                  role="switch"
                  aria-checked={prefs.showNameOnLeaderboard}
                  aria-label="Toggle player name visibility on leaderboard"
                  className={`min-h-10 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold border transition-colors cursor-pointer ${
                    prefs.showNameOnLeaderboard
                      ? 'bg-signal text-ink border-signal'
                      : 'bg-ink text-muted border-control-line hover:text-paper'
                  }`}
                >
                  {prefs.showNameOnLeaderboard ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 px-5 py-2.5 bg-signal hover:bg-signal-dim text-ink font-mono text-xs uppercase font-semibold tracking-wider transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
