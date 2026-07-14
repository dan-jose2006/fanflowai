from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class ChatResponse(BaseModel):
    response: str
    reasoning: Optional[str] = None
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
    suggested_actions: List[str] = Field(default_factory=list)
    context_factors: List[str] = Field(default_factory=list)

class RouteStep(BaseModel):
    instruction: str
    duration_mins: int
    crowd_density: str

class NavigationResponse(BaseModel):
    best_route: List[RouteStep]
    estimated_time_mins: int
    crowd_density: str
    alternative_routes: List[str] = Field(default_factory=list)
    reasoning: str

class DashboardResponse(BaseModel):
    crowd_levels: List[Dict[str, Any]]
    parking_status: List[Dict[str, Any]]
    food_court_status: List[Dict[str, Any]]
    transport_status: List[Dict[str, Any]]
    weather: Dict[str, Any]
    medical_requests: List[Dict[str, Any]] = Field(default_factory=list)
    incident_summary: List[Dict[str, Any]] = Field(default_factory=list)
    active_insights: List[Dict[str, Any]] = Field(default_factory=list)

class IncidentResponse(BaseModel):
    incident_summary: str
    severity: str
    priority: str
    recommended_action: str
