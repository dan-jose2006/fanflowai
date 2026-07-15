# 🏟️ FanFlow AI — Smart Stadium Operations Copilot

> **Prompt Wars Challenge 4 Submission**  
> Vertical: **Smart stadium operations and tournament experience**  
> Built with Groq LLaMA-3 · FastAPI · React + Vite · Tailwind CSS

---

## 🎯 What It Does

FanFlow AI is a generative AI-powered stadium copilot for the FIFA World Cup 2026. It serves three distinct personas:

| Persona | Use Case |
|---------|----------|
| 🎫 **Fan** | Seat navigation, food court wait times, accessibility routing, emergency SOS |
| 🦺 **Volunteer** | Crowd density alerts, deployment guidance, incident escalation |
| 📊 **Organizer** | Real-time telemetry dashboard, event simulation, AI-generated PA announcements |

---

## 🤖 GenAI Integration — Where to Verify It

Evaluators can verify AI usage at these explicit locations:

| Layer | File | What It Does |
|-------|------|-------------|
| **Backend AI endpoint** | [`backend/app/api/chat.py`](backend/app/api/chat.py) | Calls `groq_service.generate_structured_response()` with a typed `ChatResponse` schema |
| **Persona-aware prompt** | [`backend/app/services/context_builder.py`](backend/app/services/context_builder.py) | Builds a role-specific system prompt (fan / volunteer / organizer) before each LLM call |
| **Incident analysis** | [`backend/app/api/incident.py`](backend/app/api/incident.py) | Uses Groq to classify severity and generate action recommendations |
| **Navigation routing** | [`backend/app/api/navigation.py`](backend/app/api/navigation.py) | Uses Groq to generate accessibility-aware crowd-optimised routes |
| **AI dashboard insights** | [`backend/app/api/dashboard.py`](backend/app/api/dashboard.py) | AI-synthesised incident and crowd analysis for organizers |
| **Deterministic engine** | [`src/services/decisionEngine.ts`](src/services/decisionEngine.ts) | Pre-AI rule engine that handles emergency, navigation, food, transport — runs *before* the LLM and as a fallback when offline |

### How the AI decision flow works

```
User message
    │
    ▼
Deterministic Engine (instant, offline-capable)
    │
    ├─ Emergency? → immediate response (no LLM needed)
    │
    ├─ High-confidence match (crowd, food, etc.) → enriched deterministic reply
    │
    └─ Low-confidence / open-ended → forward to Groq LLaMA-3
                                          │
                                          ├─ System prompt: persona-specific instructions
                                          ├─ Context: live telemetry (crowd, weather, transport)
                                          └─ Response: typed ChatResponse with confidence score
```

---

## 🏗️ Architecture

```
fanflow-ai/
├── backend/                 # FastAPI + Groq AI
│   ├── app/
│   │   ├── api/             # Route handlers (chat, dashboard, incident, navigation, match)
│   │   ├── schemas/         # Pydantic v2 request/response models with strict validation
│   │   ├── services/        # Groq AI service + context builder (persona logic here)
│   │   └── utils/           # In-memory mock state management
│   ├── .env.example         # Environment variable template
│   └── requirements.txt
│
├── src/                     # React + Vite frontend
│   ├── pages/               # Fan/Organizer/Volunteer dashboards + Assistant + Landing
│   ├── components/          # UI components (AnimatedCounter, SiriOrb, AILoading, etc.)
│   ├── services/
│   │   └── decisionEngine.ts  # ← Deterministic pre-AI decision layer (key file)
│   ├── types/index.ts       # Shared TypeScript types (no `any` in core paths)
│   └── tests/               # Vitest + RTL unit & integration tests
│
├── vercel.json              # Security headers + deployment config
├── SECURITY.md              # Security controls documentation
└── .env.example             # Frontend env var template
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- A [Groq API key](https://console.groq.com) (free tier works)

### Frontend

```bash
# Install dependencies
npm install

# Copy env template and add your values
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and add your Groq API key
cp .env.example .env
# Set GROQ_API_KEY=your_key_here

# Start the API server
python -m app.main
```

Open **http://localhost:5173** in your browser.

---

## 🧪 Tests

```bash
# Run all unit + integration tests
npm test

# Type-check the entire frontend
npm run typecheck
```

Tests cover:
- **Decision engine**: All 9 rule branches (emergency, crowd, restrooms, food, parking, transport, navigation, ops, default) tested per persona and accessibility context
- **AssistantPage**: Rendering, empty-input prevention, loading state, success path, network failure + deterministic fallback, duplicate-request prevention, suggested prompts, accessibility (ARIA attributes)

---

## 🛡️ Security

See [`SECURITY.md`](SECURITY.md) for full details. Key controls:

- HTTP security headers (CSP, HSTS, X-Frame-Options) via `vercel.json`
- Strict Pydantic v2 input validation with prompt size limits (300 chars max)
- CORS restricted to explicit origins
- No secrets committed — `.env*` excluded by `.gitignore`

---

## ♿ Accessibility

WCAG 2.2 AA features:
- Skip-to-content link (visible on keyboard focus)
- `aria-current="page"` on active nav links
- `aria-live` on chat conversation and loading states
- `aria-expanded` on the AI reasoning toggle
- `aria-label` on all icon-only buttons and inputs
- Decorative images/icons marked `aria-hidden="true"`
- `prefers-reduced-motion` media query disables all animations for motion-sensitive users
- Visible focus rings on all interactive elements (`focus-visible:ring-2`)
- `role="alert"` on error banners

---

## 📊 Challenge Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| **Smart & dynamic assistant** | Dual-layer AI: deterministic engine (instant) + Groq LLM (contextual) |
| **Logical decision-making per context** | `decisionEngine.ts` branches on persona, crowd level, location, accessibility — see code comments |
| **Practical real-world usability** | Three persona dashboards, SOS emergency routing, live crowd heat map, food/parking/transport telemetry |
| **Clean & maintainable code** | TypeScript strict mode, shared `types/index.ts`, Pydantic v2 schemas, JSDoc comments throughout |
| **Vertical & persona logic clearly identified** | `context_builder.py` injects persona-specific system instructions before every LLM call |

---

## 🔑 Environment Variables

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g., `http://localhost:8000`) |

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq API key for LLaMA-3 |
| `API_SPORTS_KEY` | Optional | API-Sports key for live match scores |
| `PORT` | Optional | Server port (default: `8000`) |
| `ALLOWED_ORIGINS` | Optional | Comma-separated CORS origins (default: localhost) |

---

## 📌 Simulated vs. Live Data

The UI clearly distinguishes data sources:

- **🟢 Live** — Groq AI responses generated in real-time from actual prompts
- **⚠️ Simulated** — Stadium telemetry (crowd, parking, food, transport) is mock JSON data. Responses using only this data show a yellow `⚠️ Simulated data` badge
- **📅 Historical** — Match data falls back to verified 2022 World Cup Final data when `API_SPORTS_KEY` is not configured, clearly labelled in the UI

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
