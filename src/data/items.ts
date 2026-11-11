import type { Item } from './types';

import abstractArtUrl from '../assets/placeholders/abstract-art.svg';
import sunsetLandscapeUrl from '../assets/placeholders/sunset-landscape.svg';
import cyberPortraitUrl from '../assets/placeholders/cyber-portrait.svg';
import coffeeCupUrl from '../assets/placeholders/coffee-cup.svg';
import robotCatUrl from '../assets/placeholders/robot-cat.svg';

export const ITEMS: Item[] = [
  // 1. Text items ported from v1
  {
    id: 'short-note',
    kind: 'text',
    text: 'Got your text, be there in 10!',
    isAI: false,
    explanation: 'Real texts are messy and casual — this is just a quick human reply.',
  },
  {
    id: 'poem-rain',
    kind: 'text',
    text: 'Raindrops hum a quiet tune, dancing lightly past the moon.',
    isAI: true,
    explanation: 'AI poetry often leans on pretty but generic imagery like this — smooth, but says nothing specific.',
  },
  {
    id: 'birthday-wish',
    kind: 'text',
    text: 'happy bday!! cant believe ur 18 already lol',
    isAI: false,
    explanation: 'The typos and slang are a strong human tell — AI text is usually cleaner than this.',
  },
  {
    id: 'product-description',
    kind: 'text',
    text: 'Elevate your daily routine with this premium, thoughtfully designed accessory built for modern living.',
    isAI: true,
    explanation: 'Vague buzzwords like "elevate" and "thoughtfully designed" with no real detail are a classic AI-marketing-copy pattern.',
  },
  {
    id: 'diary-entry',
    kind: 'text',
    text: "Didn't sleep well, dreamt about the exam again. Hope today goes okay.",
    isAI: false,
    explanation: 'Specific, slightly rambling personal detail like this is hard for AI to fake convincingly.',
  },
  {
    id: 'motivational-quote',
    kind: 'text',
    text: 'Every challenge you face is an opportunity in disguise, waiting to unlock your true potential.',
    isAI: true,
    explanation: 'This is a textbook AI-generated "inspirational quote" — broad, universally applicable, and a little hollow.',
  },
  {
    id: 'long-complaint',
    kind: 'text',
    text: "Honestly the wifi here has been down since morning, I tried restarting the router twice, called support and they just said 'please wait 24 hours' which is not helpful when I have an assignment due tonight.",
    isAI: false,
    explanation: 'The rambling cause-and-effect venting with a specific, petty frustration reads as genuinely human.',
  },

  // 2. Additional curated text items
  {
    id: 'essay-intro',
    kind: 'text',
    text: 'Since the dawn of human civilization, communication has served as the paramount catalyst for societal evolution.',
    isAI: true,
    explanation: 'Grand rhetorical clichés like "Since the dawn of civilization" are notorious hallmarks of AI essays.',
  },
  {
    id: 'group-chat',
    kind: 'text',
    text: 'bro did anyone actually understand question 4 on the math sheet??',
    isAI: false,
    explanation: 'Unfiltered informal phrasing and genuine confusion are natural tells of human group chat messages.',
  },
  {
    id: 'study-tip',
    kind: 'text',
    text: 'To maximize cognitive retention, systematically calibrate your ambient acoustic atmosphere with binaural rhythms.',
    isAI: true,
    explanation: 'Over-engineered pseudoscientific vocabulary for a simple study tip is classic AI puffery.',
  },
  {
    id: 'hallway-reminder',
    kind: 'text',
    text: 'bring your chemistry lab manual today or sir is going to send you out',
    isAI: false,
    explanation: 'Grounded real-world school context and straightforward, unvarnished warnings are distinctly human.',
  },
  {
    id: 'coding-comment',
    kind: 'text',
    text: '// Note: temporary patch for the race condition, do not touch unless you want everything to crash',
    isAI: false,
    explanation: 'Candid developer humor and weary warnings are quintessentially human.',
  },
  {
    id: 'recipe-intro',
    kind: 'text',
    text: 'This delightful culinary journey weaves together aromatic spices to awaken your senses and nourish the soul.',
    isAI: true,
    explanation: 'Flowery, melodramatic introductions for simple recipes are typical LLM padding.',
  },
  {
    id: 'late-excuse',
    kind: 'text',
    text: 'my alarm went off but my phone fell behind the bed and i woke up at 8:45 sorry',
    isAI: false,
    explanation: 'Messy real-life accidents with believable specifics are unmistakably human.',
  },

  // 3. Image items with SVG placeholders
  {
    id: 'img-abstract',
    kind: 'image',
    src: abstractArtUrl,
    caption: 'Geometric Harmony (Digital Art)',
    isAI: true,
    explanation: 'Hyper-symmetrical gradients and formulaic geometric composition typical of synthetic art generators.',
    isPlaceholder: true,
  },
  {
    id: 'img-sunset',
    kind: 'image',
    src: sunsetLandscapeUrl,
    caption: 'Dusk Over Mountains',
    isAI: false,
    explanation: 'Layered silhouettes with intentional asymmetry and hand-placed horizons made by a human artist.',
    isPlaceholder: true,
  },
  {
    id: 'img-cyber',
    kind: 'image',
    src: cyberPortraitUrl,
    caption: 'Cybernetic Silhouette',
    isAI: true,
    explanation: 'Generic high-contrast neon glows and cyber aesthetic commonly synthesized from prompt keywords.',
    isPlaceholder: true,
  },
  {
    id: 'img-coffee',
    kind: 'image',
    src: coffeeCupUrl,
    caption: 'Morning Brew Still-Life',
    isAI: false,
    explanation: 'A charming minimalist vector illustration drawn by a human designer capturing morning warmth.',
    isPlaceholder: true,
  },
  {
    id: 'img-robot',
    kind: 'image',
    src: robotCatUrl,
    caption: 'Futuristic Feline Companion',
    isAI: true,
    explanation: 'Sterile sci-fi textures and hybrid animal-robot concepts generated by prompt tokens.',
    isPlaceholder: true,
  },
];
