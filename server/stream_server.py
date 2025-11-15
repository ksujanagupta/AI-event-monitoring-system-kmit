import os
from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
from main_live_detection import run_live_detection, get_detection_state

app = Flask(__name__)
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/*": {"origins": frontend_origin}})


@app.route("/stream")
def stream():
    print("[INFO] Starting stream server...")
    return Response(
        run_live_detection(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/alerts")
def alerts():
    return jsonify(get_detection_state())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
