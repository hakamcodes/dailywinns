
import { FieldDefinition } from './types';

export const USER_INFO = {
  name: "Hakam"
};

export const LEVEL_SYSTEM = [
  { level: 1, name: "Novice", minPoints: 0 },
  { level: 2, name: "Initiate", minPoints: 1000 },
  { level: 3, name: "Explorer", minPoints: 1500 },
  { level: 4, name: "Scout", minPoints: 2100 },
  { level: 5, name: "Recruit", minPoints: 2800 },
  { level: 6, name: "Tinkerer", minPoints: 3600 },
  { level: 7, name: "Debugger", minPoints: 4500 },
  { level: 8, name: "Student", minPoints: 5500 },
  { level: 9, name: "Apprentice", minPoints: 6600 },
  { level: 10, name: "User", minPoints: 7800 },
  { level: 11, name: "Scripter", minPoints: 9100 },
  { level: 12, name: "Coder", minPoints: 10500 },
  { level: 13, name: "Developer", minPoints: 12000 },
  { level: 14, name: "Builder", minPoints: 13600 },
  { level: 15, name: "Engineer", minPoints: 15300 },
  { level: 16, name: "Technician", minPoints: 17100 },
  { level: 17, name: "Specialist", minPoints: 19000 },
  { level: 18, name: "Analyst", minPoints: 21000 },
  { level: 19, name: "Strategist", minPoints: 23100 },
  { level: 20, name: "Hacker", minPoints: 25300 },
  { level: 21, name: "Operator", minPoints: 27600 },
  { level: 22, name: "Controller", minPoints: 30000 },
  { level: 23, name: "Admin", minPoints: 32500 },
  { level: 24, name: "System Architect", minPoints: 35100 },
  { level: 25, name: "Adept", minPoints: 37800 },
  { level: 26, name: "Artisan", minPoints: 40600 },
  { level: 27, name: "Craftsman", minPoints: 43500 },
  { level: 28, name: "Expert", minPoints: 46500 },
  { level: 29, name: "Professional", minPoints: 49600 },
  { level: 30, name: "Master", minPoints: 52800 },
  { level: 31, name: "Innovator", minPoints: 56100 },
  { level: 32, name: "Visionary", minPoints: 59500 },
  { level: 33, name: "Mentor", minPoints: 63000 },
  { level: 34, name: "Leader", minPoints: 66600 },
  { level: 35, name: "Commander", minPoints: 70300 },
  { level: 36, name: "Virtuoso", minPoints: 74100 },
  { level: 37, name: "Sage", minPoints: 78000 },
  { level: 38, name: "Philosopher", minPoints: 82000 },
  { level: 39, name: "Luminary", minPoints: 86100 },
  { level: 40, name: "Titan", minPoints: 90300 },
  { level: 41, name: "Monolith", minPoints: 94600 },
  { level: 42, name: "Sovereign", minPoints: 99000 },
  { level: 43, name: "Ascendant", minPoints: 103500 },
  { level: 44, name: "Apex", minPoints: 108100 },
  { level: 45, name: "Oracle", minPoints: 112800 },
  { level: 46, name: "Transcendent", minPoints: 117600 },
  { level: 47, name: "Mythic", minPoints: 122500 },
  { level: 48, name: "Singularity", minPoints: 127500 },
  { level: 49, name: "Demigod", minPoints: 132600 },
  { level: 50, name: "Grandmaster", minPoints: 137800 }
];

export const TRACKER_FIELDS: Record<string, FieldDefinition> = {
  water: {
    id: "waterEntries",
    label: "Daily water intake",
    shortImportance: "Why this matters: Keeps you hydrated and helps energy & focus.",
    expandedImportance: "Proper hydration supports concentration, mood and overall energy levels — drinking water regularly helps you feel less tired during your day.",
    quickTips: ["Carry a 500ml bottle; set small hourly goals."],
    challenge: "Drink a full glass of water right now."
  },
  sleep: {
    id: "sleep",
    label: "Hours of sleep",
    shortImportance: "Why this matters: Good sleep boosts memory, mood and learning.",
    expandedImportance: "Consistent, sufficient sleep helps consolidate learning and keeps your focus sharp for all daily activities.",
    quickTips: ["Keep a regular bedtime; avoid screens 30 minutes before sleep."],
    challenge: "Set a 'lights out' alarm for 15 mins earlier tonight."
  },
  study: {
    id: "studySessions",
    label: "Productive hours & topics",
    shortImportance: "Why this matters: Tracking time helps measure progress and build consistency.",
    expandedImportance: "Recording sessions helps you spot what’s working, plan realistic goals, and reward consistent effort.",
    quickTips: ["Try short focused sessions (25–50 min) with short breaks.", "Add one topic per session; keep tags concise."],
    challenge: "Set a timer for 25 minutes of focused work now."
  },
  exercise: {
    id: "exercise",
    label: "Exercise done today",
    shortImportance: "Why this matters: Exercise boosts energy, reduces stress, and improves focus.",
    expandedImportance: "Even short, regular activity (walks, yoga, or a quick run) helps clear the mind and improves concentration.",
    quickTips: ["Try a 15-minute walk after a long work block."],
    challenge: "Do 10 jumping jacks or a quick stretch."
  },
  skincare: {
    id: "skincare",
    label: "Daily skincare routine",
    shortImportance: "Why this matters: Consistency in self-care builds discipline and confidence.",
    expandedImportance: "A regular skincare routine is more than hygiene; it's a mindful moment to start and end your day, improving skin health and self-image.",
    quickTips: ["Keep your products visible to remind you.", "Sunscreen is essential in the morning!"],
    challenge: "Go splash your face with cool water or apply some moisturizer."
  },
  meals: {
    id: "meals",
    label: "Meals eaten today",
    shortImportance: "Why this matters: Regular meals support steady energy and concentration.",
    expandedImportance: "Balanced meals at regular times keep your blood sugar stable and help sustain long focused periods without crashes.",
    quickTips: ["Include protein or fruit in at least one meal each day."],
    challenge: "Eat one piece of fruit with your next meal."
  },
  junkFood: {
    id: "junkFood",
    label: "Junk food consumed",
    shortImportance: "Why this matters: Track to notice patterns that affect energy or mood.",
    expandedImportance: "Occasional treats are fine; tracking helps identify if junk food is affecting sleep, energy, or motivation.",
    quickTips: ["Swap one snack for a healthier option, like fruit or nuts."],
    challenge: "Choose water over soda for your next drink."
  },
  screenTime: {
    id: "screenTime",
    label: "Screen time (mobile usage)",
    shortImportance: "Why this matters: Helps balance productive time and digital distractions.",
    expandedImportance: "Knowing how much time you spend on your phone helps you plan focused sessions and reduce unnecessary distractions.",
    quickTips: ["Use a 'do not disturb' window for focused work."],
    challenge: "Put your phone in another room for the next 30 minutes."
  },
  mood: {
    id: "mood",
    label: "Mood of the day",
    shortImportance: "Why this matters: Tracking mood builds emotional awareness and helps connect patterns to habits.",
    expandedImportance: "Noticing daily mood helps you understand what lifts you up or stresses you out so you can make small changes over time.",
    quickTips: ["If mood is low, try one small mood-boosting action (music, walk)."],
    challenge: "Listen to your favorite upbeat song for 3 minutes."
  },
  goals: {
    id: "goalsCompleted",
    label: "Daily goal completion",
    shortImportance: "Why this matters: Clear goals turn intentions into action and build momentum.",
    expandedImportance: "Marking goal completion helps keep motivation high and lets you celebrate small wins that lead to bigger achievements.",
    quickTips: ["Set 1–3 realistic goals each morning."],
    challenge: "Write down your top priority for tomorrow right now."
  },
  achievement: {
    id: "achievement",
    label: "One achievement of the day",
    shortImportance: "Why this matters: Celebrating wins reinforces positive habits.",
    expandedImportance: "Recording even small achievements trains your brain to focus on progress, which increases motivation and resilience.",
    quickTips: ["Write one short sentence — no need for big wins."],
    challenge: "Think of one tiny thing you're proud of from today."
  },
  journal: {
    id: "journal",
    label: "Daily thoughts / journal entry",
    shortImportance: "Why this matters: Writing clarifies feelings and reduces stress.",
    expandedImportance: "Journaling helps process the day, notice patterns, and capture ideas or questions to revisit later.",
    quickTips: ["Write for 3–5 minutes — it can be bullet points."],
    challenge: "Write just 3 bullet points about your day."
  },
  gratitude: {
    id: "gratitude",
    label: "Gratitude",
    shortImportance: "Why this matters: Small gratitude moments boost positivity and resilience.",
    expandedImportance: "Noting one thing you’re grateful for helps shift focus to positives and improves long-term outlook.",
    quickTips: ["Pick one tiny, specific thing (a cup of tea, a helpful friend)."],
    challenge: "Say 'thank you' to someone today."
  },
  social: {
    id: "social",
    label: "Social interaction",
    shortImportance: "Why this matters: Social contact supports mental well-being and balance.",
    expandedImportance: "Tracking social interactions helps ensure you’re staying connected — an important part of a healthy life.",
    quickTips: ["Schedule a short call or message to someone you care about."],
    challenge: "Send a quick 'thinking of you' text to a friend."
  },
  learning: {
    id: "newLearning",
    label: "New thing learned today",
    shortImportance: "Why this matters: Small learnings compound into expertise.",
    expandedImportance: "Recording new concepts or insights reinforces learning and creates a quick revision log for later.",
    quickTips: ["Write one line; include a keyword to search later."],
    challenge: "Look up one interesting fact about something new."
  },
  selfCare: {
    id: "selfCare",
    label: "Self-care done today",
    shortImportance: "Why this matters: Self-care prevents burnout and keeps motivation steady.",
    expandedImportance: "Regular self-care supports mental energy and makes productivity more sustainable over weeks and months.",
    quickTips: ["Pick one small self-care action daily — even 10 minutes counts."],
    challenge: "Spend 5 minutes doing something purely for fun."
  },
  nutritionScore: {
    id: "nutritionScore",
    label: "Nutrition quality score",
    shortImportance: "Why this matters: Quality of food affects energy & focus.",
    expandedImportance: "A simple daily rating helps you notice trends and make small improvements to meals over time.",
    quickTips: ["Try to include vegetables or protein in one meal each day."],
    challenge: "Add a serving of greens to your next meal."
  },
  distractions: {
    id: "distractions",
    label: "Distractions faced",
    shortImportance: "Why this matters: Identifying distractions helps you reduce them.",
    expandedImportance: "Recording distractions makes it easier to redesign your environment and routine to be more productive.",
    quickTips: ["Pick the top 1–2 distractions and try one specific fix."],
    challenge: "Clear your desk of all non-essential items."
  },
  negativeThought: {
    id: "negativeThought",
    label: "Negative thought noticed",
    shortImportance: "Why this matters: Noticing negative thoughts helps reduce their power.",
    expandedImportance: "Naming negative thoughts (briefly) is a first step to reframing them and protecting focus.",
    quickTips: ["Write the thought, then write one fact that counters it."],
    challenge: "Acknowledge one negative thought and let it go."
  },
  peace: {
    id: "peaceLevel",
    label: "Peace level at end of day",
    shortImportance: "Why this matters: Measures calmness and recovery after effort.",
    expandedImportance: "Noticing how peaceful you feel helps balance work intensity with restorative time.",
    quickTips: ["If peace is low, try a short breathing exercise before bed."],
    challenge: "Take 3 deep, mindful breaths."
  },
  dayRating: {
    id: "dayRating",
    label: "Overall day rating",
    shortImportance: "Why this matters: A quick holistic check-in to track trends.",
    expandedImportance: "A single rating helps you scan long-term patterns and compare your best and worst days.",
    quickTips: ["Think about energy, focus and mood — pick one number."],
    challenge: "Think of one reason today was better than zero."
  },
  weeklyReview: {
    id: "weeklyReflection",
    label: "Weekly Reflection",
    shortImportance: "Why this matters: Weekly review turns data into insight and plans.",
    expandedImportance: "Weekly reflection helps you set small next-week goals based on patterns and wins.",
    quickTips: ["List one thing to repeat next week and one change to try."],
    challenge: "Schedule your next week's focus session."
  },
  monthlyReview: {
    id: "monthlyReview",
    label: "Monthly Life Review",
    shortImportance: "Why this matters: Monthly reviews show meaningful progress over time.",
    expandedImportance: "Monthly insights help you celebrate growth and adjust long-term plans.",
    quickTips: ["Pick 1–2 wins to celebrate each month."],
    challenge: "Treat yourself for staying consistent this month!"
  },
  correlation: {
    id: "correlation",
    label: "Habit Correlation",
    shortImportance: "Why this matters: Correlations reveal hidden relationships that can guide change.",
    expandedImportance: "Seeing how sleep links to mood or how screen time links to focus helps you prioritize the most effective habit changes.",
    quickTips: ["Review correlations monthly and try one small test (e.g., sleep earlier on 3 nights)."],
    challenge: "Try changing one habit linked to your best moods."
  },
  printReport: {
    id: "printReport",
    label: "Print-friendly report",
    shortImportance: "Why this matters: A printable report helps reflect and share progress (or keep personal records).",
    expandedImportance: "A well-formatted print or PDF makes it easy to review achievements, patterns, and goals offline.",
    quickTips: ["Print or export at month end as a personal snapshot."],
    challenge: "Keep a physical folder of your monthly growth."
  }
};
