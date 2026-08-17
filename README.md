# InterviewIQ — AI-Powered Mock Interview Platform

InterviewIQ helps candidates prepare for technical and behavioral interviews by analyzing their resume, generating tailored questions, and delivering instant AI feedback.

---

## Tech Stack

| Layer     | Technology                                         |
| --------- | -------------------------------------------------- |
| Frontend  | React 19 (Vite), Tailwind CSS v4, React Router v7  |
| State     | Zustand                                            |
| Forms     | React Hook Form                                    |
| HTTP      | Axios                                              |
| Toasts    | React Hot Toast                                    |
| Icons     | Lucide React                                       |
| Backend   | Node.js, Express                                   |
| Database  | MongoDB, Mongoose                                  |
| Security  | Helmet, CORS, express-rate-limit, cookie-parser    |
| Logging   | Morgan                                             |

---

## Project Structure

```
InterviewIQ/
├── client/                     # React (Vite) frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── landing/        # Hero, Features sections
│       │   └── layout/         # Navbar, Footer
│       ├── hooks/              # Custom React hooks (Phase 2+)
│       ├── lib/
│       │   └── axios.js        # Pre-configured Axios instance
│       ├── pages/              # One file per route
│       ├── router/
│       │   └── index.jsx       # Centralized route config
│       ├── store/
│       │   └── useAuthStore.js # Zustand auth state
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
└── server/                     # Express backend
    ├── src/
    │   ├── config/
    │   │   └── db.js           # MongoDB connection
    │   ├── controllers/        # Route handlers (Phase 2+)
    │   ├── middleware/
    │   │   ├── errorHandler.js
    │   │   ├── notFound.js
    │   │   └── rateLimiter.js
    │   ├── routes/
    │   │   └── healthRoutes.js
    │   └── app.js              # Express app config
    └── server.js               # Entry point
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone and install

```bash
git clone https://github.com/your-username/interviewiq.git
cd interviewiq
```

### 2. Set up the server

```bash
cd server
cp .env.example .env     # fill in MONGO_URI
npm install
npm run dev
```

Server runs on: `http://localhost:5000`

### 3. Set up the client

```bash
cd client
npm install
npm run dev
```

Client runs on: `http://localhost:5173`

### 4. Verify

```bash
# Health check
curl http://localhost:5000/api/health
# Expected: { "success": true, "message": "InterviewIQ API Running" }
```

---

## Available Scripts

### Server (`/server`)

| Script          | Description                   |
| --------------- | ----------------------------- |
| `npm run dev`   | Start with nodemon (watch)    |
| `npm start`     | Start in production mode      |
| `npm run lint`  | Run ESLint                    |
| `npm run format`| Format with Prettier          |

### Client (`/client`)

| Script           | Description                   |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start Vite dev server         |
| `npm run build`  | Production build              |
| `npm run preview`| Preview production build      |
| `npm run lint`   | Run ESLint                    |
| `npm run format` | Format with Prettier          |

---

## API Endpoints

### Phase 1

| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| GET    | /api/health  | API liveness probe          |

---

## Environment Variables

See `server/.env.example` and `client/.env.example` for all required variables.

---

## Roadmap

| Phase | Scope                                     |
| ----- | ----------------------------------------- |
| ✅ 1  | Project foundation, routing, health API   |
| 2     | Authentication (JWT, cookies)             |
| 3     | Resume upload (Multer + Cloudinary)       |
| 4     | AI question generation (OpenAI / Gemini)  |
| 5     | Analytics, reports, dashboard             |

---

## License

MIT
