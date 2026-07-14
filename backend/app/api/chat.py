from fastapi import APIRouter, HTTPException
from app.schemas.requests import ChatRequest
from app.schemas.responses import ChatResponse
from app.services.context_builder import build_enriched_context
from app.services.groq_service import groq_service
import json

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Handles user chat messages, enriches the prompt with real-time stadium context, 
    and returns a structured AI response.
    """
    try:
        # Build enriched context string
        context = await build_enriched_context(
            user_role=request.persona,
            location=request.location,
            language=request.language,
            accessibility=request.accessibility
        )
        
        # User prompt structure
        prompt = f"User Request: {request.message}\n"
        
        # Generate structured response from Groq
        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=context,
            response_model=ChatResponse
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
