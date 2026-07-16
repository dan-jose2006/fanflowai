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
    valid_event_types = {"heavy_crowd", "transport_delay", "medical_emergency", "weather_warning"}
    if event.event_type not in valid_event_types:
        raise HTTPException(status_code=400, detail=f"Invalid event_type. Must be one of: {', '.join(valid_event_types)}")

    valid_crowd_locations = {"North Entrance", "South Plaza", "Food Court A", "East Concourse", "Fan Zone VIP"}
    valid_transport_locations = {"Route 42", "Metro Line 1", "Shuttle B"}

    try:
        context = await get_all_mock_context()
        
        if event.event_type == "heavy_crowd":
            if event.location not in valid_crowd_locations:
                raise HTTPException(status_code=400, detail=f"Invalid location for heavy_crowd. Allowed: {', '.join(valid_crowd_locations)}")
            crowd = context.get("crowd", [])
            for c in crowd:
                if c["name"] == event.location:
                    c["density"] = 95
                    c["status"] = "critical"
            await update_mock_state("crowd", crowd)
            
        elif event.event_type == "transport_delay":
            if event.location not in valid_transport_locations:
                raise HTTPException(status_code=400, detail=f"Invalid location for transport_delay. Allowed: {', '.join(valid_transport_locations)}")
            transport = context.get("transport", [])
            for t in transport:
                if t.get("line") == event.location:
                    t["status"] = "Delayed"
                    t["next_departure"] = "45 min"
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
