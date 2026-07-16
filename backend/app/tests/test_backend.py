import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

# ── App bootstrapping ────────────────────────────────────────────────────────
from app.main import app

client = TestClient(app)


# ════════════════════════════════════════════════════════════════
# Health
# ════════════════════════════════════════════════════════════════

class TestHealth:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_payload(self):
        data = client.get("/health").json()
        assert data["status"] == "healthy"
        assert "version" in data


# ════════════════════════════════════════════════════════════════
# Dashboard
# ════════════════════════════════════════════════════════════════

class TestDashboard:
    def test_dashboard_returns_200(self):
        response = client.get("/api/v1/dashboard")
        assert response.status_code == 200

    def test_dashboard_has_required_keys(self):
        data = client.get("/api/v1/dashboard").json()
        required_keys = {
            "crowd_levels",
            "parking_status",
            "food_court_status",
            "transport_status",
            "active_insights",
        }
        assert required_keys.issubset(data.keys())

    def test_crowd_levels_are_list(self):
        data = client.get("/api/v1/dashboard").json()
        assert isinstance(data["crowd_levels"], list)

    def test_transport_status_are_list(self):
        data = client.get("/api/v1/dashboard").json()
        assert isinstance(data["transport_status"], list)


# ════════════════════════════════════════════════════════════════
# Chat
# ════════════════════════════════════════════════════════════════

class TestChat:
    def _mock_response(self):
        from app.schemas.responses import ChatResponse
        return ChatResponse(
            response="Nearest restroom is at Section 101",
            reasoning="User asked for restroom location",
            confidence_score=0.98,
            suggested_actions=["Proceed to Section 101"],
            context_factors=["Crowd density low"],
        )

    def test_chat_valid_fan_request(self):
        with patch(
            "app.services.groq_service.groq_service.generate_structured_response",
            new_callable=AsyncMock,
            return_value=self._mock_response(),
        ):
            payload = {"message": "Where is the nearest restroom?", "persona": "fan", "language": "en"}
            resp = client.post("/api/v1/chat", json=payload)
            assert resp.status_code == 200
            assert "response" in resp.json()

    def test_chat_message_too_long_returns_422(self):
        payload = {"message": "a" * 301, "persona": "fan", "language": "en"}
        resp = client.post("/api/v1/chat", json=payload)
        assert resp.status_code == 422

    def test_chat_invalid_persona_returns_422(self):
        payload = {"message": "Hello", "persona": "invalid_role", "language": "en"}
        resp = client.post("/api/v1/chat", json=payload)
        assert resp.status_code == 422

    def test_chat_blank_message_returns_422(self):
        payload = {"message": "   ", "persona": "fan", "language": "en"}
        resp = client.post("/api/v1/chat", json=payload)
        assert resp.status_code == 422

    def test_chat_invalid_language_returns_422(self):
        payload = {"message": "Hello", "persona": "fan", "language": "zz"}
        resp = client.post("/api/v1/chat", json=payload)
        assert resp.status_code == 422

    def test_chat_valid_organizer_persona(self):
        with patch(
            "app.services.groq_service.groq_service.generate_structured_response",
            new_callable=AsyncMock,
            return_value=self._mock_response(),
        ):
            payload = {"message": "Show me crowd status", "persona": "organizer", "language": "en"}
            resp = client.post("/api/v1/chat", json=payload)
            assert resp.status_code == 200

    def test_chat_valid_volunteer_persona(self):
        with patch(
            "app.services.groq_service.groq_service.generate_structured_response",
            new_callable=AsyncMock,
            return_value=self._mock_response(),
        ):
            payload = {"message": "What should I do at Gate B?", "persona": "volunteer", "language": "en"}
            resp = client.post("/api/v1/chat", json=payload)
            assert resp.status_code == 200


# ════════════════════════════════════════════════════════════════
# Incident
# ════════════════════════════════════════════════════════════════

class TestIncident:
    def _mock_incident_response(self):
        from app.schemas.responses import IncidentResponse
        return IncidentResponse(
            incident_summary="Medical emergency reported at Section 120",
            severity="critical",
            priority="high",
            recommended_action="Dispatch medical team immediately",
        )

    def test_valid_incident_report(self):
        with patch(
            "app.services.groq_service.groq_service.generate_structured_response",
            new_callable=AsyncMock,
            return_value=self._mock_incident_response(),
        ):
            payload = {
                "incident_type": "medical",
                "location": "Section 120",
                "description": "A fan collapsed and needs medical attention.",
            }
            resp = client.post("/api/v1/incident", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert data["severity"] == "critical"
            assert data["priority"] == "high"

    def test_invalid_incident_type_returns_422(self):
        payload = {
            "incident_type": "alien_invasion",
            "location": "Gate A",
            "description": "Something very strange is happening.",
        }
        resp = client.post("/api/v1/incident", json=payload)
        assert resp.status_code == 422

    def test_incident_missing_required_fields_returns_422(self):
        resp = client.post("/api/v1/incident", json={"incident_type": "medical"})
        assert resp.status_code == 422


# ════════════════════════════════════════════════════════════════
# Simulator
# ════════════════════════════════════════════════════════════════

class TestSimulator:
    def test_invalid_event_type_returns_400(self):
        payload = {"event_type": "fake_event", "location": "North Entrance", "severity": "critical"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 400

    def test_invalid_crowd_location_returns_400(self):
        payload = {"event_type": "heavy_crowd", "location": "Fake Zone 999", "severity": "critical"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 400

    def test_invalid_transport_location_returns_400(self):
        payload = {"event_type": "transport_delay", "location": "Fake Route 999", "severity": "warning"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 400

    def test_crowd_surge_triggers_critical_state(self):
        payload = {"event_type": "heavy_crowd", "location": "North Entrance", "severity": "critical"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

        # Verify telemetry updated
        dash = client.get("/api/v1/dashboard").json()
        north = next((c for c in dash["crowd_levels"] if c["name"] == "North Entrance"), None)
        assert north is not None
        assert north["density"] == 95
        assert north["status"] == "critical"

    def test_transport_delay_updates_status(self):
        payload = {"event_type": "transport_delay", "location": "Route 42", "severity": "warning"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 200

        dash = client.get("/api/v1/dashboard").json()
        route42 = next((t for t in dash["transport_status"] if t["line"] == "Route 42"), None)
        assert route42 is not None
        assert route42["status"] == "Delayed"

    def test_medical_emergency_adds_entry(self):
        payload = {"event_type": "medical_emergency", "location": "Section 5A", "severity": "critical"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 200

    def test_weather_warning_updates_condition(self):
        payload = {"event_type": "weather_warning", "location": "Outer Ring", "severity": "storm"}
        resp = client.post("/api/v1/simulator/trigger", json=payload)
        assert resp.status_code == 200


# ════════════════════════════════════════════════════════════════
# Match
# ════════════════════════════════════════════════════════════════

class TestMatch:
    def test_match_live_returns_200(self):
        resp = client.get("/api/v1/match/live")
        assert resp.status_code == 200

    def test_match_live_has_required_structure(self):
        data = client.get("/api/v1/match/live").json()
        assert "source_type" in data
        assert "updated_at" in data
        assert "match" in data

    def test_match_live_has_teams(self):
        data = client.get("/api/v1/match/live").json()
        match = data.get("match", {})
        assert "home_team" in match
        assert "away_team" in match
        assert "name" in match["home_team"]
        assert "name" in match["away_team"]

    def test_match_source_type_valid(self):
        data = client.get("/api/v1/match/live").json()
        assert data["source_type"] in {"live", "cache", "static", "fallback", "static_fallback"}
