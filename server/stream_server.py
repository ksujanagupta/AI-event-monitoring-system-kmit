from flask import Flask, Response
import cv2
from main_live_detection import run_live_detection

app = Flask(__name__)

@app.route("/stream")
def stream():
    print("[INFO] Starting stream server...")
    return Response(run_live_detection(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
