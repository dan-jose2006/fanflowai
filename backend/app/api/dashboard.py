from fastapi import APIRouter, HTTPException
from app.schemas.responses import DashboardResponse
from app.utils.data_loader import get_all_mock_context, load_json_data
from app.services.groq_service import groq_service
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard():
    """
    Returns aggregated stadium telemetry metrics for dashboards.
    """
    try:
        telemetry = await get_all_mock_context()
        incidents = await load_json_data("incidents.json") or []
        medical = await load_json_data("medical.json") or []
        
        
        # Simple predictive heuristics for insights
        insights = []
        for c in telemetry.get("crowd", []):
            if c.get("density", 0) > 90:
                insights.append({"type": "critical", "message": f"{c['name']} is reaching critical capacity. Redirect traffic immediately."})
            elif c.get("density", 0) > 75:
                insights.append({"type": "warning", "message": f"{c['name']} density is high. Consider deploying volunteers."})
                
        for t in telemetry.get("transport", []):
            if t.get("status") == "Delayed":
                insights.append({"type": "warning", "message": f"Transport delay on {t.get('line', 'Route')}. Announce alternative routes."})

        # Append persisted incidents / medical requests
        for inc in incidents:
            severity = inc.get("severity", "warning").lower()
            insights.append({
                "type": severity if severity in ["critical", "warning", "info"] else "warning",
                "message": f"[{inc.get('incident_type').upper()}] at {inc.get('location')}: {inc.get('description')} ({inc.get('incident_summary')}). Rec action: {inc.get('recommended_action')}"
            })
        
        return DashboardResponse(
            crowd_levels=telemetry.get("crowd", []),
            parking_status=telemetry.get("parking", []),
            food_court_status=telemetry.get("food", []),
            transport_status=telemetry.get("transport", []),
            weather=telemetry.get("weather", {}),
            medical_requests=medical,
            incident_summary=incidents,
            active_insights=insights
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SummaryResponse(BaseModel):
    summary: str
    recommendations: list[str]

@router.post("/summary", response_model=SummaryResponse)
async def generate_match_summary():
    try:
        context = await get_all_mock_context()
        prompt = "Generate an Executive Match Summary. Provide an overview of attendance, incidents, and wait times based on the current context."
        
        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=str(context),
            response_model=SummaryResponse
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnnouncementRequest(BaseModel):
    issue_type: str
    language: str

class AnnouncementResponse(BaseModel):
    announcement_text: str

@router.post("/announcement", response_model=AnnouncementResponse)
async def generate_announcement(req: AnnouncementRequest):
    try:
        context = await get_all_mock_context()
        prompt = f"Generate a public address announcement for the stadium in {req.language} regarding a {req.issue_type}."
        
        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=str(context),
            response_model=AnnouncementResponse
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
