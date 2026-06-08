"""
Bachao Pakistan — AI endpoints powered by Claude (Anthropic)

Three features:
  POST /ai/risk-analysis      → explain WHY a route has this risk + safety tip
  POST /ai/sos-message        → generate a personalised SOS alert to send contacts
  POST /ai/incident-insights  → weekly safety brief for the web dashboard
"""
from fastapi import APIRouter
import anthropic
import os

router = APIRouter()
_client = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to your .env file."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


# ── 1. Risk Analysis ──────────────────────────────────────────────────────────

@router.post("/risk-analysis")
async def ai_risk_analysis(data: dict):
    """
    Input: journey context from JourneySetup
    Output: { analysis: "<2-3 sentence explanation + tip>" }
    """
    journey_type = data.get("journey_type", "solo")
    time_of_day  = data.get("time_of_day", "unknown")
    day_of_week  = data.get("day_of_week", "unknown")
    risk_level   = data.get("risk_level", "MEDIUM")
    risk_score   = round(data.get("risk_score", 0.5) * 100)
    signals      = data.get("high_risk_signals", [])

    mode_label = {
        "solo":          "walking alone",
        "biker":         "riding a motorbike",
        "ride_hailing":  "using a ride-hailing service",
    }.get(journey_type, journey_type)

    signal_names = ", ".join(
        s.get("name") or s.get("signal_name", "Unknown signal")
        for s in signals[:3]
    ) or "no flagged signals"

    prompt = f"""You are a safety analyst for Karachi, Pakistan. Be brief and practical.

Journey details:
- Mode: {mode_label}
- Time: {time_of_day} on {day_of_week}
- Risk level: {risk_level} (score: {risk_score}%)
- High-risk signals on route: {signal_names}

In exactly 2-3 sentences: (1) explain WHY this journey carries this risk right now, \
referencing actual signal names and time patterns. (2) Give one concrete safety tip \
specific to {mode_label} at this hour. Do not use bullet points or headings. \
Keep it under 65 words."""

    message = get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"analysis": message.content[0].text.strip()}


# ── 2. SOS Message Generator ─────────────────────────────────────────────────

@router.post("/sos-message")
async def ai_sos_message(data: dict):
    """
    Input: SOS context (name, location, time, mode)
    Output: { message: "<personalised SMS-style alert>" }
    """
    name          = data.get("name", "User")
    signal_name   = data.get("signal_name", "Unknown location")
    lat           = data.get("lat", "")
    lng           = data.get("lng", "")
    time_str      = data.get("time", "unknown time")
    journey_type  = data.get("journey_type", "solo")
    plate         = data.get("plate_number")

    gps_link = f"https://maps.google.com/?q={lat},{lng}" if lat and lng else ""
    plate_str = f" Plate: {plate}." if plate else ""

    mode_label = {
        "solo":         "on foot",
        "biker":        "on a motorbike",
        "ride_hailing": "in a ride-hailing vehicle",
    }.get(journey_type, journey_type)

    prompt = f"""Write a short, urgent SOS alert SMS for a safety app in Karachi, Pakistan.

Context:
- Person: {name}
- Last known location: near {signal_name}, Karachi
- GPS link: {gps_link}
- Time: {time_str}
- Travel mode: {mode_label}{plate_str}

Rules:
- 2-3 sentences, plain text only (no formatting)
- Include name, location, GPS link, and a clear call-to-action
- Tone: urgent but calm
- End with: "Please call immediately."
"""

    message = get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=120,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"message": message.content[0].text.strip()}


# ── 3. Incident Insights (weekly brief) ───────────────────────────────────────

@router.post("/incident-insights")
async def ai_incident_insights(data: dict):
    """
    Input: list of recent incidents + signal risk levels
    Output: { insights: "<3-4 sentence weekly safety brief>" }
    """
    incidents = data.get("incidents", [])
    signals   = data.get("signals", [])

    # Summarise for the prompt (avoid sending raw PII)
    incident_summary = []
    for inc in incidents[:15]:
        t = inc.get("incident_type") or inc.get("type", "unknown")
        loc = inc.get("signal_name") or inc.get("location", "unknown location")
        ts  = inc.get("timestamp") or inc.get("created_at", "")
        incident_summary.append(f"{t} near {loc} ({ts[:10] if ts else 'recent'})")

    signal_summary = []
    for sig in signals[:10]:
        name  = sig.get("name", "unknown")
        level = sig.get("current_risk_level", "UNKNOWN")
        count = sig.get("incident_count_week") or sig.get("weekly_incidents", 0)
        signal_summary.append(f"{name}: {level} ({count} incidents/week)")

    prompt = f"""You are a crime analyst producing a weekly safety brief for Bachao Pakistan, \
a community safety app for Karachi.

Recent incidents (last 7 days):
{chr(10).join(incident_summary) if incident_summary else "No incident data available."}

Signal risk levels:
{chr(10).join(signal_summary) if signal_summary else "No signal data available."}

Write a 3-4 sentence weekly safety brief for Karachi commuters.
Cover: (1) the highest-risk area right now, (2) the main threat type this week, \
(3) the safest times or routes to prefer, (4) one actionable tip.
Mention specific signal or area names. No bullet points. Under 90 words."""

    message = get_client().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"insights": message.content[0].text.strip()}
