from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from app.api import chat, navigation, dashboard, incident, simulator, match

app = FastAPI(
    title="FanFlow AI Backend API",
    description="A generative AI-powered Stadium Operations Copilot for the FIFA World Cup 2026.",
    version="1.0.0"
)

# Configure CORS so the frontend can hit these APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api/v1")
app.include_router(navigation.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(incident.router, prefix="/api/v1")
app.include_router(simulator.router, prefix="/api/v1")
app.include_router(match.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
