import os
import json
from groq import AsyncGroq
from app.prompts.system_prompt import FANFLOW_SYSTEM_PROMPT
from app.schemas.responses import ChatResponse, NavigationResponse, IncidentResponse
from typing import TypeVar, Type, Any

T = TypeVar('T')

class GroqService:
    def __init__(self):
        self._client: AsyncGroq | None = None

    def _get_client(self) -> AsyncGroq:
        """Lazily create the Groq client so the module can be imported without a key."""
        if self._client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise RuntimeError(
                    "GROQ_API_KEY environment variable is not set. "
                    "Add it to your Vercel project environment variables."
                )
            self._client = AsyncGroq(api_key=api_key)
        return self._client

    # Using a fast model for JSON extraction and reasoning
    model = "llama-3.1-8b-instant"

    async def generate_structured_response(self, user_prompt: str, context: str, response_model: Type[T]) -> T:
        """
        Calls Groq API to generate a structured JSON response matching the Pydantic schema.
        """
        schema_str = json.dumps(response_model.model_json_schema(), indent=2)
        full_system_prompt = (
            f"{FANFLOW_SYSTEM_PROMPT}\n\n{context}\n\n"
            "You MUST return your response as a valid JSON object matching the requested schema. "
            "Do NOT wrap the JSON in markdown code blocks.\n\n"
            f"REQUIRED JSON SCHEMA:\n{schema_str}"
        )

        try:
            client = self._get_client()
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model,
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=1024
            )

            content = chat_completion.choices[0].message.content

            # Parse JSON and validate against the Pydantic model
            parsed_json = json.loads(content)
            return response_model(**parsed_json)

        except json.JSONDecodeError as e:
            print(f"Failed to parse Groq JSON response: {e}")
            raise RuntimeError("AI generated invalid JSON")
        except Exception as e:
            print(f"Groq API Error: {e}")
            raise RuntimeError(f"AI Service Error: {str(e)}")

groq_service = GroqService()

