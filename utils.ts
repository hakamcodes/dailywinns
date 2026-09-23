
import { HappinessPillars } from './types';

// --- Shared Metadata ---
export interface PillarMeta {
  key: keyof HappinessPillars;
  label: string;
  icon: string;
  description: string;
  whyItMatters: string;
  tip: string;
}

export const PILLARS_METADATA: PillarMeta[] = [
  {
    key: 'physical',
    label: 'Physical Activity',
    icon: '🏋️',
    description: 'Any movement that gets your body working — a workout, a walk, yoga, sport, dance, or even a long stroll.',
    whyItMatters: 'Physical activity is the single most reliable mood booster known to science. It releases endorphins, reduces cortisol (the stress hormone), and improves sleep quality. Research consistently shows that people who move their body daily report 40–60% higher life satisfaction than those who don\'t. Even 20 minutes is enough to feel the effect.',
    tip: 'You don\'t need a gym. A 20-minute walk counts. Do it right after logging this.',
  },
  {
    key: 'problemSolving',
    label: 'Complex Problem Solving',
    icon: '🧩',
    description: 'Engaging deeply with a challenging problem — coding, mathematics, strategy, puzzles, planning, or analytical work.',
    whyItMatters: 'The human brain is wired to feel satisfaction when it solves hard problems. This "cognitive flow" state — where a task is challenging but achievable — produces some of the most intense feelings of happiness and purpose. Psychologist Mihaly Csikszentmihalyi called it "flow," and it\'s one of the highest-value activities for long-term wellbeing.',
    tip: 'Pick one hard problem today and work on it for at least 30 uninterrupted minutes.',
  },
  {
    key: 'helping',
    label: 'Help People, Animals, Plants',
    icon: '🌱',
    description: 'Any act of helping — assisting someone, caring for an animal, watering plants, or contributing to something beyond yourself.',
    whyItMatters: 'Helping others activates the brain\'s reward system in the same way as receiving rewards yourself. Studies show that acts of kindness — even small ones — create a "helper\'s high" that lasts for hours. People who regularly help others report lower stress, better mental health, and a stronger sense of purpose. Watering a plant counts.',
    tip: 'Do one small helpful thing today — it takes 2 minutes and genuinely improves your mood.',
  },
  {
    key: 'creative',
    label: 'Creative Work',
    icon: '🎨',
    description: 'Creating something — writing, drawing, making music, building, designing, cooking something new, crafting, or any form of self-expression.',
    whyItMatters: 'Creative expression reduces anxiety, builds confidence, and gives a unique sense of ownership over something you made. It doesn\'t matter if it\'s "good" — the act of creation itself is what produces happiness. Many people who feel stuck or low in mood report that making something, anything, consistently helps them feel better.',
    tip: 'Create something today even if it\'s tiny — a doodle, a poem, a meal you haven\'t made before.',
  },
  {
    key: 'explore',
    label: 'Explore New Places',
    icon: '🗺️',
    description: 'Going somewhere new or different — a new area of your city, a nature spot, a cafe you\'ve never visited, or any physical exploration.',
    whyItMatters: 'Novelty and exploration are hardwired into human happiness. New environments stimulate dopamine and keep the brain engaged and curious. People who explore regularly — even on a small scale — report higher levels of curiosity, openness, and day-to-day enjoyment. You don\'t need to travel far. A new street counts.',
    tip: 'Take a different route home today or visit a new place in your area.',
  },
  {
    key: 'learning',
    label: 'Learned Something New',
    icon: '🧠',
    description: 'Any genuine new knowledge or skill — reading, watching educational content, a new concept, language, technique, or insight.',
    whyItMatters: 'Learning activates the brain\'s reward pathways and creates a strong sense of progress and purpose. People who regularly learn new things report higher levels of curiosity, confidence, and life satisfaction. The compound effect of learning even one thing daily for a year is extraordinary — it\'s 365 new things you didn\'t know before.',
    tip: 'Write down the one thing you learned today. Writing it solidifies it in memory.',
  },
  {
    key: 'ideas',
    label: 'Worked on New Ideas',
    icon: '💡',
    description: 'Generating, developing, or working on new ideas — business ideas, creative concepts, solutions, inventions, or any imaginative thinking.',
    whyItMatters: 'Ideation is one of the most uniquely human activities, and working on ideas — even impractical ones — produces a distinctive kind of excitement and mental energy. People who regularly think creatively and work on their own ideas report higher engagement with life. Your ideas matter even if they never become anything. The habit of ideating keeps the mind sharp and motivated.',
    tip: 'Keep a notes file for ideas. Even writing down a bad idea is better than none.',
  },
  {
    key: 'qualityTime',
    label: 'Quality Time Together',
    icon: '🤝',
    description: 'Meaningful time with people you care about — a real conversation, a shared meal, a phone call, playing, or any genuine connection.',
    whyItMatters: 'The longest study on happiness ever conducted (Harvard\'s 80-year Grant Study) found that the quality of relationships is the single strongest predictor of happiness and health — stronger than wealth, fame, or success. Yet most people consistently underinvest in relationships while overinvesting in achievements. Meaningful connection, even for 20 minutes, matters enormously.',
    tip: 'Put the phone away for the next shared meal or conversation. Full presence is the gift.',
  },
  {
    key: 'progression',
    label: 'Progression in Life',
    icon: '📈',
    description: 'Moving forward on something that matters to you — a goal, a project, a skill, a habit, or any meaningful personal growth.',
    whyItMatters: 'The feeling of progress — even small forward movement — is one of the most powerful daily happiness drivers. Teresa Amabile\'s "Progress Principle" research found that making progress on meaningful work was the strongest predictor of positive emotion on any given day, outranking praise, incentives, and collaboration. Ticking even one thing forward today is not a small thing.',
    tip: 'At the end of the day, name one way you moved forward — however small. It counts.',
  },
];

export const NOTE_THEMES = [
  { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', ring: 'ring-yellow-300' },
  { name: 'Mint', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900', ring: 'ring-emerald-300' },
  { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-900', ring: 'ring-sky-300' },
  { name: 'Peach', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-900', ring: 'ring-orange-300' },
  { name: 'Lavender', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900', ring: 'ring-purple-300' },
  { name: 'Rose', bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-900', ring: 'ring-rose-300' },
];

// --- Audio Utility ---
export const SOUNDS = {
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  REWARD: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
  TRANSITION: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  POP: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
};

export const playSound = (url: string, volume: number = 0.3) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {}); 
};
