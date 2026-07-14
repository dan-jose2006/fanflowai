from fastapi import APIRouter, HTTPException
from app.schemas.requests import IncidentRequest
from app.schemas.responses import IncidentResponse
from app.services.context_builder import build_enriched_context
from app.services.groq_service import groq_service
from app.utils.data_loader import load_json_data, update_mock_state
import uuid

router = APIRouter(prefix="/incident", tags=["Incident"])

@router.post("", response_model=IncidentResponse)
async def report_incident(request: IncidentRequest):
    """
    Analyzes an incoming incident report and generates a structured summary with severity and recommendations.
    """
    try:
        context = await build_enriched_context(
            user_role="organizer",
            location=request.location
        )
        
        prompt = (
            f"Analyze this incident report and classify its severity and priority.\n"
            f"Type: {request.incident_type}\n"
            f"Location: {request.location}\n"
            f"Description: {request.description}\n"
        )
        
        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=context,
            response_model=IncidentResponse
        )
        
        # Save to mock in-memory state
        current_incidents = await load_json_data("incidents.json") or []
        new_incident = {
            "id": str(uuid.uuid4())[:8],
            "incident_type": request.incident_type,
            "location": request.location,
            "description": request.description,
            "incident_summary": response.incident_summary,
            "severity": response.severity,
            "priority": response.priority,
            "recommended_action": response.recommended_action
        }
        current_incidents.append(new_incident)
        await update_mock_state("incidents", current_incidents)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
