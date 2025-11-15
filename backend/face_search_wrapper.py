import os
from face_detector import get_embedding, search_face_in_video


def run_face_search(query_path, video_path, output_dir, max_matches=None):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Get face embedding
    embedding = get_embedding(query_path)

    # 2. Search inside video
    matches = search_face_in_video(
        query_embedding=embedding,
        video_path=video_path,
        output_dir=output_dir,
        max_matches=max_matches,
    )

    return {
        "total_matches": len(matches),
        "matches": matches
    }
