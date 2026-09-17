# Vigilance — AI-Driven Event Monitoring System

Vigilance watches the cameras at a large public event, spots fire and violence as they happen, turns them into alerts,
and helps admins send volunteers to the right place. Attendees can report problems, follow alerts and find the nearest
exit. It also finds missing people and lost items in recorded CCTV footage.

Built with computer vision (YOLOv8), a vision-language model (CLIP), face recognition (MTCNN + FaceNet) and a React
web app, for KMIT project school — Team 18.

## What each role can do

**Admin** — watch the live camera with AI detections, see every incident on a map, create and broadcast alerts, assign
volunteers, approve or remove users, search CCTV for a missing person or lost item, and ask an AI chatbot about the
event logs.

**Volunteer** — log in with a password and a face scan, see assigned incidents on a map, accept them, ask for backup,
take over someone else's backup request, and mark them resolved. Their location is shared with the admin while the
geo-location page is open.

**Attendee** — report a problem with their GPS location, follow alerts live, and see the nearest exits and assembly
points during an evacuation.

## How it fits together

```
 Browser (React + Vite, :5173)            Android phone / IP camera
   admin · volunteer · attendee                  (IP Webcam app)
        │  REST + JWT, WebSocket                        │ MJPEG
        ▼                                               ▼
 Express API (:5000) ──────────► FastAPI (:8000)   Flask (:5001)
   auth, issues, alerts,          lost object (ORB)   fire (YOLOv8)
   Lost & Found, chatbot          missing person       violence (CLIP)
        │                         (MTCNN + FaceNet)         │
        ▼                                                   ▼
   MongoDB Atlas                                    backend/ai-logs
   Google Gemini (chat summaries)                   (detection events)
```

| Folder | What's inside |
|---|---|
| `frontend/` | React 18 + Vite + Tailwind app; Leaflet maps, Socket.IO client, face-api.js for face capture |
| `backend/` | Express API (`index.js`, `routes/`, `models/`) and the FastAPI search service (`server.py`, `detector.py`, `face_detector.py`) |
| `server/` | Flask live detection service (`stream_server.py`, `main_live_detection.py`) and the model weights |
| `Documentation/` | Abstract, pitch deck, review presentations, base paper |

## Getting started

Short version below. For step-by-step setup on a fresh machine — MongoDB, Python environment,
camera, troubleshooting — see **[HOW_TO_RUN.md](HOW_TO_RUN.md)**.

You need **Node.js 18+**, **Python 3.10–3.12**, a **MongoDB** database (local or Atlas) and,
for the chatbot, a **Google Gemini API key**.

### 1. Settings

Copy `backend/.env.example` to `backend/.env` and fill it in:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=any-long-random-string
GEMINI_API_KEY=...
FACE_MATCH_THRESHOLD=0.5
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
```

### 2. Install

```bash
cd backend && npm install            # Express API
cd ../frontend && npm install        # web app

python3.12 -m venv .venv && source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt                        # ~2-3 GB, mostly PyTorch
```

The CLIP and FaceNet weights download themselves the first time you run the AI services, so keep internet on.

### 3. Run the four services

Each one needs its own terminal, and the two Python services must be started from their own folder because they use
relative paths.

```bash
cd backend  && npm start                          # API            → http://localhost:5000
cd backend  && uvicorn server:app --port 8000     # CCTV search    → http://localhost:8000
cd server   && python stream_server.py            # live detection → http://localhost:5001
cd frontend && npm run dev                        # web app        → http://localhost:5173
```

### 4. Create the first admin

```bash
cd backend && node scripts/createAdmin.js "Your Name" you@example.com yourpassword
```

Everyone else signs up at `/signup` as a volunteer or an attendee, and an admin approves them before they can log in.
Volunteers upload a clear face photo during sign-up and must pass a face scan at login, so use a device with a camera.

### 5. Point it at a camera

Install the **IP Webcam** app on an Android phone, start the server in the app, and set the address it shows:

```bash
cd server && STREAM_URL=http://192.168.1.5:8080/video python stream_server.py
```

Any camera with an HTTP/MJPEG stream works. Without this, the live camera panel stays empty — the other five camera
tiles play recorded demo videos from `frontend/public/`.

## Tests

```bash
cd backend && npm test
```

Covers the role checks on API routes and the face-match comparison.

## Configuration you may want to change

| What | Where |
|---|---|
| Venue centre, exits and assembly points on the maps | `frontend/src/config.ts` |
| Face match strictness (lower = stricter) | `FACE_MATCH_THRESHOLD` in `backend/.env` |
| Camera address and detection log file | `STREAM_URL`, `AI_LOG_FILE` for the Flask service |
| Fire / violence sensitivity and frame rate | constants at the top of `server/main_live_detection.py` |
| Backend URL used by the web app | `VITE_API_URL` in a `frontend/.env` file |

## Troubleshooting

**"FastAPI server is not running"** when searching Lost & Found — start the `uvicorn` service on port 8000.

**Volunteer can't log in** — the face has to match the sign-up photo. Check lighting, or raise
`FACE_MATCH_THRESHOLD` a little. Volunteers registered before a face was stored must sign up again.

**The API exits at startup** — `JWT_SECRET` is missing from `backend/.env`.

**Live camera panel is blank** — the phone and the computer must be on the same Wi-Fi, and `STREAM_URL` must match
the address the IP Webcam app shows.

## Team

Team 18 — Keshav Memorial Institute of Technology

- Gampa Anupama (23BD1A1216)
- Kodipyaka Sujana Gupta (23BD1A1231)
- Mudiga Shivani (23BD1A1239)
