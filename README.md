# 🚀 Job Tracker Dashboard

A scalable **React + TypeScript** application for managing and optimizing the job search process.

Built with modern frontend architecture principles, Firebase backend integration, and production-grade tooling.

---

## 📈 Application Funnel Approach

This app treats job searching as a measurable process:

📥 Applied

📞 HR Contact

🧪 Technical Interview

🏢 Final Interview

❌ Rejected

✅ Offer

This allows users to:

Track application progress visually (Kanban)

Measure conversion between stages

Identify weak points in the funnel

Improve strategy over time

## 🎯 Who Is It For?

Candidates applying for Ausbildung in Germany

Junior developers

Career switchers

Anyone managing 20–100+ applications

## 📊 How It Helps

Instead of randomly sending CVs, users can:

Organize applications into structured cycles (Loops)

Analyze response rates

Track which platforms bring results

Maintain motivation through visual progress

Make data-driven improvements

## 🎯 Project Purpose

This project demonstrates real-world frontend development skills including:

- Modular architecture design
- Authentication & secure data access
- State management
- Scalable project structure
- Code quality automation
- UI/UX best practices

---

## ✨ Core Features

🔐 **Authentication**

- Firebase Auth (Google OAuth + Email/Password)
- Persistent sessions
- Secure per-user data isolation

📊 **Dashboard**

- Progress overview
- Analytics widgets
- Activity tracking

📂 **Loops Management**

- Organize job search cycles
- Structured workflow tracking

📄 **Matches Module**

- Filtering & pagination
- URL-synced filters
- Proper loading/error/empty states

📌 **Kanban Board**

- Drag & drop powered by `@dnd-kit`
- Status-based workflow visualization

🌍 **Internationalization**

- English (default)
- Russian
- German
- Lazy-loaded translations

🎨 **Light/Dark Theme**

- System preference detection
- Persistent theme selection

🧪 **Code Quality**

- TypeScript strict mode
- ESLint
- dependency-cruiser
- madge (circular dependency detection)
- jscpd (duplicate detection)

---

## 🛠 Tech Stack

### Core

- React
- TypeScript
- React Router
- Redux Toolkit

### UI & UX

- Tailwind CSS
- Radix UI
- Framer Motion
- Tremor
- Lucide Icons

### Forms & Validation

- Formik
- Yup

### Backend

- Firebase Authentication
- Firestore

### Tooling

- Webpack (custom config)
- ESLint
- TypeScript (tsc)

---

## 🧠 Architecture

Feature-Sliced Design structure:

src/
app/
pages/
features/
entities/
shared/

This approach ensures scalability, separation of concerns, and maintainability.

---

## ⚙️ Getting Started

Install dependencies:

npm install

Create `.env` file:

FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_URL=/job_tracker_dashboard

Start development server:

npm run dev

---

## 📌 License

ISC
