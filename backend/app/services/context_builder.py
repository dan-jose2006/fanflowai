from typing import Dict, Any
from app.utils.data_loader import get_all_mock_context
import datetime

async def build_enriched_context(user_role: str, location: str = None, language: str = "en", accessibility: str = None) -> str:
    """
    Builds a rich context string by combining real-time (mocked) telemetry data 
    and user-specific variables to feed into the Groq API prompt.
    """
    telemetry = await get_all_mock_context()
    
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    context_parts = [
        f"--- REAL-TIME TELEMETRY & CONTEXT ---",
        f"Current Time: {current_time}",
        f"User Role: {user_role.upper()}",
        f"Preferred Language: {language}",
    ]
    
    if location:
        context_parts.append(f"User Current Location: {location}")
        
    if accessibility:
        context_parts.append(f"Accessibility Needs: {accessibility}")
        
    # Summarize Crowd
    high_crowd_zones = [z['name'] for z in telemetry.get('crowd', []) if z.get('status') in ['high', 'critical']]
    if high_crowd_zones:
        context_parts.append(f"Crowd Alert: High density in {', '.join(high_crowd_zones)}")
        
    # Summarize Weather
    weather = telemetry.get('weather', {})
    if weather:
        context_parts.append(f"Weather: {weather.get('condition', 'Unknown')}, {weather.get('temperature', 'Unknown')}°C")
        
    # Summarize Transport
    delays = [t['route'] for t in telemetry.get('transport', []) if t.get('status') == 'delayed']
    if delays:
        context_parts.append(f"Transport Delays: {', '.join(delays)}")

    context_parts.append("-------------------------------------")
    
    return "\n".join(context_parts)
