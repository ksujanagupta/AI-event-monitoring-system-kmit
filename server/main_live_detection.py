# import cv2
# import numpy as np
# from ultralytics import YOLO
# from violence_model.violence_model import Model   # << YOUR VIOLENCE MODEL
# import time

# # ------------------ CONFIG ------------------
# STREAM_URL = "http://192.0.0.4:8080/video"

# FIRE_MODEL_PATH = "models/best.pt"
# VIOLENCE_MODEL_PATH = None   # kept for future use if needed

# # thresholds & skips
# FIRE_CONF = 0.25             # lower threshold helps catch small/weak flames
# FIRE_FRAME_SKIP = 3          # run fire detection every N frames (1 = every frame)
# VIOLENCE_FRAME_SKIP = 5      # keep your existing violence skip
# # ------------------------------------------------------------------


# def preprocess_for_fire(frame, sat_boost=40):
#     """
#     Boost saturation slightly to make flame colors more prominent.
#     Returns a copy of the frame suitable for passing to the fire model.
#     """
#     # Work on a copy to avoid mutating original frame used for violence model
#     hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.int16)
#     hsv[..., 1] = np.clip(hsv[..., 1] + sat_boost, 0, 255)
#     hsv = hsv.astype(np.uint8)
#     return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)


# def draw_fire_boxes(frame, boxes, color=(0, 0, 255), thickness=2):
#     """
#     boxes: iterable of ultralytics Box objects (each has .xyxy and .conf)
#     Draw each box and label with its confidence.
#     """
#     for box in boxes:
#         # extract coordinates safely
#         try:
#             # box.xyxy is a tensor with shape (1,4) typically
#             xy = box.xyxy[0].int().tolist()
#             x1, y1, x2, y2 = xy
#         except Exception:
#             # fallback: convert whole array then take min/max (shouldn't normally happen)
#             arr = box.xyxy.cpu().numpy()
#             x1, y1, x2, y2 = map(int, arr.ravel())
#         conf_box = float(box.conf) if hasattr(box, "conf") else 0.0

#         cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
#         cv2.putText(frame, f"FIRE {conf_box:.2f}",
#                     (max(x1, 5), max(y1 - 8, 10)),
#                     cv2.FONT_HERSHEY_SIMPLEX,
#                     0.6, color, 2)

# from datetime import datetime

# def write_log(message):
#     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#     with open("event_log.txt", "a") as f:
#         f.write(f"{timestamp} | {message}\n")
#     print(f"[LOG] {timestamp} | {message}")


# def run_live_detection():
#     print("\n[INFO] Starting Live Detection: Fire + Violence\n")

#     fire_model = YOLO(FIRE_MODEL_PATH)
#     violence_model = Model()

#     print("[INFO] Models loaded.")

#     cap = cv2.VideoCapture(STREAM_URL)
#     if not cap.isOpened():
#         print("[ERROR] Failed to open webcam stream.")
#         return

#     cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
#     cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

#     frame_count = 0

#     # Counters
#     fire_counter = 0
#     violence_counter = 0
#     last_event_time = time.time()

#     try:
#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 break

#             frame_count += 1
#             h, w = frame.shape[:2]

#             # ---------------- FIRE ----------------
#             if frame_count % FIRE_FRAME_SKIP == 0:
#                 frame_for_fire = preprocess_for_fire(frame, sat_boost=40)
#                 try:
#                     results_gen = fire_model(frame_for_fire, conf=FIRE_CONF, stream=True)
#                     all_boxes = []
#                     for res in results_gen:
#                         if hasattr(res, "boxes") and len(res.boxes):
#                             for b in res.boxes:
#                                 all_boxes.append(b)

#                     if all_boxes:
#                         fire_counter += 1
#                         draw_fire_boxes(frame, all_boxes)

#                         write_log("FIRE DETECTED")
#                         last_event_time = time.time()

#                         if fire_counter > 5:
#                             yield b'event: alert\ndata: {"type": "fire","camera":"Cam 5"}\n\n'
#                             write_log("⚠️ FIRE ALERT SENT TO FRONTEND (Cam 5)")
#                             fire_counter = 0
#                     else:
#                         fire_counter = 0

#                 except:
#                     pass

#             # ---------------- VIOLENCE ---------------
#             if frame_count % VIOLENCE_FRAME_SKIP == 0:
#                 try:
#                     prediction = violence_model.predict(image=frame)
#                     label = prediction.get("label", "").lower()

#                     if "violence" in label or "fight" in label:
#                         violence_counter += 1

#                         write_log("VIOLENCE DETECTED")
#                         last_event_time = time.time()

#                         if violence_counter > 5:
#                             yield b'event: alert\ndata: {"type": "violence","camera":"Cam 5"}\n\n'
#                             write_log("⚠️ VIOLENCE ALERT SENT TO FRONTEND (Cam 5)")
#                             violence_counter = 0
#                     else:
#                         violence_counter = 0
#                 except:
#                     pass

#             # ---------------- SAFE ----------------
#             if time.time() - last_event_time > 5:
#                 write_log("ALL SAFE")
#                 last_event_time = time.time()

#             # ------------ JPEG STREAM ------------
#             ret_enc, buffer = cv2.imencode(".jpg", frame)
#             if not ret_enc:
#                 continue

#             yield (
#                 b"--frame\r\n"
#                 b"Content-Type: image/jpeg\r\n\r\n"
#                 + buffer.tobytes()
#                 + b"\r\n"
#             )

#     finally:
#         cap.release()


# def run_live_detection_local():
#     """
#     Local version showing a cv2 window for quick testing.
#     """
#     print("\n[INFO] Starting Live Detection: Fire + Violence (Local Mode)\n")

#     fire_model = YOLO(FIRE_MODEL_PATH)
#     violence_model = Model()
#     print("[INFO] Models loaded.")

#     cap = cv2.VideoCapture(STREAM_URL)
#     if not cap.isOpened():
#         print("[ERROR] Failed to open webcam stream.")
#         return

#     cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
#     cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

#     frame_count = 0
#     try:
#         while True:
#             ret, frame = cap.read()
#             if not ret or frame is None:
#                 print("[ERROR] Failed to read frame.")
#                 break

#             frame_count += 1
#             h, w = frame.shape[:2]

#             # Fire inference
#             if frame_count % FIRE_FRAME_SKIP == 0:
#                 frame_for_fire = preprocess_for_fire(frame, sat_boost=40)
#                 try:
#                     results_gen = fire_model(frame_for_fire, conf=FIRE_CONF, stream=True)
#                     all_boxes = []
#                     for res in results_gen:
#                         if hasattr(res, "boxes") and len(res.boxes) > 0:
#                             for b in res.boxes:
#                                 all_boxes.append(b)
#                     if len(all_boxes) > 0:
#                         draw_fire_boxes(frame, all_boxes, color=(0, 0, 255), thickness=3)
#                 except Exception as e:
#                     print(f"[WARN] Fire model inference error: {e}")

#             # Violence inference
#             if frame_count % VIOLENCE_FRAME_SKIP == 0:
#                 try:
#                     prediction = violence_model.predict(image=frame)
#                     label = prediction.get("label", "").lower()
#                     conf = prediction.get("confidence", 0.0)
#                     if "fight" in label or "violence" in label:
#                         box_w, box_h = w // 3, h // 3
#                         x1 = w // 2 - box_w // 2
#                         y1 = h // 2 - box_h // 2
#                         x2 = x1 + box_w
#                         y2 = y1 + box_h
#                         cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 4)
#                         cv2.putText(frame, f"VIOLENCE {conf:.2f}",
#                                     (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX,
#                                     0.9, (0, 0, 255), 2)
#                 except Exception as e:
#                     print(f"[WARN] Violence model error: {e}")

#             cv2.imshow("Live Fire + Violence Detection", frame)
#             if cv2.waitKey(1) == 27:  # ESC
#                 break
#     finally:
#         cap.release()
#         cv2.destroyAllWindows()
#         print("[INFO] Video capture released.")


# if __name__ == "__main__":
#     run_live_detection_local()

import cv2
import numpy as np
import threading
import time
from copy import deepcopy
from ultralytics import YOLO
# NOTE: Ensure you have the 'violence_model' directory
# and 'violence_model.py' with the 'Model' class implemented.
from violence_model.violence_model import Model


# ------------------ CONFIG ------------------
STREAM_URL = "http://192.0.0.4:8080/video"

# Use your fire model path (e.g., a custom-trained YOLOv8s/m/l)
FIRE_MODEL_PATH = "models/best.pt"
# FIRE_MODEL_PATH = "models/yolov8m.pt"
PERSON_MODEL_PATH = "models/yolov8n.pt"  # (Kept for potential future use)

FIRE_CONF = 0.55  # Higher threshold to suppress spurious detections
VIOLENCE_FRAME_SKIP = 5  # Legacy const (still used in local mode)
USE_YCRCB_PREPROCESSING = True  # Set to True to enable YCrCb conversion for fire detection

# Fire heuristics (helps avoid boxes on blank frames)
FIRE_COLOR_GATE = True
FIRE_GLOBAL_COLOR_THRESHOLD = 0.0015  # Require ≥0.15% fire-like pixels before running YOLO
FIRE_BOX_COLOR_THRESHOLD = 0.03       # Require ≥3% fire-like pixels inside each YOLO box

# Performance tuning knobs
FIRE_INFERENCE_INTERVAL = 0.18         # Seconds between fire model runs
VIOLENCE_INFERENCE_INTERVAL = 0.30     # Seconds between violence runs
STREAM_MAX_FPS = 24                    # Cap outgoing FPS to avoid CPU spikes
JPEG_QUALITY = 82
# ------------------------------------------------------------------

# Shared detection state (for frontend alerts)
_detection_state = {
    "fire_active": False,
    "fire_confidence": 0.0,
    "violence_active": False,
    "violence_confidence": 0.0,
    "updated_at": 0.0,
}
_detection_lock = threading.Lock()


def _update_detection_state(**kwargs):
    with _detection_lock:
        _detection_state.update(kwargs)
        _detection_state["updated_at"] = time.time()


def get_detection_state():
    with _detection_lock:
        return _detection_state.copy()


def fire_color_mask(hsv_img):
    """
    Boolean mask of fire-like pixels (reddish/orange + bright + saturated).
    HSV hue in OpenCV is [0,179], so reds wrap near 0 and 179.
    """
    h = hsv_img[..., 0]
    s = hsv_img[..., 1]
    v = hsv_img[..., 2]

    hue_mask = (h <= 35) | (h >= 165)
    sat_mask = s >= 80
    val_mask = v >= 120
    return hue_mask & sat_mask & val_mask


def detect_fire_boxes(frame, fire_model, conf_threshold, use_ycrcb=False):
    """
    Returns a list of (x1, y1, x2, y2, conf) fire boxes detected in the frame.
    """
    if frame is None:
        return []

    hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    color_mask = fire_color_mask(hsv_frame)
    hot_ratio = float(np.mean(color_mask))

    if FIRE_COLOR_GATE and hot_ratio < FIRE_GLOBAL_COLOR_THRESHOLD:
        return []

    processed_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb) if use_ycrcb else frame
    fire_results = fire_model.predict(
        processed_frame,
        conf=conf_threshold,
        verbose=False,
        iou=0.5
    )[0]

    boxes = []
    if fire_results.boxes is not None and len(fire_results.boxes) > 0:
        for box in fire_results.boxes:
            coords = box.xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = map(int, coords)
            conf = float(box.conf[0].cpu().numpy())

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(frame.shape[1], x2)
            y2 = min(frame.shape[0], y2)
            region_mask = color_mask[y1:y2, x1:x2]
            region_ratio = float(np.mean(region_mask)) if region_mask.size else 0.0

            if FIRE_COLOR_GATE and region_ratio < FIRE_BOX_COLOR_THRESHOLD:
                continue

            boxes.append((x1, y1, x2, y2, conf))

    return boxes


def draw_fire_boxes(frame, boxes, color=(0, 0, 255)):
    for (x1, y1, x2, y2, conf) in boxes:
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
        cv2.putText(
            frame,
            f"🔥 FIRE {conf:.2f}",
            (x1, max(15, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2,
        )
    return frame


def detect_violence(frame, violence_model):
    if frame is None:
        return {"active": False, "confidence": 0.0}

    prediction = violence_model.predict(image=frame)
    label = prediction.get("label", "").lower()
    conf = float(prediction.get("confidence", 0.0))
    is_violent = "fight" in label or "violence" in label
    return {"active": is_violent, "confidence": conf}


def draw_violence_overlay(frame, violence_state):
    if not violence_state.get("active"):
        return frame

    h, w = frame.shape[:2]
    box_w, box_h = w // 3, h // 3
    x1 = w // 2 - box_w // 2
    y1 = h // 2 - box_h // 2
    x2 = x1 + box_w
    y2 = y1 + box_h

    color = (255, 0, 0)
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 4)
    cv2.putText(
        frame,
        f"🥊 VIOLENCE {violence_state['confidence']:.2f}",
        (x1, max(20, y1 - 12)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        color,
        2,
    )
    return frame


def run_live_detection():
    """
    Generator function that yields frames for Flask streaming.
    Uses background threads for capture + inference to minimize frame drops.
    """
    print("\n[INFO] Starting Live Detection: Fire + Violence\n")

    fire_model = YOLO(FIRE_MODEL_PATH)
    violence_model = Model()
    print("[INFO] Models loaded successfully.")

    cap = cv2.VideoCapture(STREAM_URL)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("[ERROR] Failed to open webcam stream.")
        return

    shared_state = {
        "frame": None,
        "fire_boxes": [],
        "violence": {"active": False, "confidence": 0.0},
    }
    lock = threading.Lock()
    stop_event = threading.Event()

    def capture_loop():
        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                print("[ERROR] Failed to read frame. Stopping capture thread.")
                stop_event.set()
                break
            with lock:
                shared_state["frame"] = frame
            time.sleep(0.001)

    def fire_loop():
        while not stop_event.is_set():
            with lock:
                frame = None if shared_state["frame"] is None else shared_state["frame"].copy()
            if frame is None:
                time.sleep(0.02)
                continue
            try:
                boxes = detect_fire_boxes(frame, fire_model, FIRE_CONF, USE_YCRCB_PREPROCESSING)
            except Exception as exc:
                print(f"[WARN] Fire inference error: {exc}")
                boxes = []
            with lock:
                shared_state["fire_boxes"] = boxes
            if boxes:
                strongest = max(boxes, key=lambda b: b[4])
                _update_detection_state(
                    fire_active=True,
                    fire_confidence=float(strongest[4]),
                )
            else:
                _update_detection_state(fire_active=False, fire_confidence=0.0)
            time.sleep(FIRE_INFERENCE_INTERVAL)

    def violence_loop():
        while not stop_event.is_set():
            with lock:
                frame = None if shared_state["frame"] is None else shared_state["frame"].copy()
            if frame is None:
                time.sleep(0.03)
                continue
            try:
                violence_state = detect_violence(frame, violence_model)
            except Exception as exc:
                print(f"[WARN] Violence inference error: {exc}")
                violence_state = {"active": False, "confidence": 0.0}
            with lock:
                shared_state["violence"] = violence_state
            if violence_state.get("active"):
                _update_detection_state(
                    violence_active=True,
                    violence_confidence=float(violence_state.get("confidence", 0.0)),
                )
            else:
                _update_detection_state(
                    violence_active=False,
                    violence_confidence=float(violence_state.get("confidence", 0.0)),
                )
            time.sleep(VIOLENCE_INFERENCE_INTERVAL)

    capture_thread = threading.Thread(target=capture_loop, name="capture-thread", daemon=True)
    fire_thread = threading.Thread(target=fire_loop, name="fire-thread", daemon=True)
    violence_thread = threading.Thread(target=violence_loop, name="violence-thread", daemon=True)

    capture_thread.start()
    fire_thread.start()
    violence_thread.start()

    last_frame_time = 0.0
    min_frame_interval = 1.0 / STREAM_MAX_FPS if STREAM_MAX_FPS > 0 else 0.0

    try:
        while not stop_event.is_set():
            now = time.time()
            if min_frame_interval and now - last_frame_time < min_frame_interval:
                time.sleep(min_frame_interval - (now - last_frame_time))
            last_frame_time = time.time()

            with lock:
                frame = None if shared_state["frame"] is None else shared_state["frame"].copy()
                fire_boxes = deepcopy(shared_state["fire_boxes"])
                violence_state = shared_state["violence"].copy()

            if frame is None:
                time.sleep(0.01)
                continue

            frame = draw_fire_boxes(frame, fire_boxes)
            frame = draw_violence_overlay(frame, violence_state)

            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    finally:
        stop_event.set()
        capture_thread.join(timeout=1.0)
        fire_thread.join(timeout=1.0)
        violence_thread.join(timeout=1.0)
        cap.release()
        print("[INFO] Video capture released.")


def run_live_detection_local():
    """
    Local version for testing with cv2.imshow() display.
    Use this when running the script directly.
    """
    print("\n[INFO] Starting Live Detection: Fire + Violence (Local Mode)\n")

    fire_model = YOLO(FIRE_MODEL_PATH)
    violence_model = Model()
    print("[INFO] Models loaded successfully.")

    cap = cv2.VideoCapture(STREAM_URL)
    if not cap.isOpened():
        print("[ERROR] Failed to open webcam stream.")
        return

    frame_idx = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[ERROR] Failed to read frame. Stream may have ended.")
                break

            frame_idx += 1

            fire_boxes = detect_fire_boxes(frame, fire_model, FIRE_CONF, USE_YCRCB_PREPROCESSING)
            frame = draw_fire_boxes(frame, fire_boxes)

            if frame_idx % VIOLENCE_FRAME_SKIP == 0:
                violence_state = detect_violence(frame, violence_model)
            else:
                violence_state = {"active": False, "confidence": 0.0}

            frame = draw_violence_overlay(frame, violence_state)

            cv2.imshow("Live Fire + Violence Detection", frame)
            if cv2.waitKey(1) == 27:  # ESC key
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[INFO] Video capture released and windows closed.")


if __name__ == "__main__":
    run_live_detection_local()