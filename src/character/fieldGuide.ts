import type { ConceptDetail } from '../learning/types';

/**
 * Educational disclaimer required across the application to reinforce
 * critical inquiry rather than blind heuristic reliance.
 */
export const EDUCATIONAL_DISCLAIMER =
  'No single signal proves whether something is human or AI-made. Look for multiple clues, consider context, and stay uncertain when the evidence is weak.';

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

export const CONCEPT_CHAPTERS = [
  {
    id: 'ch1',
    title: 'Chapter 1: Surface Polish & Imperfection',
    description: 'How typos, unvarnished formatting, and mechanical cleanliness distinguish human rush from model perfection.',
    concepts: [
      'Authentic casual brevity',
      'Authentic imperfection (typos/slang)',
      'Direct efficient phrasing',
      'Unfiltered peer informality',
      'Visible material imperfection',
      'Natural photographic imperfection',
      'Natural atmospheric imperfection',
    ],
  },
  {
    id: 'ch2',
    title: 'Chapter 2: Tone, Venting & Hedging',
    description: 'Emotional stakes, genuine frustration, corporate hedging, and diplomatic neutrality.',
    concepts: [
      'Rambling cause-and-effect venting',
      'Candid developer voice',
      'Vulnerable colloquial honesty',
      'Overly diplomatic hedging',
      'Register mismatch (overly formal)',
      'Register mismatch (archaic formality)',
      'Balanced honest nuance',
    ],
  },
  {
    id: 'ch3',
    title: 'Chapter 3: Specificity vs Generality',
    description: 'Grounding text in petty lived reality versus inflating sentences with generic filler.',
    concepts: [
      'Specific lived detail',
      'Bizarre mundane specificity',
      'Messy real-life specificity',
      'Grounded real-world context',
      'Specific cultural nuance',
      'Universal platitude',
      'Buzzword padding',
      'Hyperbolic repetition',
      'Grand rhetorical cliché',
      'Pseudo-intellectual abstraction',
    ],
  },
  {
    id: 'ch4',
    title: 'Chapter 4: Visual & Metaphorical Symmetry',
    description: 'Telltale patterns in algorithmic generation: unnatural blending, repeating grids, and sensory excess.',
    concepts: [
      'Formulaic symmetry',
      'Repetitive grid patterning',
      'Seamless organic-mechanical blending',
      'Nonsensical generative blending',
      'Flowery sensory padding',
      'Generic pretty imagery',
      'Token-level rhyme repetition',
      'Mixed-metaphor overreach',
      'Grounded emotional metaphor',
    ],
  },
  {
    id: 'ch5',
    title: 'Chapter 5: Technical Reasoning & Hallucinations',
    description: 'Confidence without grounding, fabricated capabilities, and real-world engineering constraints.',
    concepts: [
      'Hallucinated/impossible claims',
      'Pseudoscientific jargon',
      'Specific technical mishap',
    ],
  },
];

const CONCEPT_DETAILS: Record<string, Omit<ConceptDetail, 'concept' | 'definition'>> = {
  'Authentic casual brevity': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Human chat messages optimize for speed over grammatical completion.',
    positiveExample: '"On way, 5 mins"',
    counterexample: 'A busy AI assistant or prompt-tuned bot can output brief snippets when instructed to be terse.',
    whyFooled: 'People expect complete sentences from software and sometimes think short replies are clipped bot responses.',
    rememberThis: 'Look at shared context: if the message assumes prior shared history without explaining itself, it is usually human.',
  },
  'Authentic imperfection (typos/slang)': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Real typing produces phonological and fat-finger keyboard typos rather than synthetic errors.',
    positiveExample: '"yea def gonna be there tmrw"',
    counterexample: 'Users frequently prompt LLMs to "insert typos and lowercase slang" to mimic humans.',
    whyFooled: 'Seeing typos makes people immediately assume human, but synthetic typos can be forced by prompts.',
    rememberThis: 'Check if the typos look natural (adjacent QWERTY keys) or forced and deliberate.',
  },
  'Balanced honest nuance': {
    category: 'tone',
    signalBias: 'human',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Human reviewers balance praise for one feature with irritation at another.',
    positiveExample: '"Camera is exceptional, but the battery barely lasts past 4 PM."',
    counterexample: 'Advanced models can simulate pro/con balance when given balanced review prompts.',
    whyFooled: 'People mistake any critical remark as proof of human experience.',
    rememberThis: 'Nuance rooted in specific daily trade-offs is much harder to simulate than generic pro/con lists.',
  },
  'Bizarre mundane specificity': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Unnecessary, quirky details that do not advance any literary plot usually indicate lived events.',
    positiveExample: '"We found a dry lemon wedge under the seat from 2021."',
    counterexample: 'Creative generation can introduce absurd elements if prompted for surrealist writing.',
    whyFooled: 'We assume odd items must be hallucinated AI errors rather than messy human reality.',
    rememberThis: 'Look at whether the detail is mundane (dusty real world) versus surreal/thematic.',
  },
  'Buzzword padding': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Strings of marketing adjectives with zero concrete functionality or specifications.',
    positiveExample: '"A revolutionary paradigm designed to synergize modern workflows seamlessly."',
    counterexample: 'Human marketing copywriters write buzzword padding constantly under executive orders.',
    whyFooled: 'Corporate writers often sound identical to raw LLM output.',
    rememberThis: 'Absence of substance is common to both AI and corporate writers; look for other corroborating cues.',
  },
  'Candid developer voice': {
    category: 'code',
    signalBias: 'human',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Code comments expressing dry humor, exhaustion, or practical hacks.',
    positiveExample: '// DO NOT TOUCH THIS. I do not know why it works, but the server crashes if removed.',
    counterexample: 'AI coding assistants can generate humorous placeholder comments if prompted.',
    whyFooled: 'Some developers assume all code comments must be professional and formal.',
    rememberThis: 'Real codebase comments capture the emotional fatigue of fixing production bugs.',
  },
  'Direct efficient phrasing': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Plain words answering a question without polite preambles or summarization.',
    positiveExample: '"Reboot the switch on rack B."',
    counterexample: 'Command-line CLI outputs and Unix manual tools are also directly efficient.',
    whyFooled: 'People expect AI to be curt like a terminal, forgetting conversational AI is typically verbose.',
    rememberThis: 'Conversational LLMs default to courtesy; raw brevity usually signals a busy human.',
  },
  'Flowery sensory padding': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Over-indexing on sensory metaphors (tapestry, whisper, dance, symphony) for banal topics.',
    positiveExample: '"The coffee cup sat like a quiet sentinel, whispering warmth into the tapestry of dawn."',
    counterexample: 'Amateur human creative writers often indulge in purple prose and sensory stacking.',
    whyFooled: 'People associate high vocabulary and poetic tone with artistic human talent.',
    rememberThis: 'Purple prose is not proof of AI, but an over-reliance on stock metaphors is a frequent model tell.',
  },
  'Formulaic symmetry': {
    category: 'image',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Unnatural geometric balance across central axes where organic asymmetry should exist.',
    positiveExample: 'A digital painting with identical leaf distributions on both sides of a tree trunk.',
    counterexample: 'Human architects and mandalas intentionally employ strict mathematical symmetry.',
    whyFooled: 'Symmetry looks aesthetically pleasing, leading viewers to mistake it for masterful human design.',
    rememberThis: 'Natural subjects (faces, trees, waves) are rarely mirrored perfectly in reality.',
  },
  'Generic pretty imagery': {
    category: 'image',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Aesthetically pleasant visual scenes devoid of specific location, geography, or historical context.',
    positiveExample: 'A golden-hour skyline with generic sci-fi spires that match no real city.',
    counterexample: 'Human concept artists produce generic background moodboards as well.',
    whyFooled: 'High rendering fidelity and dramatic lighting distract from the lack of genuine content.',
    rememberThis: 'Ask yourself: could this image depict any fantasy city anywhere, or does it have specific intent?',
  },
  'Grand rhetorical cliché': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Opening an essay or article with grand, timeless declarations about civilization or history.',
    positiveExample: '"Since the dawn of time, humanity has grappled with the profound question of..."',
    counterexample: 'High school students are often taught formulaic five-paragraph essay openers that sound just like this.',
    whyFooled: 'Rhetorical grandiosity sounds authoritative to casual readers.',
    rememberThis: 'Models default to sweeping historical introductions when lacking a specific argument.',
  },
  'Grounded emotional metaphor': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'An unusual, deeply personal comparison that resonates because it reflects lived vulnerability.',
    positiveExample: '"Watching him leave felt like dropping an ice cube down my collar on an already cold day."',
    counterexample: 'Well-prompted literary LLMs can synthesize novel metaphors given rich backstories.',
    whyFooled: 'We sometimes think complex metaphors must be generated by pattern-matching machines.',
    rememberThis: 'Look for friction: human emotional metaphors often have an idiosyncratic edge.',
  },
  'Grounded real-world context': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Situational references to specific intersections, transit delays, or regional weather.',
    positiveExample: '"The 4 train stalled at 86th again because of a door sensor issue."',
    counterexample: 'AI with web retrieval or location context can inject local landmarks easily.',
    whyFooled: 'Local references alone do not guarantee human origin if retrieval tools were used.',
    rememberThis: 'Check how the context functions: is it casually embedded in personal stakes or recited like a guidebook?',
  },
  'Hallucinated/impossible claims': {
    category: 'reasoning',
    signalBias: 'ai',
    chapter: 'Chapter 5: Technical Reasoning & Hallucinations',
    plainExplanation: 'Authoritative, grammatically pristine explanations of technical mechanisms that are physically impossible.',
    positiveExample: '"This cryptographic protocol provides 100% security with zero latency and zero computational overhead."',
    counterexample: 'Human grifters and misinformed executives also make impossible technical claims.',
    whyFooled: 'The flawless grammar and academic tone mask the factual contradiction.',
    rememberThis: 'Confidence is decoupled from truth in probabilistic language models.',
  },
  'Hyperbolic repetition': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Chaining extreme superlatives without concrete proof or comparative metrics.',
    positiveExample: '"An utterly transformative, game-changing masterpiece that redefines what is possible forever."',
    counterexample: 'Over-enthusiastic fans and influencers write hyperbole regularly.',
    whyFooled: 'High energy is mistaken for genuine human passion.',
    rememberThis: 'AI uses hyperbolic adjectives as a substitute for detailed comparative evaluation.',
  },
  'Messy real-life specificity': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Tangents about trivial inconveniences (staining a shirt, looking for car keys) inside an unrelated story.',
    positiveExample: '"I went to discuss the contract, but my sock had slipped down into my boot and I could not focus."',
    counterexample: 'Novelists craft messy mundane details intentionally in fiction.',
    whyFooled: 'We expect text to stay strictly on-topic and find accidental tangents jarring.',
    rememberThis: 'Human memory is full of irrelevant sensory associations.',
  },
  'Mixed-metaphor overreach': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Fusing two contrasting visual metaphors so that the mental picture falls apart upon inspection.',
    positiveExample: '"We must steer the ship of innovation through the crowded crossroads of digital evolution."',
    counterexample: 'Politicians and speechwriters mix metaphors during unscripted public speeches all the time.',
    whyFooled: 'Both metaphors are familiar cliches, so readers skim past the logical collision.',
    rememberThis: 'Unpack the literal imagery: ships do not navigate highway crossroads.',
  },
  'Natural atmospheric imperfection': {
    category: 'image',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Atmospheric haze, lens flare, dust motes, and inconsistent sunlight that follow optics rather than style filters.',
    positiveExample: 'A smartphone photo where backlighting blows out the sky and leaves the foreground slightly shadowed.',
    counterexample: 'Modern generative image models can add synthetic lens flare, chromatic aberration, and grain.',
    whyFooled: 'Viewers sometimes think lens flares are visual glitches added by image generators.',
    rememberThis: 'Look at the physics of the scene: does the light bounce consistently from all surfaces?',
  },
  'Natural photographic imperfection': {
    category: 'image',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Blur from moving hands, slight out-of-focus subjects, and awkward composition borders.',
    positiveExample: 'A candid party picture where one person is half cut off at the edge of the frame.',
    counterexample: 'Photographers can stage imperfect candid shots using generative prompts with negative prompt weighting.',
    whyFooled: 'People look for aesthetic flaws and assume high sharpness is always AI.',
    rememberThis: 'Real photographic accidents follow camera motion and focal planes, not stylized noise overlays.',
  },
  'Nonsensical generative blending': {
    category: 'image',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Two distinct objects morphing into one another because the diffusion model interpolated their latent vectors.',
    positiveExample: 'A violin whose wooden body merges smoothly into a person’s ribcage without seam or joint.',
    counterexample: 'Surrealist human painters like Dalí intentionally merge anatomical and mechanical forms.',
    whyFooled: 'Viewers may interpret an algorithmic latent merge as intentional surrealist metaphor.',
    rememberThis: 'Look for functional joints: an intentional human painting usually depicts deliberate joins or seams.',
  },
  'Overly diplomatic hedging': {
    category: 'tone',
    signalBias: 'ai',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Refusing to take a stand by wrapping every statement in "On the other hand" and "It is important to remember".',
    positiveExample: '"While some may find the product lacking, others might appreciate its approach, depending on individual needs."',
    counterexample: 'PR spokespeople and diplomats write cautious hedged prose to avoid liability.',
    whyFooled: 'Readers mistake endless neutrality for objective, authoritative research.',
    rememberThis: 'Standard RLHF safety training pushes models toward balanced non-committal summaries.',
  },
  'Pseudo-intellectual abstraction': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Elegant, quotable musings about profound themes that dissolve into meaningless tautologies.',
    positiveExample: '"Art is not merely what we see, but the silent resonance of that which remains unseen within us."',
    counterexample: 'Self-help gurus and philosophy students frequently write pseudo-intellectual abstractions.',
    whyFooled: 'Poetic cadence and profound vocabulary simulate genuine philosophical depth.',
    rememberThis: 'Translate the statement into simple words: if it reduces to "things are what they are," it is empty abstraction.',
  },
  'Pseudoscientific jargon': {
    category: 'reasoning',
    signalBias: 'ai',
    chapter: 'Chapter 5: Technical Reasoning & Hallucinations',
    plainExplanation: 'Dressing ordinary concepts in quantum, bio-resonance, or neural buzzwords to mimic scientific rigor.',
    positiveExample: '"Leveraging quantum-resonant neuro-linguistic pathways to align personal productivity matrices."',
    counterexample: 'Charlatans and predatory wellness companies invent pseudoscientific jargon deliberately.',
    whyFooled: 'Technical terms intimidate non-specialists into accepting claims without verification.',
    rememberThis: 'Check definitions: do the combined terms correspond to real physics or biology?',
  },
  'Rambling cause-and-effect venting': {
    category: 'tone',
    signalBias: 'human',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'A real complaint where one irritation triggers an associative chain of previous bad experiences.',
    positiveExample: '"They canceled the flight, then lost my bag, and the airport rep told me to submit a web ticket while her phone was literally ringing off the hook."',
    counterexample: 'Roleplay prompts can instruct AI to write furious, rambling customer complaints.',
    whyFooled: 'Rambling text feels chaotic, so some expect software to produce structured bulleted points.',
    rememberThis: 'Authentic frustration follows emotional memory, not a structured outline.',
  },
  'Register mismatch (archaic formality)': {
    category: 'tone',
    signalBias: 'ai',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Using Victorian or historical vocabulary ("hitherto", "perchance", "delve") in everyday discussions.',
    positiveExample: '"Let us delve into the multifaceted tapestry of modern grocery delivery apps."',
    counterexample: 'Eclectic human writers or non-native speakers who studied classical literature may use archaic terms.',
    whyFooled: 'Archaic words are perceived as sophisticated human erudition.',
    rememberThis: 'Notice words like "delve", "tapestry", "beacon", and "multifaceted" appearing in mundane contexts.',
  },
  'Register mismatch (overly formal)': {
    category: 'tone',
    signalBias: 'ai',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Treating a casual Slack message or quick note with the formal structure of a legal brief.',
    positiveExample: '"I am writing to formally communicate my intention to arrive approximately ten minutes after the scheduled commencement."',
    counterexample: 'Anxious employees communicating with strict superiors often adopt overly formal registers.',
    whyFooled: 'Extreme politeness is sometimes interpreted as corporate professionalism.',
    rememberThis: 'Assess the audience: if friends or close teammates are messaging, formal stiffness is an AI tell.',
  },
  'Repetitive grid patterning': {
    category: 'image',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Architectural windows, paving stones, or fence links repeating with copy-paste regularity or subtle melting.',
    positiveExample: 'A skyscraper where windows blur and multiply inconsistently along the facade perspective.',
    counterexample: 'Modernist modular architecture actually consists of repeating prefabricated grids.',
    whyFooled: 'Viewers think repeating grids prove 3D digital architectural CAD modeling.',
    rememberThis: 'Inspect where the grid meets corners or perspectives: does it melt or align properly?',
  },
  'Seamless organic-mechanical blending': {
    category: 'image',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Wires and metal gears flowing into flesh or fur without screws, seams, or biological skin boundaries.',
    positiveExample: 'A mechanical bird whose copper feathers dissolve directly into biological flesh with no feather follicles.',
    counterexample: 'Digital human matte painters can render smooth biomechanical composites.',
    whyFooled: 'The extreme level of micro-detail looks too labor-intensive for a quick algorithm.',
    rememberThis: 'Real engineering and biology require joints, fasteners, or surgical borders.',
  },
  'Specific cultural nuance': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Hyper-localized idioms, regional food slang, or generational references that are not global knowledge.',
    positiveExample: '"Grabbing a bacon egg and cheese from the bodega across from the laundromat."',
    counterexample: 'Models with extensive training data can quote regional idioms when specifically prompted for them.',
    whyFooled: 'Some think slang is easy for AI to regurgitate on demand.',
    rememberThis: 'Check if the nuance is explained: humans state regional habits casually without feeling the need to define them.',
  },
  'Specific lived detail': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Concrete, situational constraints—like a squeaky left shoe or a specific broken mug.',
    positiveExample: '"My mug has that chip on the rim where the enamel came off during the dishwasher cycle."',
    counterexample: 'Creative prompts can supply specific random details to synthetic stories.',
    whyFooled: 'Detailed stories can feel cinematic, leading people to suspect fictional AI creation.',
    rememberThis: 'Lived details often serve no plot function; they just exist because real life is cluttered.',
  },
  'Specific technical mishap': {
    category: 'reasoning',
    signalBias: 'human',
    chapter: 'Chapter 5: Technical Reasoning & Hallucinations',
    plainExplanation: 'Reporting realistic technical failures with authentic diagnostic steps and error codes.',
    positiveExample: '"Docker subnet conflicted with our office VPN gateway again, dropping SSH mid-deploy."',
    counterexample: 'AI software documentation contains thousands of real error messages.',
    whyFooled: 'Technical terms can feel cold and robotic to non-technical users.',
    rememberThis: 'Real troubleshooting captures the messy interaction between two conflicting system configurations.',
  },
  'Token-level rhyme repetition': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 4: Visual & Metaphorical Symmetry',
    plainExplanation: 'Predictable AABB rhyme schemes pairing high-frequency words (light/bright, sound/ground, dream/gleam).',
    positiveExample: '"The city lights shine so bright, guiding wanderers through the night."',
    counterexample: 'Children’s books and greeting cards rely heavily on simple rhyming couplets.',
    whyFooled: 'Rhyme takes effort for untrained humans, so simple rhymes are praised as creative output.',
    rememberThis: 'Look at the vocabulary: standard LLM poems default to the same dozen romantic rhymes.',
  },
  'Unfiltered peer informality': {
    category: 'writing',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Cryptic shorthand, broken grammar, and inside jokes between close collaborators.',
    positiveExample: '"Wait what?? Did u push it to prod already lmao"',
    counterexample: 'Fine-tuned chatbots designed for teen roleplay mimic casual peer banter.',
    whyFooled: 'Short chaotic messages don’t look like traditional publication prose.',
    rememberThis: 'Peer communication assumes mutual knowledge and dispenses with explanatory background.',
  },
  'Universal platitude': {
    category: 'writing',
    signalBias: 'ai',
    chapter: 'Chapter 3: Specificity vs Generality',
    plainExplanation: 'Broad, inspirational assertions that sound wise on a poster but apply to everything and say nothing.',
    positiveExample: '"Every ending is merely the quiet seed of an unwritten beginning waiting for sunlight."',
    counterexample: 'Motivational speakers and greeting card writers make a living producing universal platitudes.',
    whyFooled: 'Emotional resonance tricks the brain into treating a vague platitude as profound truth.',
    rememberThis: 'Ask: does this statement risk anything specific? If it cannot be refuted, it is a platitude.',
  },
  'Visible material imperfection': {
    category: 'image',
    signalBias: 'human',
    chapter: 'Chapter 1: Surface Polish & Imperfection',
    plainExplanation: 'Creases on paper, dust on a lens, worn paint on a corner, or thread fraying on a seam.',
    positiveExample: 'A photo of a ceramic mug showing fine hairline crazing in the glaze from heat cycles.',
    counterexample: 'Generative models trained on photorealistic texture datasets can reproduce macro grain and scratches.',
    whyFooled: 'Viewers expect real objects to look like showroom marketing renders.',
    rememberThis: 'Inspect micro-wear: does wear occur in high-contact areas (handles, edges) or randomly placed across the texture?',
  },
  'Vulnerable colloquial honesty': {
    category: 'tone',
    signalBias: 'human',
    chapter: 'Chapter 2: Tone, Venting & Hedging',
    plainExplanation: 'Admitting uncertainty, regret, or awkward social feelings plainly without a neat moral resolution.',
    positiveExample: '"I honestly don’t know if I made the right choice, and thinking about it still gives me a knot in my stomach."',
    counterexample: 'Therapeutic bots are programmed to reflect emotional vulnerability back to the user.',
    whyFooled: 'People can be skeptical of emotional honesty on the internet.',
    rememberThis: 'Human admissions leave loose ends unresolved rather than wrapping up with a clean moral lesson.',
  },
};

export function allConcepts(): string[] {
  return Object.keys(CONCEPT_DEFINITIONS).sort((a, b) => a.localeCompare(b));
}

export function definitionFor(concept: string): string {
  return CONCEPT_DEFINITIONS[concept] ?? '';
}

export function getConceptDetail(concept: string): ConceptDetail {
  const definition = definitionFor(concept);
  const detail = CONCEPT_DETAILS[concept];
  if (!detail) {
    return {
      concept,
      category: 'writing',
      signalBias: 'context-dependent',
      definition,
      plainExplanation: definition,
      positiveExample: 'Example demonstrating this pattern in context.',
      counterexample: 'Context matters: human and synthetic sources can both show this pattern.',
      whyFooled: 'Surface impressions can be deceiving without deeper contextual clues.',
      rememberThis: EDUCATIONAL_DISCLAIMER,
      chapter: 'General AI Literacy',
    };
  }

  return {
    concept,
    definition,
    ...detail,
  };
}

export function getConceptChapters() {
  return CONCEPT_CHAPTERS;
}

/**
 * Returns candidate tells for the question screen: the target concept plus
 * 3 diverse distractors from the same or related categories.
 */
export function getCandidateTells(
  targetConcept: string,
  count = 4,
  rng: () => number = Math.random
): string[] {
  const all = allConcepts();
  const pool = all.filter((c) => c !== targetConcept);

  // Shuffle pool
  const shuffled = [...pool].sort(() => rng() - 0.5);
  const distractors = shuffled.slice(0, Math.max(1, count - 1));

  // Combine and shuffle together with target concept
  return [...distractors, targetConcept].sort(() => rng() - 0.5);
}

/**
 * Search and filter concepts in the Field Guide.
 */
export function searchConcepts(
  query: string,
  filterCategory?: string,
  filterSignal?: string
): string[] {
  const q = query.trim().toLowerCase();
  return allConcepts().filter((concept) => {
    const detail = getConceptDetail(concept);

    if (filterCategory && filterCategory !== 'all') {
      if (filterCategory === 'writing' && detail.category !== 'writing') return false;
      if (filterCategory === 'code' && detail.category !== 'code') return false;
      if (filterCategory === 'image' && detail.category !== 'image') return false;
      if (filterCategory === 'tone' && detail.category !== 'tone') return false;
      if (filterCategory === 'reasoning' && detail.category !== 'reasoning') return false;
    }

    if (filterSignal && filterSignal !== 'all') {
      if (filterSignal === 'human' && detail.signalBias !== 'human') return false;
      if (filterSignal === 'ai' && detail.signalBias !== 'ai') return false;
      if (filterSignal === 'uncertainty' && detail.signalBias !== 'context-dependent') return false;
    }

    if (!q) return true;

    return (
      concept.toLowerCase().includes(q) ||
      detail.definition.toLowerCase().includes(q) ||
      detail.plainExplanation.toLowerCase().includes(q) ||
      detail.counterexample.toLowerCase().includes(q) ||
      detail.positiveExample.toLowerCase().includes(q)
    );
  });
}
