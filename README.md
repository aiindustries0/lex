# Lex — personal AI assistant

Lex is a polished, mobile-first chat interface for a personal Gemini-powered AI assistant. The frontend is plain HTML, CSS, and JavaScript, and the backend is a small Render-ready Flask app.

## Run locally

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Gemini key:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   ```
4. Start the server:
   ```bash
   python app.py
   ```
5. Open `http://localhost:10000`.

The API also accepts a browser-provided `apiKey` when `GEMINI_API_KEY` is not set on the server. The included settings panel stores that browser key in local storage.

## Deploy to Render

1. Set `GEMINI_API_KEY` in your Render account's Environment settings.
2. Connect this GitHub repository to Render.
3. Create a **Web Service**.
4. Keep the defaults fine: Render will install `requirements.txt` and use the included `Procfile` (`web: gunicorn app:app`).
5. Deploy and open the generated Render URL.

### Explicit Render settings

- **Start Command:** `gunicorn app:app`
- **Environment variable:** Add `GEMINI_API_KEY` in Render's Environment settings and set its value to your Gemini API key. Never commit the key to the repository.

The service exposes `GET /` for the website and `POST /api/chat` for Gemini-backed replies. The frontend voice button uses the browser's speech synthesis API when available.
