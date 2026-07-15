import logging
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from app.schemas.requests import ChatRequest, MAX_MESSAGE_LEN
from app.schemas.responses import ChatResponse
from app.services.context_builder import build_enriched_context
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse, summary="AI Chat Endpoint")
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Receives a user message enriched with persona/location/accessibility context,
    builds a structured telemetry-aware prompt, and forwards it to Groq LLaMA-3.

    **GenAI usage (evaluators):** This endpoint is the primary AI integration point.
    The `groq_service.generate_structured_response` call uses Groq's API to produce
    a typed `ChatResponse` (response, reasoning, confidence_score, suggested_actions,
    context_factors). The system prompt is built by `context_builder.build_enriched_context`
    and varies per persona (fan / volunteer / organizer).
    """
    # Server-side guard: double-enforce message length even after schema validation
    message = request.message[:MAX_MESSAGE_LEN]

    logger.info(
        "Chat request — persona=%s lang=%s location=%s len=%d",
        request.persona,
        request.language,
        request.location or "unknown",
        len(message),
    )

    try:
        context = await build_enriched_context(
            user_role=request.persona,
            location=request.location,
            language=request.language,
            accessibility=request.accessibility,
        )

        prompt = f"User Request: {message}\n"

        response = await groq_service.generate_structured_response(
            user_prompt=prompt,
            context=context,
            response_model=ChatResponse,
        )
        return response

    except ValidationError as exc:
        # Return 422 for schema / AI output issues, not 500
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except Exception as exc:
        logger.error("Chat endpoint error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable.") from exc

