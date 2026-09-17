# Review 1 features not built yet

From the review 1 documents (`Vigilance-Pitch.pdf`, `Abstract-MJP.pdf`, `Sample Template_ppt.pptx`), compared with the
code in this repository. The review 2 deck (`Team18-Review-II.pptx`) shows the three items below as **planned**, so the
SRS, class diagram, sequence diagram and state chart already include them.

## To build

### 1. Crowd surge detection
- **Promised in review 1:** "Crowd Analysis: Density Estimation / Surge Detection" (pitch, tech stack) and
  "crowd surges" in the objectives.
- **What exists:** `server/models/yolov8n.pt` is in the repo and `PERSON_MODEL_PATH` in
  `server/main_live_detection.py` points at it, but nothing loads it. `crowd.mp4` is only a looping demo video on the
  surveillance page.
- **To do:** count people per frame with YOLOv8n in the live detection service, compare against a density threshold
  (people per frame, or per region of the frame), and add `crowd_active` / `crowd_confidence` to the state that
  `/alerts` returns. Add the event type `CROWD_SURGE_DETECTED` to the detection log.

### 2. Weapon (gun) detection
- **Promised in review 1:** "SUSPICIOUS ITEMS (BANNED ITEMS: GUN)" (pitch, problems) and the "Detect Suspicious Object"
  box in the admin and volunteer flows.
- **What exists:** `frontend/public/gun.mp4` is a demo video, and the Lost & Found object search can match an uploaded
  photo of a weapon in recorded footage. There is no live weapon detector.
- **To do:** train or source a YOLOv8 weapon model, load it in `main_live_detection.py` next to the fire model, and
  raise the same kind of alert.

### 3. AI detection → verified alert (Human-in-the-Loop)
- **Promised in review 1:** "HITL (Human-in-the-Loop): ensures critical AI-detected incidents are verified by humans
  before action" (pitch) and the abstract's "convert AI detections into actionable alerts, assign them to authorized
  responders".
- **What exists:** live detections only appear as a toast and a sound on the admin surveillance page
  (`frontend/src/pages/admin/AdminSurveillance.tsx`) and as a line in `backend/ai-logs/cam6.jsonl`. They never become
  an `Issue`, so they cannot be assigned to a volunteer.
- **To do:** when the Flask service detects fire or violence, POST the event to the Express API (service token or
  shared secret). The API creates an `Issue` with a new status such as `pending-verification`; the admin confirms or
  dismisses it, and confirmation puts it into the normal assign → accept → resolve flow.

## Not carried forward (decided during review 2 preparation)

| Review 1 item | Why it was dropped |
|---|---|
| FastAPI as the main backend | Express already owns the data, auth and real-time events. FastAPI stays for CCTV search only. |
| Three.js 3D maps | Leaflet 2D maps cover alerts, volunteers and evacuation routes. |
| TensorFlow / Keras | The models in use are PyTorch based (YOLOv8, CLIP, FaceNet). |
| Thermal anomaly detection | Needs thermal cameras that the project does not have. |
| Predictive analytics / risk forecasting | Too vague to specify, and there is no historical dataset to train on. |
| Docker + Render/Vercel hosting | Everything runs locally for the demo; deployment can wait until after the review. |
| Sign-language ("Gestura") text in the pitch deck | Pasted in from a different project by mistake; not part of this system. |

## Also worth noting

- The pitch deck's business scope and future scope pages still contain the Gestura sign-language text. Clean that up
  before the deck is shown again.
- The literature survey lists three papers (2021–2023) by description only. Add authors, full titles and venues before
  the final report.
