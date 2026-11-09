const ITEMS = [
  {
    id: 'short-note',
    text: 'Got your text, be there in 10!',
    isAI: false,
    explanation: 'Real texts are messy and casual — this is just a quick human reply.',
  },
  {
    id: 'poem-rain',
    text: 'Raindrops hum a quiet tune, dancing lightly past the moon.',
    isAI: true,
    explanation: 'AI poetry often leans on pretty but generic imagery like this — smooth, but says nothing specific.',
  },
  {
    id: 'birthday-wish',
    text: 'happy bday!! cant believe ur 18 already lol',
    isAI: false,
    explanation: 'The typos and slang are a strong human tell — AI text is usually cleaner than this.',
  },
  {
    id: 'product-description',
    text: 'Elevate your daily routine with this premium, thoughtfully designed accessory built for modern living.',
    isAI: true,
    explanation: 'Vague buzzwords like "elevate" and "thoughtfully designed" with no real detail are a classic AI-marketing-copy pattern.',
  },
  {
    id: 'diary-entry',
    text: "Didn't sleep well, dreamt about the exam again. Hope today goes okay.",
    isAI: false,
    explanation: 'Specific, slightly rambling personal detail like this is hard for AI to fake convincingly.',
  },
  {
    id: 'motivational-quote',
    text: 'Every challenge you face is an opportunity in disguise, waiting to unlock your true potential.',
    isAI: true,
    explanation: 'This is a textbook AI-generated "inspirational quote" — broad, universally applicable, and a little hollow.',
  },
  {
    id: 'long-complaint',
    text: "Honestly the wifi here has been down since morning, I tried restarting the router twice, called support and they just said 'please wait 24 hours' which is not helpful when I have an assignment due tonight.",
    isAI: false,
    explanation: 'The rambling cause-and-effect venting with a specific, petty frustration reads as genuinely human.',
  },
];

if (typeof module !== 'undefined') module.exports = ITEMS;
