import os
from detector import get_embedding, search_face_in_video   # your existing model functions

def run_face_search(query_path, video_path, output_dir):
    """
    Wrapper function so FastAPI can call your existing model code
    WITHOUT modifying your original functions.
    """

    os.makedirs(output_dir, exist_ok=True)

    # Step 1: Create embedding
    query_embedding = get_embedding(query_path)

    # Step 2: Run video search
    results = search_face_in_video(query_embedding, video_path)

    # Step 3: Convert the list of frame numbers into API-friendly format
    final_matches = []
    for frame in results:
        file_name = f"match_frame_{frame}.jpg"

        final_matches.append({
            "frame": frame,
            "file": file_name,
            "output_url": f"http://localhost:8000/output/face_matches/{file_name}"
        })

    return {
        "total_matches": len(final_matches),
        "matches": final_matches
    }
