export const TONES = [
  {
    id: 'professional',
    labelKey: 'tones.professional',
    emoji: '💼',
    promptHint: 'Write in a professional, authoritative tone suitable for business audiences.',
  },
  {
    id: 'casual',
    labelKey: 'tones.casual',
    emoji: '😊',
    promptHint: 'Write in a casual, friendly, and conversational tone.',
  },
  {
    id: 'humorous',
    labelKey: 'tones.humorous',
    emoji: '😂',
    promptHint: 'Write with humor, wit, and a lighthearted approach.',
  },
  {
    id: 'inspirational',
    labelKey: 'tones.inspirational',
    emoji: '✨',
    promptHint: 'Write in an uplifting, motivational, and inspiring tone.',
  },
  {
    id: 'educational',
    labelKey: 'tones.educational',
    emoji: '📚',
    promptHint: 'Write in a clear, informative, and educational tone.',
  },
  {
    id: 'persuasive',
    labelKey: 'tones.persuasive',
    emoji: '🎯',
    promptHint: 'Write in a compelling, persuasive tone with strong calls to action.',
  },
  {
    id: 'storytelling',
    labelKey: 'tones.storytelling',
    emoji: '📖',
    promptHint: 'Write as a narrative story with a hook, tension, and resolution.',
  },
  {
    id: 'provocative',
    labelKey: 'tones.provocative',
    emoji: '🔥',
    promptHint: 'Write with a bold, contrarian take that challenges conventional thinking.',
  },
] as const;

export type ToneId = (typeof TONES)[number]['id'];
