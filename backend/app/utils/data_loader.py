import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import asyncio

DATA_DIR = Path(__file__).parent.parent / "data"

_IN_MEMORY_STATE = {}
_INITIALIZED = False

async def _init_state():
    global _INITIALIZED, _IN_MEMORY_STATE
    if _INITIALIZED:
        return
    
    def read_file(filename):
        filepath = DATA_DIR / filename
        if not filepath.exists():
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    _IN_MEMORY_STATE['crowd'] = await asyncio.to_thread(read_file, "crowd.json") or []
    _IN_MEMORY_STATE['parking'] = await asyncio.to_thread(read_file, "parking.json") or []
    _IN_MEMORY_STATE['transport'] = await asyncio.to_thread(read_file, "transport.json") or []
    _IN_MEMORY_STATE['weather'] = await asyncio.to_thread(read_file, "weather.json") or {}
    _IN_MEMORY_STATE['food'] = await asyncio.to_thread(read_file, "food.json") or []
    _IN_MEMORY_STATE['incidents'] = await asyncio.to_thread(read_file, "incidents.json") or []
    _IN_MEMORY_STATE['medical'] = await asyncio.to_thread(read_file, "medical.json") or []
    
    _INITIALIZED = True

async def load_json_data(filename: str) -> Optional[Any]:
    """
    Asynchronously load mock JSON data from the in-memory state.
    """
    await _init_state()
    key = filename.replace('.json', '')
    return _IN_MEMORY_STATE.get(key)

async def update_mock_state(key: str, data: Any):
    """
    Mutate the in-memory state for the Live Event Simulator.
    """
    await _init_state()
    _IN_MEMORY_STATE[key] = data

async def get_all_mock_context() -> Dict[str, Any]:
    """
    Fetches all mock data to build a comprehensive real-time context for the AI.
    """
    await _init_state()
    return {
        "crowd": _IN_MEMORY_STATE.get("crowd", []),
        "parking": _IN_MEMORY_STATE.get("parking", []),
        "transport": _IN_MEMORY_STATE.get("transport", []),
        "weather": _IN_MEMORY_STATE.get("weather", {}),
        "food": _IN_MEMORY_STATE.get("food", []),
        "incidents": _IN_MEMORY_STATE.get("incidents", []),
        "medical": _IN_MEMORY_STATE.get("medical", [])
    }
