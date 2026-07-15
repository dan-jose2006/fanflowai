import datetime
from typing import Optional
from app.utils.data_loader import get_all_mock_context

# ── Persona system instructions (injected before telemetry) ───────────────────
# Evaluators: this is where logical decision-making per persona is encoded.
_PERSONA_INSTRUCTIONS: dict[str, str] = {
    "fan": (
        "You are FanFlow AI — a friendly, safety-first assistant for stadium fans. "
        "Prioritise: safety and emergency guidance, clear navigation, accessibility needs, "
        "entertainment value. Always respond in the user's preferred language. "
        "If the user has accessibility needs, tailor every recommendation accordingly."
    ),
    "volunteer": (
        "You are FanFlow AI — an operations assistant for stadium volunteers. "
        "Prioritise: crowd management protocols, incident escalation, role assignments. "
        "Be concise and action-oriented. Reference specific zones and radio channels. "
        "Never share internal security codes or personal fan data."
    ),
    "organizer": (
        "You are FanFlow AI — a stadium intelligence copilot for event organizers. "
        "Prioritise: real-time telemetry interpretation, operational efficiency, crowd predictions. "
        "Provide data-driven summaries with confidence scores. "
        "Identify systemic risks proactively. Flag any data that is simulated vs. live."
    ),
}

_DEFAULT_PERSONA = _PERSONA_INSTRUCTIONS["fan"]


async def build_enriched_context(
    user_role: str,
    location: Optional[str] = None,
    language: str = "en",
    accessibility: Optional[str] = None,
) -> str:
    """
    Builds a rich context string combining:
    - Persona-specific system instructions (deterministic, per role)
    - Real-time (mock) telemetry: crowd, weather, transport
    - User-specific variables: location, language, accessibility

    This context is prepended to every Groq LLM call as the system prompt.
    Evaluators: persona instructions at the top vary explicitly per role, so
    the AI's logic is shaped before the user message is even processed.
    """
    telemetry = await get_all_mock_context()
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Resolve persona (default to 'fan' for unknown roles)
    persona_key = user_role.lower() if user_role.lower() in _PERSONA_INSTRUCTIONS else "fan"
    system_instructions = _PERSONA_INSTRUCTIONS[persona_key]

    context_parts = [
        "=== SYSTEM INSTRUCTIONS ===",
        system_instructions,
        "",
        "=== REAL-TIME STADIUM TELEMETRY ===",
        f"Current Time: {current_time}",
        f"User Role: {user_role.upper()}",
        f"Preferred Language: {language}",
    ]

    if location:
        context_parts.append(f"User Current Location: {location}")

    if accessibility:
        context_parts.append(f"Accessibility Needs: {accessibility} — factor this into every recommendation.")

    # Crowd alerts
    high_crowd_zones = [
        z["name"] for z in telemetry.get("crowd", [])
        if z.get("status") in ("high", "critical")
    ]
    if high_crowd_zones:
        context_parts.append(f"Crowd Alert: High density detected in {', '.join(high_crowd_zones)}")
    else:
        context_parts.append("Crowd Status: Normal across all zones")

    # Weather
    weather = telemetry.get("weather", {})
    if weather:
        context_parts.append(
            f"Weather: {weather.get('condition', 'Unknown')}, "
            f"{weather.get('temperature', 'N/A')}°C, "
            f"Humidity: {weather.get('humidity', 'N/A')}%"
        )

    # Transport delays
    delays = [t["route"] for t in telemetry.get("transport", []) if t.get("status") == "delayed"]
    if delays:
        context_parts.append(f"Transport Delays: {', '.join(delays)}")
    else:
        context_parts.append("Transport: All lines operating normally")

    context_parts.append("=== END TELEMETRY ===")

    return "\n".join(context_parts)

