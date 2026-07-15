from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_MESSAGE_LEN = 300
MAX_DESCRIPTION_LEN = 500

PersonaType = Literal["fan", "volunteer", "organizer"]
LanguageCode = Literal["en", "es", "fr", "de", "pt", "ar"]
AccessibilityNeed = Literal["wheelchair", "visual_impairment", "hearing_impairment", "none"]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LEN, description="User message (max 300 chars)")
    location: Optional[str] = Field(None, max_length=100, description="User's current stadium location")
    language: LanguageCode = Field("en", description="Preferred language code")
    accessibility: Optional[AccessibilityNeed] = Field(None, description="Accessibility need")
    persona: PersonaType = Field("fan", description="User role")

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        """Strip leading/trailing whitespace and reject blank messages."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be blank.")
        return stripped


class NavigationRequest(BaseModel):
    current_location: str = Field(..., min_length=1, max_length=100)
    destination: str = Field(..., min_length=1, max_length=100)
    accessibility: Optional[AccessibilityNeed] = Field(None)


class IncidentRequest(BaseModel):
    incident_type: str = Field(..., min_length=1, max_length=50)
    location: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=MAX_DESCRIPTION_LEN)

    @field_validator("incident_type")
    @classmethod
    def validate_incident_type(cls, v: str) -> str:
        allowed = {"medical", "security", "maintenance", "crowd", "weather", "fire", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"incident_type must be one of: {', '.join(sorted(allowed))}")
        return v.lower()

