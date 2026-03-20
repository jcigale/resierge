import os
import json
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic

app = FastAPI(title="Resierge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "capacitor://localhost",
        "ionic://localhost",
        "https://localhost",
    ],
    allow_origin_regex=r"http://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.AsyncAnthropic()


class GroupPreferences(BaseModel):
    group_size: int
    dietary_restrictions: list[str] = []
    cuisine_preferences: list[str] = []
    location: list[str]
    price_range: str
    occasion: Optional[str] = None
    atmosphere: list[str] = []
    other_notes: Optional[str] = None
    dining_date: Optional[str] = None  # ISO date string e.g. "2026-03-21"
    dining_time: Optional[str] = None  # 24h time string e.g. "19:30"


SYSTEM_PROMPT = """You are Resierge, an expert NYC restaurant concierge. Find the perfect restaurant match for groups based on their preferences.

Rules:
- Dietary restrictions are hard requirements
- Stay within the price range ($ under $20/pp, $$ $20-50, $$$ $50-100, $$$$ $100+)
- Account for group size
- Recommend exactly 3 options
- Keep all text fields brief (1-2 sentences max)
- For reservation_likelihood, assess how easy it is to get a reservation at the requested date/time based on: day of week (Fri/Sat evenings hardest), time (7-9pm prime time), restaurant demand/prestige, and typical booking lead times. Use exactly one of: "Easy", "Moderate", "Difficult", "Very Difficult"
- For reservation_platforms, list the booking platform(s) this restaurant actually uses from: "opentable", "resy", "tock", "walk-in". Use your knowledge of where each restaurant accepts reservations.

Respond ONLY with valid JSON, no markdown, no extra text:
{"summary":"...","restaurants":[{"name":"...","cuisine":"...","price_range":"...","address":"...","neighborhood":"...","why_recommended":"...","dietary_accommodations":["..."],"highlights":["...","...","..."],"reservation_tip":"...","best_for":"...","reservation_likelihood":"Easy|Moderate|Difficult|Very Difficult","reservation_likelihood_reason":"...","reservation_platforms":["opentable"|"resy"|"tock"|"walk-in"]}]}"""


def build_user_message(p: GroupPreferences) -> str:
    dietary = ", ".join(p.dietary_restrictions) if p.dietary_restrictions else "no restrictions"
    cuisines = ", ".join(p.cuisine_preferences) if p.cuisine_preferences else "open to anything"
    atmosphere = ", ".join(p.atmosphere) if p.atmosphere else "flexible"

    dining_when = ""
    if p.dining_date or p.dining_time:
        dining_when = f"\nDining date: {p.dining_date or 'not specified'}\nDining time: {p.dining_time or 'not specified'}"

    location = ", ".join(p.location) if p.location else "anywhere in NYC"

    return f"""Find the best NYC restaurant for this group:

Group size: {p.group_size} people
Dietary restrictions: {dietary}
Cuisine preferences: {cuisines}
Location: {location}
Price range: {p.price_range}
Occasion: {p.occasion or "dining out"}
Atmosphere: {atmosphere}
Additional notes: {p.other_notes or "none"}{dining_when}

Search for current restaurant options that match all these criteria and return your JSON recommendations. Include accurate reservation_likelihood and reservation_platforms for each restaurant based on the requested date/time."""


def extract_json(text: str) -> dict:
    """Attempt to extract a valid JSON recommendations object from Claude's response."""
    # Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown fences
    fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass

    # Find the outermost JSON object containing "restaurants"
    match = re.search(r'\{[\s\S]*?"restaurants"\s*:\s*\[[\s\S]*?\]\s*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse recommendations from response")


@app.post("/api/recommend/stream")
async def recommend_stream(preferences: GroupPreferences):
    user_message = build_user_message(preferences)

    async def event_stream():
        messages = [{"role": "user", "content": user_message}]

        try:
            for attempt in range(5):  # handle pause_turn continuations
                all_text = ""

                async with client.messages.stream(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=1800,
                    system=SYSTEM_PROMPT,
                    messages=messages,
                ) as stream:
                    async for event in stream:
                        etype = getattr(event, "type", None)

                        # Detect web search activity and send status updates
                        if etype == "content_block_start":
                            block = getattr(event, "content_block", None)
                            btype = getattr(block, "type", "")
                            if "web_search" in btype or "server_tool" in btype:
                                msg = "Searching NYC restaurants..." if attempt == 0 else "Finding more options..."
                                yield f"data: {json.dumps({'type': 'status', 'message': msg})}\n\n"

                    final = await stream.get_final_message()

                    # Accumulate all text content blocks
                    for block in final.content:
                        if getattr(block, "type", "") == "text" and hasattr(block, "text"):
                            all_text += block.text

                if final.stop_reason == "end_turn":
                    try:
                        data = extract_json(all_text)
                        yield f"data: {json.dumps({'type': 'complete', 'data': data})}\n\n"
                    except ValueError as e:
                        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    return

                elif final.stop_reason == "pause_turn":
                    # Server-side loop hit its limit — re-send to continue
                    messages.append({"role": "assistant", "content": final.content})
                    yield f"data: {json.dumps({'type': 'status', 'message': 'Refining recommendations...'})}\n\n"

                else:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Unexpected stop reason: {final.stop_reason}'})}\n\n"
                    return

            yield f"data: {json.dumps({'type': 'error', 'message': 'Could not complete search after max retries'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
