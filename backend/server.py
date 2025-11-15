# from fastapi import FastAPI, UploadFile, File, Form
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from pydantic import BaseModel
# from typing import List
# import shutil
# import tempfile
# from detector import search_object_video
# import os
# from pathlib import Path

# app = FastAPI()

# # CORS (allow frontend + node backend)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Serve images from output/
# OUTPUT_DIR = "output"
# os.makedirs(OUTPUT_DIR, exist_ok=True)
# app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

# # Path to frontend public folder (adjust based on your setup)
# # This should point to where the videos are stored
# FRONTEND_PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public"))
# print(f"Frontend public directory: {FRONTEND_PUBLIC_DIR}")
# if not os.path.exists(FRONTEND_PUBLIC_DIR):
#     print(f"WARNING: Frontend public directory does not exist: {FRONTEND_PUBLIC_DIR}")
# else:
#     print(f"✓ Frontend public directory exists")
#     # List available video files
#     video_files = [f for f in os.listdir(FRONTEND_PUBLIC_DIR) if f.endswith(('.mp4', '.avi', '.mov', '.mkv'))]
#     print(f"Available video files: {video_files}")

# class VideoSearchRequest(BaseModel):
#     video_files: List[str]  # List of video filenames from public folder

# # Search object API (original - for single video upload)
# @app.post("/search-object")
# async def search_object(query: UploadFile = File(...), video: UploadFile = File(...)):
#     print("=" * 50)
#     print("FastAPI: /search-object endpoint called")
#     print(f"Query file: {query.filename}, size: {query.size if hasattr(query, 'size') else 'unknown'}")
#     print(f"Video file: {video.filename}, size: {video.size if hasattr(video, 'size') else 'unknown'}")
    
#     try:
#         # Save files temporarily
#         query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
#         video_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

#         print(f"Saving query to: {query_tmp.name}")
#         print(f"Saving video to: {video_tmp.name}")

#         shutil.copyfileobj(query.file, query_tmp)
#         shutil.copyfileobj(video.file, video_tmp)

#         query_tmp.close()
#         video_tmp.close()

#         print("Files saved. Starting object search...")
        
#         # Run matching
#         results = search_object_video(
#             query_tmp.name,
#             video_tmp.name,
#             OUTPUT_DIR
#         )

#         print(f"Search completed. Results: {type(results)}")
#         print(f"Results keys: {results.keys() if isinstance(results, dict) else 'Not a dict'}")
#         print("=" * 50)

#         return results
    
#     except Exception as e:
#         print(f"ERROR in FastAPI /search-object: {str(e)}")
#         print(f"Error type: {type(e).__name__}")
#         import traceback
#         print(traceback.format_exc())
#         raise

# # New endpoint: Search object in multiple videos from public folder
# @app.post("/search-object-multiple")
# async def search_object_multiple(
#     query: UploadFile = File(...),
#     video_files: str = Form(...)
# ):
#     """
#     Search for object in multiple videos from public folder.
#     video_files should be a comma-separated string of video filenames (e.g., "fire.mp4,violence.mp4")
#     """
#     print("=" * 50)
#     print("FastAPI: /search-object-multiple endpoint called")
#     print(f"Query file: {query.filename}")
#     print(f"Video files: {video_files}")
    
#     try:
#         # Save query image temporarily
#         query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
#         shutil.copyfileobj(query.file, query_tmp)
#         query_tmp.close()
#         print(f"Query saved to: {query_tmp.name}")

#         # Parse video files list
#         if not video_files:
#             return {"error": "No video files specified"}
        
#         video_list = [v.strip() for v in video_files.split(",") if v.strip()]
#         if not video_list:
#             return {"error": "No valid video files specified"}

#         print(f"Processing {len(video_list)} video(s): {video_list}")

#         all_results = []
        
#         # Process each video one by one
#         for video_filename in video_list:
#             video_path = os.path.join(FRONTEND_PUBLIC_DIR, video_filename)
            
#             if not os.path.exists(video_path):
#                 print(f"Warning: Video not found: {video_path}")
#                 all_results.append({
#                     "video": video_filename,
#                     "error": f"Video file not found: {video_filename}",
#                     "matches": [],
#                     "processed_frames": 0,
#                     "saved": 0
#                 })
#                 continue

#             print(f"\n--- Processing video: {video_filename} ---")
            
#             try:
#                 # Create a separate output directory for each video
#                 video_output_dir = os.path.join(OUTPUT_DIR, video_filename.replace(".mp4", "").replace(".avi", ""))
#                 os.makedirs(video_output_dir, exist_ok=True)
                
#                 # Run matching for this video
#                 results = search_object_video(
#                     query_tmp.name,
#                     video_path,
#                     video_output_dir
#                 )
                
#                 # Update output URLs to include video-specific directory
#                 if "matches" in results:
#                     for match in results["matches"]:
#                         if "output_file" in match:
#                             match["output_url"] = f"http://localhost:8000/output/{video_filename.replace('.mp4', '').replace('.avi', '')}/{match['output_file']}"
                
#                 results["video"] = video_filename
#                 all_results.append(results)
                
#                 print(f"✅ Completed {video_filename}: {results.get('saved', 0)} matches found")
                
#             except Exception as e:
#                 print(f"❌ Error processing {video_filename}: {str(e)}")
#                 all_results.append({
#                     "video": video_filename,
#                     "error": str(e),
#                     "matches": [],
#                     "processed_frames": 0,
#                     "saved": 0
#                 })

#         # Clean up query temp file
#         try:
#             os.unlink(query_tmp.name)
#         except:
#             pass

#         print("=" * 50)
#         print(f"All videos processed. Total results: {len(all_results)}")
        
#         return {
#             "results": all_results,
#             "total_videos": len(video_list),
#             "processed_videos": len([r for r in all_results if "error" not in r])
#         }
    
#     except Exception as e:
#         print(f"ERROR in FastAPI /search-object-multiple: {str(e)}")
#         import traceback
#         print(traceback.format_exc())
#         raise
# # -----------------------------------------------------------
# # NEW ENDPOINT: FACE SEARCH IN VIDEO (PERSON DETECTION)
# # -----------------------------------------------------------
# @app.post("/search-face")
# async def search_face(query: UploadFile = File(...), video: UploadFile = File(...)):
#     """
#     Detect the person in the query image across a video.
#     Uses MTCNN + FaceNet (InceptionResnetV1).
#     """

#     print("\n" + "=" * 60)
#     print("📌 FastAPI: /search-face endpoint called")
#     print(f"Query image: {query.filename}")
#     print(f"Video file : {video.filename}")

#     try:
#         # Temporary save files
#         query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
#         video_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

#         shutil.copyfileobj(query.file, query_tmp)
#         shutil.copyfileobj(video.file, video_tmp)

#         query_tmp.close()
#         video_tmp.close()

#         print(f"✔ Saved temp query: {query_tmp.name}")
#         print(f"✔ Saved temp video: {video_tmp.name}")

#         # Output folder for face matches
#         face_output = os.path.join(OUTPUT_DIR, "face_matches")
#         os.makedirs(face_output, exist_ok=True)

#         print("🔍 Running face detection...")
#         results = run_face_search(
#             query_path=query_tmp.name,
#             video_path=video_tmp.name,
#             output_dir=face_output
#         )

#         # Build URLs for frontend
#         for match in results.get("matches", []):
#             match["output_url"] = f"http://localhost:8000/output/face_matches/{match['file']}"

#         print("✔ Face search completed")
#         print("=" * 60)
#         return results

#     except Exception as e:
#         print("❌ ERROR in /search-face:", str(e))
#         return {"error": str(e)}


from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import shutil
import tempfile
from detector import search_object_video
import os
from pathlib import Path

# 👉 Correct import for face search (your model)
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


class VideoSearchRequest(BaseModel):
    video_files: List[str]


# --------------------------------------------------------
# 1️⃣ OBJECT SEARCH IN SINGLE VIDEO
# --------------------------------------------------------
@app.post("/search-object")
async def search_object(query: UploadFile = File(...), video: UploadFile = File(...)):
    print("=" * 50)
    print("FastAPI: /search-object called")
    print(f"Query: {query.filename}")
    print(f"Video: {video.filename}")

    try:
        # Save temporary files
        query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        video_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

        shutil.copyfileobj(query.file, query_tmp)
        shutil.copyfileobj(video.file, video_tmp)

        query_tmp.close()
        video_tmp.close()

        results = search_object_video(query_tmp.name, video_tmp.name, OUTPUT_DIR)

        return results

    except Exception as e:
        print("❌ Error in /search-object:", str(e))
        return {"error": str(e)}


# --------------------------------------------------------
# 2️⃣ OBJECT SEARCH IN MULTIPLE VIDEOS (frontend public folder)
# --------------------------------------------------------
@app.post("/search-object-multiple")
async def search_object_multiple(
    query: UploadFile = File(...),
    video_files: str = Form(...)
):
    print("=" * 50)
    print("FastAPI: /search-object-multiple called")
    print(f"Query: {query.filename}")
    print(f"Videos: {video_files}")

    try:
        # Save query temporarily
        query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        shutil.copyfileobj(query.file, query_tmp)
        query_tmp.close()

        # Parse video list
        file_list = [v.strip() for v in video_files.split(",") if v.strip()]
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
            video_output = os.path.join(
                OUTPUT_DIR,
                video_name.split(".")[0]
            )
            os.makedirs(video_output, exist_ok=True)

            result = search_object_video(query_tmp.name, video_path, video_output)

            # Build full URLs for frontend
            if "matches" in result:
                for m in result["matches"]:
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
        print("❌ Error in /search-object-multiple:", str(e))
        return {"error": str(e)}


# --------------------------------------------------------
# 3️⃣ FACE SEARCH IN VIDEO (your FaceNet model)
# --------------------------------------------------------
@app.post("/search-face")
async def search_face(
    query: UploadFile = File(...),
    video: UploadFile = File(...)
):
    print("=" * 60)
    print("📌 FastAPI: /search-face called")
    print(f"Query Image: {query.filename}")
    print(f"Video File : {video.filename}")

    try:
        # Save temp files
        query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        video_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

        shutil.copyfileobj(query.file, query_tmp)
        shutil.copyfileobj(video.file, video_tmp)

        query_tmp.close()
        video_tmp.close()

        # Output folder for face search
        face_output = os.path.join(OUTPUT_DIR, "face_matches")
        os.makedirs(face_output, exist_ok=True)

        print("🔍 Running Face Search Model...")

        # Your model function
        results = run_face_search(
            query_path=query_tmp.name,
            video_path=video_tmp.name,
            output_dir=face_output
        )

        # Add full URLs for frontend
        for m in results.get("matches", []):
            m["output_url"] = f"http://localhost:8000/output/face_matches/{m['file']}"

        print("✔ Face search done!")
        print("=" * 60)

        return results

    except Exception as e:
        print("❌ Error in /search-face:", str(e))
        return {"error": str(e)}


# --------------------------------------------------------
# 4️⃣ FACE SEARCH IN MULTIPLE VIDEOS (frontend public folder)
# --------------------------------------------------------
@app.post("/search-face-multiple")
async def search_face_multiple(
    query: UploadFile = File(...),
    video_files: str = Form(...)
):
    print("=" * 60)
    print("📌 FastAPI: /search-face-multiple called")
    print(f"Query Image: {query.filename}")
    print(f"Video Files: {video_files}")

    MAX_MATCHES = 2
    try:
        # Save query temporarily
        query_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        shutil.copyfileobj(query.file, query_tmp)
        query_tmp.close()

        # Parse video list
        file_list = [v.strip() for v in video_files.split(",") if v.strip()]
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

            # Output folder for this specific video
            video_output = os.path.join(
                OUTPUT_DIR,
                "face_matches",
                video_name.split(".")[0]
            )
            os.makedirs(video_output, exist_ok=True)

            try:
                # Run face search for this video
                matches_needed = MAX_MATCHES - len(collected_matches)
                if matches_needed <= 0:
                    break
                result = run_face_search(
                    query_path=query_tmp.name,
                    video_path=video_path,
                    output_dir=video_output,
                    max_matches=matches_needed
                )

                # Build full URLs for frontend
                if "matches" in result and result["matches"]:
                    for m in result["matches"]:
                        if "file" in m:
                            m["output_url"] = (
                                f"http://localhost:8000/output/face_matches/{video_name.split('.')[0]}/{m['file']}"
                            )
                            m["video"] = video_name

                result["video"] = video_name
                all_results.append(result)
                collected_matches.extend(result.get("matches", []))

                print(f"✅ Completed {video_name}: {result.get('total_matches', 0)} matches found")

                if len(collected_matches) >= MAX_MATCHES:
                    print("🔚 Match limit reached. Stopping further searches.")
                    break

            except Exception as e:
                print(f"❌ Error processing {video_name}: {str(e)}")
                all_results.append({
                    "video": video_name,
                    "error": str(e),
                    "matches": [],
                    "total_matches": 0
                })

        # Clean up query temp file
        try:
            os.unlink(query_tmp.name)
        except:
            pass

        print("=" * 60)
        print(f"All videos processed. Total results: {len(all_results)}")

        return {
            "results": all_results,
            "total_videos": len(file_list),
            "processed_videos": len([r for r in all_results if "error" not in r]),
            "matches_returned": collected_matches[:MAX_MATCHES],
            "max_matches": MAX_MATCHES
        }

    except Exception as e:
        print("❌ Error in /search-face-multiple:", str(e))
        return {"error": str(e)}
    
