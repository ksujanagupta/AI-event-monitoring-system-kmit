from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import tempfile
import traceback
from detector import search_object_video
import os

from face_search_wrapper import run_face_search

app = FastAPI()

# --------------------------------------------------------
# CORS SETTINGS
# --------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------
# STATIC FILES (OUTPUT IMAGES)
# --------------------------------------------------------
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# --------------------------------------------------------
# FRONTEND PUBLIC DIRECTORY (video source folder)
# --------------------------------------------------------
FRONTEND_PUBLIC_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
)

print("Frontend public directory:", FRONTEND_PUBLIC_DIR)

if not os.path.exists(FRONTEND_PUBLIC_DIR):
    print("WARNING: Public folder not found!")
else:
    print("✓ Public folder found")
    video_files = [
        f for f in os.listdir(FRONTEND_PUBLIC_DIR)
        if f.endswith((".mp4", ".avi", ".mov", ".mkv"))
    ]
    print("Available videos:", video_files)


def save_temp(upload: UploadFile, suffix: str) -> str:
    """Copy an upload to a temp file and return its path. Caller deletes it."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(upload.file, tmp)
        return tmp.name


def remove(*paths):
    for p in paths:
        if p and os.path.exists(p):
            os.unlink(p)


def parse_video_list(video_files: str):
    # basename() keeps requests inside the public folder
    return [os.path.basename(v.strip()) for v in video_files.split(",") if v.strip()]


# --------------------------------------------------------
# 1️⃣ OBJECT SEARCH IN SINGLE VIDEO
# --------------------------------------------------------
@app.post("/search-object")
async def search_object(query: UploadFile = File(...), video: UploadFile = File(...)):
    print(f"FastAPI: /search-object called (query={query.filename}, video={video.filename})")
    query_tmp = video_tmp = None
    try:
        query_tmp = save_temp(query, ".jpg")
        video_tmp = save_temp(video, ".mp4")
        return search_object_video(query_tmp, video_tmp, OUTPUT_DIR)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        remove(query_tmp, video_tmp)


# --------------------------------------------------------
# 2️⃣ OBJECT SEARCH IN MULTIPLE VIDEOS (frontend public folder)
# --------------------------------------------------------
@app.post("/search-object-multiple")
async def search_object_multiple(
    query: UploadFile = File(...),
    video_files: str = Form(...)
):
    print(f"FastAPI: /search-object-multiple called (query={query.filename}, videos={video_files})")
    query_tmp = None
    try:
        query_tmp = save_temp(query, ".jpg")
        file_list = parse_video_list(video_files)
        all_results = []

        for video_name in file_list:
            video_path = os.path.join(FRONTEND_PUBLIC_DIR, video_name)

            if not os.path.exists(video_path):
                all_results.append({
                    "video": video_name,
                    "error": "Video file not found",
                    "matches": [],
                })
                continue

            print(f"Processing video: {video_name}")

            # Output folder for this specific video
            video_output = os.path.join(OUTPUT_DIR, video_name.split(".")[0])
            os.makedirs(video_output, exist_ok=True)

            result = search_object_video(query_tmp, video_path, video_output)

            # Build full URLs for frontend
            for m in result.get("matches", []):
                m["output_url"] = (
                    f"http://localhost:8000/output/{video_name.split('.')[0]}/{m['output_file']}"
                )

            result["video"] = video_name
            all_results.append(result)

        return {
            "results": all_results,
            "total_videos": len(file_list)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        remove(query_tmp)


# --------------------------------------------------------
# 3️⃣ FACE SEARCH IN VIDEO (FaceNet model)
# --------------------------------------------------------
@app.post("/search-face")
async def search_face(
    query: UploadFile = File(...),
    video: UploadFile = File(...)
):
    print(f"FastAPI: /search-face called (query={query.filename}, video={video.filename})")
    query_tmp = video_tmp = None
    try:
        query_tmp = save_temp(query, ".jpg")
        video_tmp = save_temp(video, ".mp4")

        face_output = os.path.join(OUTPUT_DIR, "face_matches")
        os.makedirs(face_output, exist_ok=True)

        results = run_face_search(
            query_path=query_tmp,
            video_path=video_tmp,
            output_dir=face_output
        )

        for m in results.get("matches", []):
            m["output_url"] = f"http://localhost:8000/output/face_matches/{m['file']}"

        return results

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        remove(query_tmp, video_tmp)


# --------------------------------------------------------
# 4️⃣ FACE SEARCH IN MULTIPLE VIDEOS (frontend public folder)
# --------------------------------------------------------
@app.post("/search-face-multiple")
async def search_face_multiple(
    query: UploadFile = File(...),
    video_files: str = Form(...)
):
    print(f"FastAPI: /search-face-multiple called (query={query.filename}, videos={video_files})")

    MAX_MATCHES = 2
    query_tmp = None
    try:
        query_tmp = save_temp(query, ".jpg")
        file_list = parse_video_list(video_files)
        all_results = []
        collected_matches = []

        for video_name in file_list:
            if len(collected_matches) >= MAX_MATCHES:
                break

            video_path = os.path.join(FRONTEND_PUBLIC_DIR, video_name)

            if not os.path.exists(video_path):
                all_results.append({
                    "video": video_name,
                    "error": "Video file not found",
                    "matches": [],
                    "total_matches": 0
                })
                continue

            print(f"🔍 Processing video: {video_name}")

            video_output = os.path.join(OUTPUT_DIR, "face_matches", video_name.split(".")[0])
            os.makedirs(video_output, exist_ok=True)

            try:
                result = run_face_search(
                    query_path=query_tmp,
                    video_path=video_path,
                    output_dir=video_output,
                    max_matches=MAX_MATCHES - len(collected_matches)
                )

                for m in result.get("matches", []):
                    if "file" in m:
                        m["output_url"] = (
                            f"http://localhost:8000/output/face_matches/{video_name.split('.')[0]}/{m['file']}"
                        )
                        m["video"] = video_name

                result["video"] = video_name
                all_results.append(result)
                collected_matches.extend(result.get("matches", []))

                print(f"✅ Completed {video_name}: {result.get('total_matches', 0)} matches found")

            except Exception as e:
                print(f"❌ Error processing {video_name}: {str(e)}")
                all_results.append({
                    "video": video_name,
                    "error": str(e),
                    "matches": [],
                    "total_matches": 0
                })

        return {
            "results": all_results,
            "total_videos": len(file_list),
            "processed_videos": len([r for r in all_results if "error" not in r]),
            "matches_returned": collected_matches[:MAX_MATCHES],
            "max_matches": MAX_MATCHES
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        remove(query_tmp)
