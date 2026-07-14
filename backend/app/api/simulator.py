from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.utils.data_loader import get_all_mock_context, update_mock_state
import datetime

router = APIRouter(prefix="/simulator", tags=["Simulator"])

class SimulationEvent(BaseModel):
    event_type: str  # "heavy_crowd", "transport_delay", "medical_emergency", "weather_warning"
    location: str
    severity: str

@router.post("/trigger", response_model=Dict[str, Any])
async def trigger_event(event: SimulationEvent):
    """
    Triggers a live event simulation to mutate the in-memory mock telemetry data.
    """
    try:
        context = await get_all_mock_context()
        
        if event.event_type == "heavy_crowd":
            crowd = context.get("crowd", [])
            for c in crowd:
                if c["name"] == event.location:
                    c["density"] = 95
                    c["status"] = "critical"
            await update_mock_state("crowd", crowd)
            
        elif event.event_type == "transport_delay":
            transport = context.get("transport", [])
            for t in transport:
                if t["route"] == event.location:
                    t["status"] = "delayed"
                    t["wait_time"] = "45 mins"
            await update_mock_state("transport", transport)
            
        elif event.event_type == "medical_emergency":
            medical = context.get("medical", [])
            medical.append({
                "id": f"MED-{int(datetime.datetime.now().timestamp())}",
                "location": event.location,
                "status": "urgent",
                "description": "Medical assistance required (Simulation)"
            })
            await update_mock_state("medical", medical)
            
        elif event.event_type == "weather_warning":
            weather = context.get("weather", {})
            weather["condition"] = event.severity
            await update_mock_state("weather", weather)
            
        return {"status": "success", "message": f"Event {event.event_type} triggered at {event.location}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
