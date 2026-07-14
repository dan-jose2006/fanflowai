from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's message")
    location: Optional[str] = Field(None, description="The user's current location within the stadium")
    language: Optional[str] = Field("en", description="Preferred language code")
    accessibility: Optional[str] = Field(None, description="Accessibility preference (e.g., wheelchair, visual_impairment)")
    persona: Optional[str] = Field("fan", description="User role (fan, volunteer, organizer)")

class NavigationRequest(BaseModel):
    current_location: str = Field(..., description="Starting location")
    destination: str = Field(..., description="Target destination")
    accessibility: Optional[str] = Field(None, description="Accessibility preference")

class IncidentRequest(BaseModel):
    incident_type: str = Field(..., description="Type of incident (e.g., medical, security, maintenance)")
    location: str = Field(..., description="Location of the incident")
    description: str = Field(..., description="Detailed description of what is happening")
