"""
news_service.py — AI Intelligence Brief Generator for InsureRoute.

Uses Google Gemini REST API to synthesize real-time logistics intelligence
briefs based strictly on actual live weather checkpoint data.
"""

import os
import time
import hashlib
import json
import logging

logger = logging.getLogger("insure_route.news")

try:
    from dotenv import load_dotenv
    _env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv(_env_path, override=True)
except ImportError:
    pass

try:
    import requests as _requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

_API_BASE   = "https://generativelanguage.googleapis.com/v1beta/models"
_MODEL_NAME = "gemini-2.5-flash"
_CACHE_TTL  = 300    # 5 minutes for news cache to avoid over-calling
_MAX_TOKENS = 512

_cache: dict = {}

_SYSTEM_PROMPT = (
    "You are the InsureRoute Intelligence Engine, acting as a real-time global logistics dashboard. "
    "Your job is to generate a professional, realistic 'Logistics Intelligence Brief' "
    "based STRICTLY on the real live weather sensor data provided below.\n\n"
    "DO NOT invent fake news. ONLY report on what the data implies.\n"
    "Format your response as 3 to 4 short, punchy news alerts or insights. "
    "Each alert should start with an appropriate emoji (e.g., ⚠️, 🌧️, 🚦, 📈, 🔄).\n\n"
    "Example format:\n"
    "⚠️ Lonavla Pass Alert: Live sensors detect 8.2mm/hr rainfall. Historical data shows 73% of expressway delays occur under these conditions.\n"
    "🔄 Auto-Reroute Active: Bhiwandi corridor showing clear conditions, recommended for high-value cargo.\n"
    "📈 Insurance Cost Impact: High risk of delays may trigger dynamic premium adjustments.\n\n"
    "Return ONLY the list of alerts, separated by newlines."
)

def _fingerprint(weather_state: dict) -> str:
    """Hash the weather data to cache responses."""
    # Only use relevant fields so minor irrelevant changes don't bust the cache
    key = []
    if "checkpoints" in weather_state:
        for cp in weather_state["checkpoints"]:
            key.append(f"{cp.get('name')}:{cp.get('is_dangerous')}:{cp.get('rain_1h')}:{cp.get('wind_speed')}")
    return hashlib.md5(json.dumps(key).encode()).hexdigest()

def _build_prompt(weather_state: dict) -> str:
    lines = [_SYSTEM_PROMPT, "--- LIVE SENSOR DATA ---"]
    
    if weather_state.get("is_dangerous"):
        lines.append(f"OVERALL ROUTE STATUS: DANGEROUS ({weather_state.get('reason', '')})")
    else:
        lines.append("OVERALL ROUTE STATUS: CLEAR")
        
    lines.append("CHECKPOINTS:")
    for cp in weather_state.get("checkpoints", []):
        lines.append(
            f"- {cp.get('name')} ({cp.get('role')}): "
            f"Temp: {cp.get('temperature')}°C, "
            f"Rain(1h): {cp.get('rain_1h')}mm, "
            f"Wind: {cp.get('wind_speed')}m/s, "
            f"Condition: {cp.get('description')}"
            f"{' [DANGEROUS]' if cp.get('is_dangerous') else ''}"
        )
    return "\n".join(lines)

def _call_gemini(api_key: str, prompt: str) -> str:
    url = f"{_API_BASE}/{_MODEL_NAME}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": _MAX_TOKENS,
            "temperature": 0.4,
        },
    }
    resp = _requests.post(url, params={"key": api_key}, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()

def get_route_news(weather_state: dict) -> dict:
    """Generate an AI-synthesized intelligence brief based on live weather data."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not REQUESTS_AVAILABLE or not api_key:
        return {
            "available": False,
            "briefs": ["Intelligence feed offline: Missing API Key or requests module."],
            "cached": False,
        }

    # If weather is offline or not loaded yet
    if not weather_state.get("checkpoints"):
        return {
            "available": True,
            "briefs": ["📡 Sensors initialising... waiting for live telemetry."],
            "cached": False,
        }

    fp  = _fingerprint(weather_state)
    now = time.monotonic()

    # Cache Hit
    if fp in _cache and (now - _cache[fp]["ts"]) < _CACHE_TTL:
        result = dict(_cache[fp]["result"])
        result["cached"] = True
        return result

    # Cache Miss
    try:
        prompt  = _build_prompt(weather_state)
        text    = _call_gemini(api_key, prompt)
        
        # Parse into a list of strings
        briefs = [line.strip() for line in text.split("\n") if line.strip()]

        result = {
            "available": True,
            "briefs": briefs,
            "cached": False,
        }

        _cache[fp] = {"ts": now, "result": result}
        
        # Cleanup stale cache
        stale = [k for k, v in _cache.items() if now - v["ts"] >= _CACHE_TTL]
        for k in stale:
            del _cache[k]

        print(f"[InsureRoute] Intelligence brief generated (key=...{api_key[-6:]})")
        return result

    except Exception as exc:
        logger.error("News Service Gemini API error: %s", exc)
        return {
            "available": False,
            "briefs": [f"⚠️ Intelligence feed temporarily unavailable: {str(exc)[:100]}"],
            "cached": False,
        }
