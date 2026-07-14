from fastapi import APIRouter, HTTPException
from app.schemas.requests import NavigationRequest
from app.schemas.responses import NavigationResponse
from app.services.context_builder import build_enriched_context
from app.services.groq_service import groq_service

router = APIRouter(prefix="/navigation", tags=["Navigation"])

@router.post("", response_model=NavigationResponse)
async def navigation_endpoint(request: NavigationRequest):
    """
    Generates smart routing from current_location to destination, avoiding high crowd density areas.
    """
    try:
        context = await build_enriched_context(
            user_role="fan",
            location=request.current_location,
            accessibility=request.accessibility
        )
        
        prompt = (
            f"Please provide the best route.\n"
            f"Start: {request.current_location}\n"
            f"Destination: {request.destination}\n"
            f"Accessibility Needs: {request.accessibility or 'None'}\n"
            f"Factor in the current crowd densities from the context to avoid bottlenecks."
        )
        
        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=context,
            response_model=NavigationResponse
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
