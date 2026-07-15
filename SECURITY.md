# Security Policy — FanFlow AI

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ Active |
| 1.0.x   | ❌ No longer supported |

---

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Instead, email the maintainer at: `security@fanflow-ai.example.com` (placeholder — replace with real contact).

We aim to acknowledge reports within **48 hours** and to publish a fix within **7 days** for critical issues.

---

## Security Controls Implemented

### Frontend

| Control | Implementation |
|--------|----------------|
| **HTTP Security Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and a scoped `Content-Security-Policy` — all applied via `vercel.json` |
| **Input length limiting** | Chat input capped at 300 characters in both the UI (`maxLength`) and API schema |
| **No secrets in code** | All API keys are loaded from environment variables. `.env` files are excluded by `.gitignore`. A `.env.example` template is provided |
| **Abort controller** | Fetch requests have a 10-second timeout via `AbortController` — prevents hanging connections |

### Backend

| Control | Implementation |
|--------|----------------|
| **Input validation** | Pydantic v2 models with strict field types, `min_length`/`max_length` constraints, and `Literal` enums for `persona`, `language`, and `accessibility_need` |
| **Prompt injection mitigation** | User messages are stripped and capped at 300 characters before being included in LLM prompts. Persona and language are enum-constrained so they cannot be free-text injected |
| **CORS hardening** | `allow_origins` restricted to explicit frontend URLs (configurable via `ALLOWED_ORIGINS` env var). Wildcards removed in v1.1.0 |
| **Error handling** | `ValidationError` returns 422 (not 500). Generic exceptions return `"AI service temporarily unavailable."` without exposing internal stack traces |
| **No credentials in CORS** | `allow_credentials=False` — no cookies or credentials are exchanged |
| **Logging** | Requests are logged with persona, language, location, and message length — but **never** the raw message content |

---

## Known Limitations (Hackathon Scope)

- **Rate limiting** is not yet implemented. In production, use a reverse proxy (Nginx / Cloudflare) or FastAPI middleware (e.g., `slowapi`).
- **Authentication** is not implemented — all endpoints are public. In production, JWT or OAuth2 would be added.
- **Database** is in-memory (JSON files). No PII is stored, but a real deployment would use an encrypted database with access controls.
- **AI output** is not filtered for harmful content beyond Groq's built-in safety. A moderation layer (OpenAI Moderation API or similar) would be added in production.

---

## Data Handling

- No personal data is stored persistently.
- Stadium telemetry data is **simulated** (clearly labelled in the UI with a `⚠️ Simulated data` badge on all AI responses using fallback data).
- Live match data (if `API_SPORTS_KEY` is configured) comes from the API-Sports public API — no user data is shared with that service.
