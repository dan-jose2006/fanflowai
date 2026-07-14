import os
import json
from groq import AsyncGroq
from app.prompts.system_prompt import FANFLOW_SYSTEM_PROMPT
from app.schemas.responses import ChatResponse, NavigationResponse, IncidentResponse
from typing import TypeVar, Type, Any

T = TypeVar('T')

class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self.client = AsyncGroq(api_key=api_key)
        # Using a fast model for JSON extraction and reasoning
        self.model = "llama-3.1-8b-instant" 

    async def generate_structured_response(self, user_prompt: str, context: str, response_model: Type[T]) -> T:
        """
        Calls Groq API to generate a structured JSON response matching the Pydantic schema.
        """
        schema_str = json.dumps(response_model.model_json_schema(), indent=2)
        full_system_prompt = f"{FANFLOW_SYSTEM_PROMPT}\n\n{context}\n\nYou MUST return your response as a valid JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks.\n\nREQUIRED JSON SCHEMA:\n{schema_str}"
        
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model,
                response_format={"type": "json_object"},
                temperature=0.2, # Low temperature for more deterministic/factual output
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
