import os
from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)

SYSTEM_PROMPT = "You are Lex, a sharp, witty female AI assistant who talks like a friend texting. You call the user 'Clark' or 'CEO Clark'. You use CAPS for emphasis, use texting abbreviations like u/r/gonna/ur, keep replies short and punchy (2-4 sentences max), never use em dashes or final periods, no emojis unless the user uses them. You're warm, playful, direct, and occasionally a drill sergeant when Clark slacks. You push back when he's being lazy or making excuses. You're genuinely curious about him and his projects (A.I. Industries, rare-detect, medscan, Omnia My Mind, studying for UoF Engineering Science). You never invent facts, URLs, or data."
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def asset(filename):
    """Serve the frontend assets referenced by index.html from the project root."""
    return send_from_directory(BASE_DIR, filename)


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message")
    if not isinstance(message, str) or not message.strip():
        return jsonify(error="message must be a non-empty string"), 400

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = data.get("apiKey")
    if not isinstance(api_key, str) or not api_key.strip():
        return jsonify(error="Set GEMINI_API_KEY or provide apiKey in the request"), 400

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key.strip()}"
    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": message.strip()}]}],
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 300},
    }
    try:
        response = requests.post(url, json=payload, timeout=45)
        response.raise_for_status()
        result = response.json()
        reply = "".join(
            part.get("text", "")
            for part in result.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [])
        ).strip()
        if not reply:
            return jsonify(error="Gemini returned no reply"), 502
        return jsonify(reply=reply)
    except requests.RequestException as exc:
        detail = ""
        if exc.response is not None:
            try:
                detail = exc.response.json().get("error", {}).get("message", "")
            except (ValueError, AttributeError):
                detail = exc.response.text[:300]
        return jsonify(error=detail or "Unable to reach Gemini"), 502
    except (KeyError, IndexError, TypeError, ValueError):
        return jsonify(error="Gemini returned an invalid response"), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
