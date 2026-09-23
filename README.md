<div align="center">

# 🏆 Daily Wins
### Your all-in-one life operating system

**Track habits · Log your day · Build streaks · Earn points · Grow daily**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dailywinns.vercel.app-indigo?style=for-the-badge)](https://dailywinns.vercel.app)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey?style=for-the-badge)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)

</div>

---

## What is Daily Wins?

Daily Wins is a **progressive web app** that replaces 10 different habit/productivity apps with one. Log your entire day — sleep, water, study, exercise, mood, money, screen time — earn life score points for consistency, and visualise your progress over time.

Built as a solo project. No ads. No subscriptions. Free forever.

---

## Features

| Module | What it does |
|---|---|
| 📅 **Today** | Daily log — mood, sleep, water, meals, energy, journal, gratitude, habits |
| 🔥 **Habits** | Custom habits with streaks, points, and completion tracking |
| 🧠 **Skills** | Track hours invested in any skill (guitar, coding, art...) toward mastery goals |
| 🎯 **Goals** | Weekly/monthly targets with progress visualisation |
| 💰 **Money** | Income/expense tracker with categories and daily summaries |
| 📈 **Trends** | Charts for mood, sleep, water, study, exercise over time |
| 🔄 **Review** | Weekly and monthly reflections |
| 🏅 **Rewards** | Redeem life score points for self-defined rewards |
| 🖼️ **Gallery** | Photo memory wall — capture your wins visually |
| 📝 **Sticky Notes** | Quick reference notes always one tap away |
| ⚙️ **Settings** | Full data export/import backup, app lock, dark mode, custom targets |

---

## Tech Stack

- **Frontend** — React 19, TypeScript, Tailwind CSS
- **Backend** — Firebase Auth (Google Sign-In), Cloud Firestore
- **Offline** — PWA with IndexedDB persistent cache (works without internet after first load)
- **Hosting** — Netlify
- **Build** — Vite 6

---

## Local Setup

**Prerequisites:** Node.js 18+, a Firebase project

**1. Clone the repo**
```bash
git clone https://github.com/your-username/daily-wins.git
cd daily-wins
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a Firebase project**
- Go to [Firebase Console](https://console.firebase.google.com) → New Project
- Enable **Authentication** → Google sign-in provider
- Enable **Firestore Database**
- Register a **Web App** and copy your config

**4. Add your Firebase config**

Open `firebase.ts` and replace the `firebaseConfig` values with your own project's config from the Firebase Console.

**5. Set Firestore Security Rules**

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**6. Run the app**
```bash
npm run dev
```

Open `http://localhost:3000`

---

## Project Structure

```
├── App.tsx                  # Root — auth, data loading, routing
├── firebase.ts              # Firebase initialisation
├── types.ts                 # All TypeScript interfaces
├── constants.ts             # App-wide constants and sounds
├── helpers.ts               # Pure utility functions
├── views/
│   ├── TodayView.tsx        # Daily log
│   ├── HabitsView.tsx       # Habit tracker
│   ├── SkillTreeView.tsx    # Skill hours tracker
│   ├── GoalsView.tsx        # Goals & targets
│   ├── TrendsView.tsx       # Charts & analytics
│   ├── MoneyView.tsx        # Finance tracker
│   ├── RewardsView.tsx      # Rewards system
│   ├── ReviewView.tsx       # Weekly/monthly review
│   ├── GalleryView.tsx      # Photo gallery
│   ├── StickyNotesView.tsx  # Quick notes
│   └── SettingsView.tsx     # Settings & data management
└── components/              # Shared UI components
```

---

## License

Copyright © 2026 Hakam Singh Lodhi

This project is licensed under **CC BY-NC-ND 4.0** — you may view and share it with attribution, but you may not modify it or use it commercially. See [LICENSE](LICENSE) for full terms.

---

<div align="center">
  Built with focus and consistency · <a href="https://dailywinns.vercel.app">Try it live</a>
</div>
