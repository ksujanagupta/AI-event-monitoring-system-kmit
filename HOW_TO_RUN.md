# How to run Vigilance on any machine

Complete setup, from a fresh computer to a working system. Follow the steps in order.
Works on macOS, Windows and Linux.

## What you will end up with

Four programs running at the same time, plus a database:

| # | Service | Folder | Port | Needed for |
|---|---|---|---|---|
| 1 | Web app (React + Vite) | `frontend/` | 5173 | everything you see in the browser |
| 2 | API (Node.js + Express) | `backend/` | 5000 | login, incidents, alerts, Lost & Found, chatbot |
| 3 | CCTV search (Python + FastAPI) | `backend/` | 8000 | finding a lost object or missing person in videos |
| 4 | Live detection (Python + Flask) | `server/` | 5001 | fire and violence detection on the live camera |
| – | MongoDB | – | 27017 | stores users, incidents and Lost & Found reports |

Services 1 and 2 with MongoDB are enough for login, incident reporting, volunteer
coordination and the maps. Add 3 and 4 when you want the AI features.

---

## Step 0 — Install the prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 18 or newer | `node -v` |
| Python | 3.10, 3.11 or 3.12 (**not 3.13**) | `python3 --version` |
| Git | any | `git --version` |
| MongoDB | 6.0 or newer, or an Atlas account | `mongod --version` |

Free disk space: about **6 GB** (PyTorch and the AI models take most of it).

**macOS**

```bash
brew install node git python@3.12
```

**Windows** — download and run the installers:
[Node.js LTS](https://nodejs.org/), [Python 3.12](https://www.python.org/downloads/)
(tick "Add python.exe to PATH"), [Git](https://git-scm.com/download/win).

**Ubuntu / Debian**

```bash
sudo apt update
sudo apt install -y nodejs npm git python3.12 python3.12-venv python3-pip
```

---

## Step 1 — Get the code

```bash
git clone https://github.com/ksujanagupta/AI-event-monitoring-system-kmit.git
cd AI-event-monitoring-system-kmit
```

---

## Step 2 — Set up MongoDB

Pick **one** of the two options.

### What the project needs from MongoDB

- Any MongoDB 6.0+ server, local or cloud.
- Database name **`EventMonitor`** — set in `backend/config/db.js`, so don't put a database
  name in the connection string.
- Three collections: `users`, `issues`, `lostreports`. **You do not create them by hand** —
  Mongoose creates them, along with the unique indexes on `users.name` and `users.email`,
  the first time something is saved.
- No seed data, except the first admin account (Step 5).
- The database user needs **readWrite** on `EventMonitor`.

### Option A — MongoDB on your own machine

**macOS**

```bash
brew tap mongodb/brew
brew trust mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows** — install [MongoDB Community Server](https://www.mongodb.com/try/download/community),
tick "Install MongoDB as a Service" during setup. It then starts with Windows.

**Ubuntu / Debian**

```bash
sudo apt install -y mongodb-org     # see MongoDB's docs if this package is missing
sudo systemctl enable --now mongod
```

Check it is running:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

Your connection string is:

```
mongodb://127.0.0.1:27017
```

### Option B — MongoDB Atlas (cloud, no local install)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free M0 cluster**.
2. **Database Access** → Add New Database User → username and password → role
   *Read and write to any database*.
3. **Network Access** → Add IP Address → your current IP (or `0.0.0.0/0` while developing).
4. **Clusters** → Connect → Drivers → copy the string. It looks like:

```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/
```

Replace `USERNAME` and `PASSWORD` with the database user you just made. If the password has
symbols such as `@` or `#`, percent-encode them (`@` → `%40`).

### Useful database commands

```bash
mongosh                                  # open a shell
use EventMonitor
db.users.find({}, { name: 1, role: 1, isApproved: 1 })   # who can log in
db.issues.countDocuments()               # how many incidents
db.lostreports.find().limit(5)           # Lost & Found reports
db.dropDatabase()                        # start over (deletes everything)
```

---

## Step 3 — Create `backend/.env`

Copy the example file and fill it in:

```bash
cp backend/.env.example backend/.env        # Windows: copy backend\.env.example backend\.env
```

| Variable | Required | What to put |
|---|---|---|
| `MONGODB_URI` | yes | the connection string from Step 2 |
| `JWT_SECRET` | yes | any long random string (see below). The API refuses to start without it |
| `GEMINI_API_KEY` | no | key from [Google AI Studio](https://aistudio.google.com/apikey), only for the AI Summary chatbot |
| `FACE_MATCH_THRESHOLD` | no | `0.5` by default. Lower is stricter for volunteer face login |
| `PORT` | no | `5000` |
| `FRONTEND_ORIGIN` | no | `http://localhost:5173` |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

A finished file looks like this:

```
MONGODB_URI=mongodb://127.0.0.1:27017
JWT_SECRET=6f1c...long-random-string...9ab2
GEMINI_API_KEY=
FACE_MATCH_THRESHOLD=0.5
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
```

`.env` is git-ignored — never commit it.

---

## Step 4 — Install the Node.js dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## Step 5 — Create the first admin account

The API must be able to reach MongoDB for this, but it does not need to be running.

```bash
cd backend
node scripts/createAdmin.js "Admin Name" admin@example.com YourPassword123
cd ..
```

Everyone else signs up in the browser as a volunteer or an attendee, and an admin approves
them. Admin accounts can only be made with this script.

---

## Step 6 — Install the Python dependencies (for the AI services)

Skip this step if you only want the web app, API and maps. You can come back to it later.

Create a virtual environment with Python 3.10–3.12 and install everything from
`requirements.txt`:

**macOS / Linux**

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Windows (PowerShell)**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

This downloads roughly 2–3 GB and takes 5–20 minutes. `git` must be installed, because CLIP
is installed from GitHub.

Check it worked:

```bash
python -c "import torch, cv2, clip, ultralytics, facenet_pytorch, fastapi, flask; print('AI packages OK')"
```

**About the model files**

- `server/models/best.pt` (fire) and `yolov8n.pt` come with the repository.
- CLIP ViT-B/32 (~350 MB) and FaceNet vggface2 (~110 MB) download themselves the **first
  time** each service runs, so keep internet on for the first start.

**Using an NVIDIA GPU (optional)** — install the CUDA build of PyTorch *before*
`requirements.txt`, picking your CUDA version at
[pytorch.org](https://pytorch.org/get-started/locally/), for example:

```bash
pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
```

Face search and YOLO then use the GPU automatically. Violence detection stays on the CPU
unless you set `device: 'cuda'` in `server/violence_model/violence_settings.yaml`.

---

## Step 7 — Start the services

Open a separate terminal for each one. **The working directory matters** — the Python
services load models and videos using relative paths.

```bash
# terminal 1 - API                       http://localhost:5000
cd backend
npm start

# terminal 2 - web app                   http://localhost:5173
cd frontend
npm run dev

# terminal 3 - CCTV search (optional)    http://localhost:8000
cd backend
source ../.venv/bin/activate             # Windows: ..\.venv\Scripts\Activate.ps1
uvicorn server:app --port 8000

# terminal 4 - live detection (optional) http://localhost:5001
cd server
source ../.venv/bin/activate             # Windows: ..\.venv\Scripts\Activate.ps1
python stream_server.py
```

Then open **http://localhost:5173** and log in with the admin account from Step 5.

Signs that each one started correctly:

- API: `MongoDB Connected: ...` and `Server started on port 5000`
- Web app: `Local: http://localhost:5173/`
- CCTV search: `Application startup complete.` and a list of available videos
- Live detection: `Models loaded successfully.` after the first frame arrives

---

## Step 8 — Connect a camera (optional)

The live detection service needs a video stream. The easiest source is an Android phone.

1. Install **IP Webcam** from the Play Store.
2. Connect the phone to the **same Wi-Fi** as the computer.
3. Open the app → *Start server*. It shows an address such as `http://192.168.1.5:8080`.
4. Start the service with that address:

```bash
# macOS / Linux
cd server
STREAM_URL=http://192.168.1.5:8080/video python stream_server.py

# Windows (PowerShell)
cd server
$env:STREAM_URL="http://192.168.1.5:8080/video"; python stream_server.py
```

Any IP camera with an HTTP/MJPEG stream works the same way. Without a camera, the "Admin
Live Feed" panel stays blank — the other five camera tiles play demo videos from
`frontend/public/`.

---

## Step 9 — Try it end to end

1. **Log in as admin** → the dashboard shows counts, charts and recent alerts.
2. **Create an attendee**: open http://localhost:5173/signup in a private window, choose
   *Attendee*, sign up. As admin go to **User Management → Attendees → approve**.
3. **Create a volunteer**: sign up as *Volunteer* and upload a clear, front-facing photo —
   the face is read in the browser and stored as 128 numbers. Approve them as admin.
4. **Report an incident**: log in as the attendee, allow location access, and submit a report
   from *Report Issues*. It appears on the admin's **Alerts & Location** map immediately.
5. **Assign and resolve**: as admin assign a volunteer; log in as that volunteer (password +
   face scan + location permission), accept the assignment, then mark it resolved. Every
   screen updates live.
6. **Lost & Found** (needs service 3): *New Report* → upload a photo → *Search* across the
   demo videos → matched frames come back with the report.
7. **AI Summary** (needs `GEMINI_API_KEY`): ask "when was fire detected?" and the chatbot
   answers from the detection logs in `backend/ai-logs/`.

### Quick checks

```bash
cd backend && npm test                                   # role checks + face matching

curl -i http://localhost:5000/api/admin/users            # expect 401 without a token
curl -X POST http://localhost:5000/api/login \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin Name","password":"YourPassword123","role":"admin"}'
```

---

## Settings you may want to change

| What | Where |
|---|---|
| Venue centre, exits, assembly points on the maps | `frontend/src/config.ts` |
| Backend URL used by the web app | `VITE_API_URL` in `frontend/.env` |
| Live stream and alert URLs used by the web app | `VITE_STREAM_ENDPOINT`, `VITE_STREAM_ALERTS_ENDPOINT` |
| Camera address, detection log file | `STREAM_URL`, `AI_LOG_FILE` (live detection service) |
| Fire and violence sensitivity, frame rate | constants at the top of `server/main_live_detection.py` |
| Violence model labels and threshold | `server/violence_model/violence_settings.yaml` |
| Face match strictness | `FACE_MATCH_THRESHOLD` in `backend/.env` |
| Videos offered in Lost & Found search | `frontend/public/*.mp4` and the `availableVideos` list in the Lost & Found pages |

---

## Troubleshooting

**`JWT_SECRET is not set`, API exits immediately** — fill in `JWT_SECRET` in `backend/.env`.

**`MongoServerError: bad auth` or `ECONNREFUSED 127.0.0.1:27017`** — the database isn't
running or the URI is wrong. Local: start the service (Step 2). Atlas: check the password and
that your IP is allowed under Network Access.

**Port already in use** — something else is on 5000/5173/8000/5001. Find and stop it:
`lsof -ti tcp:5000 | xargs kill` (macOS/Linux) or `netstat -ano | findstr :5000` then
`taskkill /PID <pid> /F` (Windows).

**Login says "pending admin approval"** — an admin must approve the account in User Management.

**Volunteer face login fails** — the face must match the sign-up photo. Try better lighting,
or raise `FACE_MATCH_THRESHOLD` slightly (0.55–0.6). Volunteers created before a photo was
stored must sign up again.

**"FastAPI server is not running"** in Lost & Found — start service 3 on port 8000.

**Pillow or facenet-pytorch fails to build during `pip install`** — you are on Python 3.13.
Create the virtual environment with Python 3.12 instead.

**`ModuleNotFoundError: No module named 'clip'`** — the CLIP line needs `git`. Install git and
re-run `pip install -r requirements.txt`.

**Live feed blank / `Failed to open webcam stream`** — phone and computer must share a Wi-Fi
network, and `STREAM_URL` must match the address the IP Webcam app displays.

**Browser blocks camera or location** — both need `localhost` (which counts as secure) or
HTTPS. Allow the permissions when the browser asks.

**`nodemon: Permission denied`** — from an old clone that had `node_modules` committed. Run
`chmod +x backend/node_modules/nodemon/bin/nodemon.js`, or simply `node index.js` instead of
`npm start`.

**AI Summary returns "AI Service is unavailable"** — `GEMINI_API_KEY` is missing from
`backend/.env`. Restart the API after adding it.

---

## Stopping everything

Press `Ctrl+C` in each terminal. The database keeps running in the background:

```bash
brew services stop mongodb-community      # macOS
sudo systemctl stop mongod                # Linux
# Windows: Services → MongoDB Server → Stop
```

To wipe the data and start fresh: `mongosh --eval "use EventMonitor; db.dropDatabase()"`,
then create the admin again (Step 5).
