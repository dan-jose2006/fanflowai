import os
import httpx
import datetime
from fastapi import APIRouter
from typing import Any, Dict

router = APIRouter(prefix="/match", tags=["Match"])

BASE_URL = "https://v3.football.api-sports.io"

# Static fallback: 2022 World Cup Final (Argentina vs France) - used when API is unavailable
STATIC_FALLBACK = {
    "match_id": "979139",
    "status": "Match Finished",
    "time": "Final (Pen)",
    "home_team": {
        "name": "Argentina",
        "score": 3,
        "logo": "https://media.api-sports.io/football/teams/26.png"
    },
    "away_team": {
        "name": "France",
        "score": 3,
        "logo": "https://media.api-sports.io/football/teams/2.png"
    },
    "events": [
        {"minute": "23'", "type": "goal", "player": "L. Messi", "team": "home"},
        {"minute": "36'", "type": "goal", "player": "Á. Di María", "team": "home"},
        {"minute": "80'", "type": "goal", "player": "K. Mbappé", "team": "away"},
        {"minute": "81'", "type": "goal", "player": "K. Mbappé", "team": "away"},
        {"minute": "108'", "type": "goal", "player": "L. Messi", "team": "home"},
        {"minute": "118'", "type": "goal", "player": "K. Mbappé", "team": "away"},
    ],
    "possession": {"home": 58, "away": 42},
    "stadium": "Lusail Iconic Stadium",
    "attendance": "88,966"
}

# Module-level cache
_CACHE: Dict[str, Any] = {
    "data": None,
    "timestamp": None
}

CACHE_DURATION_SECS = 60

def _transform_fixture(fixture: dict) -> Dict[str, Any]:
    """Transform API-Sports fixture format to our simplified format."""
    events_data = fixture.get("events", [])
    formatted_events = []
    for event in events_data:
        minute_str = str(event['time']['elapsed'])
        if event['time'].get('extra'):
            minute_str += f"+{event['time']['extra']}"
        minute_str += "'"

        evt_type = "subst"
        if event["type"] == "Goal":
            evt_type = "goal"
        elif event["type"] == "Card":
            evt_type = "yellow_card" if "Yellow" in str(event.get("detail", "")) else "red_card"

        formatted_events.append({
            "minute": minute_str,
            "type": evt_type,
            "player": event["player"]["name"] or "Unknown",
            "team": "home" if str(event["team"]["id"]) == str(fixture["teams"]["home"]["id"]) else "away"
        })

    home_score = fixture["goals"]["home"] if fixture["goals"]["home"] is not None else 0
    away_score = fixture["goals"]["away"] if fixture["goals"]["away"] is not None else 0
    elapsed = fixture['fixture']['status']['elapsed']
    elapsed_time = f"{elapsed}'" if elapsed else fixture["fixture"]["status"]["short"]

    return {
        "match_id": str(fixture["fixture"]["id"]),
        "status": fixture["fixture"]["status"]["long"],
        "time": elapsed_time,
        "home_team": {
            "name": fixture["teams"]["home"]["name"],
            "score": home_score,
            "logo": fixture["teams"]["home"]["logo"]
        },
        "away_team": {
            "name": fixture["teams"]["away"]["name"],
            "score": away_score,
            "logo": fixture["teams"]["away"]["logo"]
        },
        "events": formatted_events,
        "possession": {"home": 58, "away": 42},
        "stadium": fixture["fixture"]["venue"].get("name") or "FIFA Stadium",
        "attendance": "88,966"
    }


@router.get("/live")
async def get_live_match() -> Dict[str, Any]:
    """
    Fetches the live FIFA World Cup match (League ID 1) from API-Sports.
    Falls back to the 2022 WC Final if no live match or API quota is exceeded.
    Always returns valid data — never 404.
    """
    now = datetime.datetime.now()
    
    # Check cache validity
    if _CACHE["data"] and _CACHE["timestamp"]:
        if (now - _CACHE["timestamp"]).total_seconds() < CACHE_DURATION_SECS:
            return {
                "source_type": "cached",
                "updated_at": _CACHE["timestamp"].isoformat(),
                "match": _CACHE["data"]
            }

    API_SPORTS_KEY = os.getenv("API_SPORTS_KEY")
    if not API_SPORTS_KEY:
        # No key => return fallback directly
        return {
            "source_type": "fallback",
            "updated_at": now.isoformat(),
            "match": STATIC_FALLBACK
        }

    headers = {"x-apisports-key": API_SPORTS_KEY}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # 1. Try fetching a live FIFA World Cup match
            response = await client.get(
                f"{BASE_URL}/fixtures",
                params={"league": 1, "live": "all"},
                headers=headers
            )
            data = response.json()
            fixtures = data.get("response", [])

            # 2. Fallback: fetch the 2022 World Cup Final by fixture ID
            if not fixtures:
                fallback_response = await client.get(
                    f"{BASE_URL}/fixtures",
                    params={"id": 979139},
                    headers=headers
                )
                fallback_data = fallback_response.json()
                fixtures = fallback_data.get("response", [])

            if not fixtures:
                # If both queries returned empty response, use cache if available, else static
                if _CACHE["data"]:
                    return {
                        "source_type": "cached",
                        "updated_at": _CACHE["timestamp"].isoformat() if _CACHE["timestamp"] else now.isoformat(),
                        "match": _CACHE["data"]
                    }
                return {
                    "source_type": "fallback",
                    "updated_at": now.isoformat(),
                    "match": STATIC_FALLBACK
                }

            transformed = _transform_fixture(fixtures[0])
            _CACHE["data"] = transformed
            _CACHE["timestamp"] = now

            return {
                "source_type": "live",
                "updated_at": now.isoformat(),
                "match": transformed
            }

    except Exception:
        # On error/timeout, use cache if exists, otherwise fallback
        if _CACHE["data"]:
            return {
                "source_type": "cached",
                "updated_at": _CACHE["timestamp"].isoformat() if _CACHE["timestamp"] else now.isoformat(),
                "match": _CACHE["data"]
            }
        return {
            "source_type": "fallback",
            "updated_at": now.isoformat(),
            "match": STATIC_FALLBACK
        }

