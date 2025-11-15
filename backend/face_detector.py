import cv2
import torch
import numpy as np
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
import os

# Load models
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"[FaceDetector] Using device: {device}")

mtcnn = MTCNN(keep_all=True, device=device)
model = InceptionResnetV1(pretrained='vggface2').eval().to(device)


# ---------------------------------------
# Get embedding from query image
# ---------------------------------------
def get_embedding(img_path):
    img = Image.open(img_path).convert('RGB')
    faces = mtcnn(img)

    if faces is None:
        raise Exception("No face detected in query image.")

    # If multiple faces detected → take first
    if isinstance(faces, torch.Tensor) and len(faces.shape) == 4:
        face = faces[0]
    else:
        face = faces

    emb = model(face.unsqueeze(0).to(device))
    return emb.detach().cpu().numpy()


# ---------------------------------------
# Search face inside video
# ---------------------------------------
def search_face_in_video(query_embedding, video_path, output_dir, threshold=0.7):
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    frame_no = 0
    results = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_no += 1
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        faces = mtcnn(rgb)

        if faces is not None:
            for face in faces:
                emb = model(face.unsqueeze(0).to(device)).detach().cpu().numpy()
                similarity = cosine_similarity(emb, query_embedding)[0][0]

                if similarity > threshold:
                    filename = f"match_frame_{frame_no}.jpg"
                    file_path = os.path.join(output_dir, filename)
                    cv2.imwrite(file_path, frame)

                    results.append({
                        "frame": frame_no,
                        "similarity": float(similarity),
                        "file": filename
                    })

    cap.release()

    return results
