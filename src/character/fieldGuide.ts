/**
 * One-line, plain-language definitions for every "concept" tag used in items.ts.
 * This is the glossary behind the Field Guide screen — a real syllabus of the
 * AI-literacy tells the game actually teaches, not just a trivia list.
 */
export const CONCEPT_DEFINITIONS: Record<string, string> = {
  'Authentic casual brevity':
    'Short, unpolished real messages that assume shared context — nobody texts like they’re writing an essay.',
  'Authentic imperfection (typos/slang)':
    'Real typos and slang are a strong human tell, since generated text is usually cleaner than genuine typing.',
  'Balanced honest nuance':
    'Real opinions usually mix praise and criticism; generated reviews tend to lean toward one extreme.',
  'Bizarre mundane specificity':
    'Odd, highly specific real-life details are hard for a model to invent convincingly out of nowhere.',
  'Buzzword padding':
    'Marketing language stacked with impressive-sounding words but no actual information underneath.',
  'Candid developer voice':
    'Blunt, self-aware humor in code comments and commit messages reflects real frustration, not generated politeness.',
  'Direct efficient phrasing':
    'Real messages get straight to the point; there’s no need to perform thoroughness.',
  'Flowery sensory padding':
    'Overblown descriptive language for an ordinary thing is a common generative-writing habit.',
  'Formulaic symmetry':
    'Perfectly balanced, repeating shapes are easy for an algorithm to produce and rare in genuine human-made art.',
  'Generic pretty imagery':
    'Pleasant but vague imagery that could describe almost any subject, with nothing specific pinned down.',
  'Grand rhetorical cliché':
    'Sweeping statements about "society" or "history" with no specific evidence are a textbook AI essay opener.',
  'Grounded emotional metaphor':
    'A specific personal metaphor, tied to a real feeling, is harder to fabricate convincingly than it looks.',
  'Grounded real-world context':
    'Concrete, situational detail — a place, a person, a constraint — roots text in lived reality.',
  'Hallucinated/impossible claims':
    'Confident technical claims that don’t actually hold up (like "zero overhead") reveal a lack of real understanding.',
  'Hyperbolic repetition':
    'Stacking superlatives ("phenomenal," "life-changing") instead of describing any actual specifics.',
  'Messy real-life specificity':
    'Small, pointless, true-to-life details that serve no narrative purpose except that they really happened.',
  'Mixed-metaphor overreach':
    'Reaching for a dramatic metaphor that doesn’t quite hold together once you look closely at it.',
  'Natural atmospheric imperfection':
    'Real photos have imperfect lighting, haze, and flares that a render tends to smooth away.',
  'Natural photographic imperfection':
    'Genuine camera artifacts — bokeh, clutter, imperfect framing — that staged renders don’t usually have.',
  'Nonsensical generative blending':
    'Combining unrelated elements with no real logic connecting them, a sign nobody steered the output closely.',
  'Overly diplomatic hedging':
    'Criticism so softened and balanced that it avoids ever committing to a real opinion.',
  'Pseudo-intellectual abstraction':
    'Smooth, quotable claims about big ideas — time, memory, grief — with no personal anchor or real evidence.',
  'Pseudoscientific jargon':
    'Technical-sounding words used to dress up a simple idea as more rigorous than it actually is.',
  'Rambling cause-and-effect venting':
    'A real complaint that spirals through one frustration after another, the way actual venting does.',
  'Register mismatch (archaic formality)':
    'Needlessly old-fashioned, formal phrasing in a casual context nobody actually talks like.',
  'Register mismatch (overly formal)':
    'Formal tone used where the real situation calls for something simple and direct.',
  'Repetitive grid patterning':
    'Repeating structural patterns — windows, grids, outlines — that a generative algorithm defaults to.',
  'Seamless organic-mechanical blending':
    'A transition between two materials that’s too flawless to be a real photograph or a real build.',
  'Specific cultural nuance':
    'A detail that requires real contextual knowledge, not just a plausible-sounding generality.',
  'Specific lived detail':
    'A concrete, ordinary detail nobody would think to invent unless it actually happened to them.',
  'Specific technical mishap':
    'A believable, specific technical failure — a dead router, a disconnecting hotspot — grounded in real frustration.',
  'Token-level rhyme repetition':
    'Simple, predictable rhyme pairs strung together with no deeper meaning connecting them.',
  'Unfiltered peer informality':
    'Casual shorthand and real confusion exchanged between people who already know each other.',
  'Universal platitude':
    'A statement so broad it could apply to any situation — which is exactly why it says nothing specific.',
  'Visible material imperfection':
    'Small physical flaws — a crease, a shadow, a fold — that only a real object actually has.',
  'Vulnerable colloquial honesty':
    'A genuine, unresolved emotional admission stated plainly, without performing a neat conclusion.',
};

export function allConcepts(): string[] {
  return Object.keys(CONCEPT_DEFINITIONS).sort((a, b) => a.localeCompare(b));
}

export function definitionFor(concept: string): string {
  return CONCEPT_DEFINITIONS[concept] ?? '';
}
