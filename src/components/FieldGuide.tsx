import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  allConcepts,
  definitionFor,
  getConceptDetail,
  CONCEPT_CHAPTERS,
  EDUCATIONAL_DISCLAIMER,
} from '../character/fieldGuide';
import { loadMastery, type MasteryMap } from '../learning/mastery';
import type { MasteryTier } from '../learning/types';
import { Icon } from './Icon';

interface FieldGuideProps {
  onClose: () => void;
  onPracticeTell?: (concept: string) => void;
  conceptsSeenInSession?: string[];
}

type SignalFilter = 'all' | 'human' | 'ai' | 'uncertainty';
type CategoryFilter = 'all' | 'writing' | 'code' | 'image' | 'tone' | 'reasoning';
type MasteryFilter = 'all' | MasteryTier;

export const FieldGuide: React.FC<FieldGuideProps> = ({
  onClose,
  onPracticeTell,
  conceptsSeenInSession = [],
}) => {
  const [concepts] = useState(() => allConcepts());
  const [masteryMap] = useState<MasteryMap>(() => loadMastery());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('all');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [groupByChapter, setGroupByChapter] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & focus restoration
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    searchInputRef.current?.focus();

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
  }, [onClose]);

  // Filter concepts based on search, category, signal, and mastery
  const filteredConcepts = concepts.filter((concept) => {
    const detail = getConceptDetail(concept);
    const mastery = masteryMap[concept];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        concept.toLowerCase().includes(q) ||
        detail.definition.toLowerCase().includes(q) ||
        detail.positiveExample.toLowerCase().includes(q) ||
        detail.counterexample.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && detail.category !== categoryFilter) {
      return false;
    }

    // Signal filter
    if (signalFilter !== 'all') {
      if (signalFilter === 'human' && detail.signalBias !== 'human') return false;
      if (signalFilter === 'ai' && detail.signalBias !== 'ai') return false;
      if (signalFilter === 'uncertainty' && detail.signalBias !== 'context-dependent') return false;
    }

    // Mastery filter
    if (masteryFilter !== 'all' && mastery?.tier !== masteryFilter) {
      return false;
    }

    return true;
  });

  const toggleExpand = (concept: string) => {
    setExpandedConcept(expandedConcept === concept ? null : concept);
  };

  const getTierBadge = (tier?: MasteryTier) => {
    switch (tier) {
      case 'mastered':
        return { label: 'Mastered', className: 'text-good border-good/50 bg-good/10' };
      case 'familiar':
        return { label: 'Familiar', className: 'text-good/80 border-good/30 bg-good/5' };
      case 'practicing':
        return { label: 'Practicing', className: 'text-signal border-signal/40 bg-signal/10' };
      case 'shaky':
        return { label: 'Shaky', className: 'text-bad border-bad/40 bg-bad/10' };
      case 'new':
      default:
        return { label: 'New', className: 'text-muted border-panel-line bg-ink' };
    }
  };

  return (
    <motion.div
      data-testid="field-guide"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Field Guide: AI Literacy Tells"
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm text-paper font-body flex flex-col items-center p-4 sm:p-6 md:p-10 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl pb-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-panel-line pb-4">
          <div>
            <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
              Field guide &middot; Syllabus
            </span>
            <h1 className="font-display text-2xl sm:text-4xl text-paper mt-1">
              {concepts.length} tells to know
            </h1>
            <p className="text-muted text-xs sm:text-sm mt-1 max-w-xl font-body">
              Master the vocabulary of generative vs. human signals. Filter by medium, inspect counterexamples, and launch targeted practice.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Field Guide"
            className="px-4 py-2 bg-panel border border-control-line text-muted hover:text-paper hover:border-signal transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
          >
            Close [Esc]
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <label htmlFor="field-guide-search" className="sr-only">
            Search tells by keyword or name
          </label>
          <input
            id="field-guide-search"
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tells, examples, counterexamples... (e.g. typos, rhythm, symmetry)"
            className="w-full bg-panel border border-panel-line px-4 py-2.5 text-paper font-mono text-sm placeholder:text-muted focus:outline-none focus:border-signal"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col space-y-2.5 mb-6 text-xs font-mono">
          {/* Signal Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted uppercase text-[10px] w-14 shrink-0">Signal:</span>
            {(['all', 'human', 'ai', 'uncertainty'] as const).map((sig) => (
              <button
                key={sig}
                type="button"
                onClick={() => setSignalFilter(sig)}
                className={`px-2.5 py-1 uppercase border transition-colors cursor-pointer ${
                  signalFilter === sig
                    ? 'bg-signal text-ink border-signal font-600'
                    : 'bg-panel border-control-line text-muted hover:text-paper'
                }`}
              >
                {sig}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted uppercase text-[10px] w-14 shrink-0">Medium:</span>
            {(['all', 'writing', 'code', 'image', 'tone', 'reasoning'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 uppercase border transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-signal text-ink border-signal font-600'
                    : 'bg-panel border-control-line text-muted hover:text-paper'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mastery Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted uppercase text-[10px] w-14 shrink-0">Mastery:</span>
            {(['all', 'new', 'practicing', 'familiar', 'shaky', 'mastered'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMasteryFilter(m)}
                className={`px-2.5 py-1 uppercase border transition-colors cursor-pointer ${
                  masteryFilter === m
                    ? 'bg-signal text-ink border-signal font-600'
                    : 'bg-panel border-control-line text-muted hover:text-paper'
                }`}
              >
                {m}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setGroupByChapter(!groupByChapter)}
              className={`ml-auto px-2.5 py-1 uppercase border transition-colors cursor-pointer ${
                groupByChapter ? 'bg-signal/20 text-signal border-signal' : 'bg-panel border-control-line text-muted'
              }`}
            >
              {groupByChapter ? 'Flat list' : 'Group chapters'}
            </button>
          </div>
        </div>

        {/* Educational Principle Banner */}
        <div className="mb-6 p-3 bg-panel/70 border border-panel-line border-l-4 border-l-signal text-left">
          <span className="block text-[10px] uppercase font-mono text-signal tracking-widest mb-0.5">
            Critical Reading Foundation
          </span>
          <p className="text-xs text-muted font-mono leading-relaxed italic">
            {EDUCATIONAL_DISCLAIMER}
          </p>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-muted mb-3">
          <span>Showing {filteredConcepts.length} of {concepts.length} tells</span>
          {conceptsSeenInSession.length > 0 && (
            <span className="text-signal">{conceptsSeenInSession.length} encountered in current session</span>
          )}
        </div>

        {/* Concept Cards List */}
        {filteredConcepts.length === 0 ? (
          <div className="p-8 text-center bg-panel border border-panel-line text-muted font-mono">
            No tells match your current filters. Try resetting search or filter pills.
          </div>
        ) : groupByChapter ? (
          /* Chapter Grouped View */
          <div className="space-y-6">
            {CONCEPT_CHAPTERS.map((ch) => {
              const chapterConcepts = filteredConcepts.filter((c) => ch.concepts.includes(c));
              if (chapterConcepts.length === 0) return null;
              return (
                <div key={ch.id} className="space-y-3">
                  <div className="text-left border-b border-panel-line pb-1.5">
                    <h2 className="font-display text-lg sm:text-xl text-paper">{ch.title}</h2>
                    <p className="text-xs font-mono text-muted">{ch.description}</p>
                  </div>
                  <ol className="space-y-3">
                    {chapterConcepts.map((concept) => (
                      <ConceptCard
                        key={concept}
                        concept={concept}
                        detail={getConceptDetail(concept)}
                        mastery={masteryMap[concept]}
                        expanded={expandedConcept === concept}
                        seenInSession={conceptsSeenInSession.includes(concept)}
                        onToggle={() => toggleExpand(concept)}
                        onPractice={onPracticeTell}
                        getTierBadge={getTierBadge}
                      />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Ordered List */
          <ol className="space-y-3">
            {filteredConcepts.map((concept) => (
              <ConceptCard
                key={concept}
                concept={concept}
                detail={getConceptDetail(concept)}
                mastery={masteryMap[concept]}
                expanded={expandedConcept === concept}
                seenInSession={conceptsSeenInSession.includes(concept)}
                onToggle={() => toggleExpand(concept)}
                onPractice={onPracticeTell}
                getTierBadge={getTierBadge}
              />
            ))}
          </ol>
        )}
      </div>
    </motion.div>
  );
};

interface ConceptCardProps {
  concept: string;
  detail: ReturnType<typeof getConceptDetail>;
  mastery?: ReturnType<typeof loadMastery>[string];
  expanded: boolean;
  seenInSession: boolean;
  onToggle: () => void;
  onPractice?: (concept: string) => void;
  getTierBadge: (tier?: MasteryTier) => { label: string; className: string };
}

const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  detail,
  mastery,
  expanded,
  seenInSession,
  onToggle,
  onPractice,
  getTierBadge,
}) => {
  const badge = getTierBadge(mastery?.tier);

  return (
    <li
      onClick={onToggle}
      className="bg-panel border border-panel-line border-l-4 border-l-signal text-left overflow-hidden transition-colors cursor-pointer hover:bg-panel-line/30"
    >
      <div className="p-4 flex flex-col items-start text-left">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base sm:text-lg text-paper font-500">
              {concept}
            </span>
            {seenInSession && (
              <span className="text-[10px] font-mono text-signal bg-ink px-1.5 py-0.5 border border-signal/40">
                Seen in session
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className={`px-2 py-0.5 border uppercase ${badge.className}`}>
              {badge.label}
            </span>
            <Icon name="chevron" className={`text-muted text-base transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
          {definitionFor(concept)}
        </p>
      </div>

      {/* Expanded Learning Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-4 pt-1 border-t border-panel-line/60 bg-ink/50 space-y-3"
          >
            {/* Positive Example */}
            {detail.positiveExample && (
              <div>
                <span className="block text-[11px] uppercase font-mono text-good tracking-wider mb-0.5">
                  Example in the wild
                </span>
                <p className="text-paper text-xs sm:text-sm font-mono bg-ink p-2.5 border border-panel-line">
                  {detail.positiveExample}
                </p>
              </div>
            )}

            {/* Counterexample */}
            {detail.counterexample && (
              <div>
                <span className="block text-[11px] uppercase font-mono text-signal tracking-wider mb-0.5">
                  When this clue fails (Counterexample)
                </span>
                <p className="text-muted text-xs sm:text-sm leading-relaxed">
                  {detail.counterexample}
                </p>
              </div>
            )}

            {/* Why Fooled */}
            {detail.whyFooled && (
              <div>
                <span className="block text-[11px] uppercase font-mono text-muted tracking-wider mb-0.5">
                  Why this fooled people
                </span>
                <p className="text-muted text-xs sm:text-sm leading-relaxed">
                  {detail.whyFooled}
                </p>
              </div>
            )}

            {/* Mastery Stats Bar & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-panel-line/60 flex-wrap gap-2">
              <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
                <span>Practiced: {mastery ? mastery.correctCount + mastery.incorrectCount : 0}</span>
                <span>Correct: {mastery?.correctCount ?? 0}</span>
                <span>Tell identified: {mastery?.tellIdentifiedCount ?? 0}</span>
              </div>

              {onPractice && (
                <button
                  type="button"
                  onClick={() => onPractice(concept)}
                  className="px-3 py-1.5 bg-signal hover:bg-signal-dim text-ink font-mono text-xs uppercase font-600 transition-colors cursor-pointer"
                >
                  Practice this tell &rarr;
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};
