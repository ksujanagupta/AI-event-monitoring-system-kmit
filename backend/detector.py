import cv2
import numpy as np
import os
from time import time

# ---------- CONFIG ----------
MIN_GOOD_MATCHES = 12
RANSAC_REPROJ_THRESHOLD = 5.0
MIN_INLIER_RATIO = 0.25
HIST_THRESHOLD = 0.78
COOLDOWN_FRAMES = 45
MAX_SAVES = 20
RESIZE_MAX_DIM = 800
# ----------------------------

orb = cv2.ORB_create(nfeatures=3000)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)


def read_and_resize(path_or_img):
    if isinstance(path_or_img, str):
        img = cv2.imread(path_or_img)
        if img is None:
            raise FileNotFoundError(f"Cannot read {path_or_img}")
    else:
        img = path_or_img

    h, w = img.shape[:2]
    max_dim = max(h, w)

    if max_dim > RESIZE_MAX_DIM:
        scale = RESIZE_MAX_DIM / max_dim
        img = cv2.resize(img, (int(w * scale), int(h * scale)), cv2.INTER_AREA)

    return img


def compute_orb_features(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    kp, des = orb.detectAndCompute(gray, None)
    return kp, des


def lowe_ratio_match(des1, des2, ratio=0.75):
    if des1 is None or des2 is None:
        return []
    knn = bf.knnMatch(des1, des2, k=2)
    good = []
    for m_n in knn:
        if len(m_n) != 2:
            continue
        m, n = m_n
        if m.distance < ratio * n.distance:
            good.append(m)
    return good


def geometric_verification(kp1, kp2, matches):
    if len(matches) < 4:
        return 0, 0.0, None

    src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, RANSAC_REPROJ_THRESHOLD)
    if mask is None:
        return 0, 0.0, None

    inliers = int(mask.sum())
    inlier_ratio = inliers / max(len(matches), 1)

    return inliers, inlier_ratio, H


def histogram_correlation(img1, img2, bins=(8, 8, 8)):
    h1 = cv2.calcHist([img1], [0, 1, 2], None, bins, [0,256,0,256,0,256])
    h2 = cv2.calcHist([img2], [0, 1, 2], None, bins, [0,256,0,256,0,256])
    cv2.normalize(h1, h1)
    cv2.normalize(h2, h2)
    return float(cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL))


def search_object_video(query_img_path, video_path, output_dir):

    os.makedirs(output_dir, exist_ok=True)

    # Load query
    q_img = read_and_resize(query_img_path)
    q_kp, q_des = compute_orb_features(q_img)

    cap = cv2.VideoCapture(video_path)

    frame_no = 0
    saved = 0
    cooldown = 0
    matches_list = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_no += 1

        frame_small = read_and_resize(frame)
        kp_f, des_f = compute_orb_features(frame_small)

        good_matches = lowe_ratio_match(q_des, des_f)
        num_good = len(good_matches)

        inliers, inlier_ratio, H = (
            geometric_verification(q_kp, kp_f, good_matches)
            if num_good >= 4
            else (0, 0.0, None)
        )

        hist_score = histogram_correlation(q_img, frame_small)

        accept = False
        reason = ""

        if num_good >= MIN_GOOD_MATCHES and inlier_ratio >= MIN_INLIER_RATIO and inliers >= 8:
            accept = True
            reason = "ORB+RANSAC"
        elif hist_score >= HIST_THRESHOLD and num_good >= 8:
            accept = True
            reason = "HIST+ORB"
        elif hist_score >= 0.9 and num_good >= 4:
            accept = True
            reason = "STRONG HIST"

        if accept and cooldown <= 0 and saved < MAX_SAVES:
            saved += 1
            cooldown = COOLDOWN_FRAMES

            out_file = f"match_{frame_no}.jpg"
            out_path = os.path.join(output_dir, out_file)

            cv2.imwrite(out_path, frame)

            matches_list.append({
                "frame": frame_no,
                "reason": reason,
                "good_matches": num_good,
                "inliers": inliers,
                "inlier_ratio": inlier_ratio,
                "hist_score": hist_score,
                "output_file": out_file,
                "output_url": f"http://localhost:8000/output/{out_file}",
            })

        else:
            cooldown = max(0, cooldown - 1)

        if saved >= MAX_SAVES:
            break

    cap.release()

    return {
        "matches": matches_list,
        "processed_frames": frame_no,
        "saved": saved
    }
