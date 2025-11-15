// routes/objectSearchMulti.js
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const os = require("os");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Config: where frontend serves videos
const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:3000";
// Python FastAPI endpoint
const PYTHON_SEARCH_URL = process.env.PYTHON_SEARCH_URL || "http://localhost:8000/search-object";

function cleanupFile(filepath) {
  try { fs.unlinkSync(filepath); } catch (e) { /* ignore */ }
}

// Helper: download remote video (stream) into temp file
async function downloadToTemp(url) {
  const tmpPath = path.join(os.tmpdir(), `video_${Date.now()}_${Math.random().toString(36).slice(2,8)}.mp4`);
  const writer = fs.createWriteStream(tmpPath);
  const resp = await axios.get(url, { responseType: "stream", timeout: 120000 });
  await new Promise((res, rej) => {
    resp.data.pipe(writer);
    let errored = false;
    writer.on("error", (err) => { errored = true; writer.close(); rej(err); });
    writer.on("close", () => { if (!errored) res(); });
  });
  return tmpPath;
}

// POST /search-object-multi
// fields: "query" (file), body.videos (JSON array string or form field with comma-separated names)
router.post("/search-object-multi", upload.single("query"), async (req, res) => {
  console.log("=== /search-object-multi received ===");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Query image is required (field name: query)" });
    }

    // videos list may come as JSON string in req.body.videos or as comma-separated string
    let videoNames = [];
    if (req.body.videos) {
      try {
        videoNames = JSON.parse(req.body.videos);
        if (!Array.isArray(videoNames)) throw new Error("videos is not an array");
      } catch (e) {
        // fallback: comma-separated
        videoNames = String(req.body.videos).split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    if (!videoNames.length) {
      // cleanup query file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "No videos selected. Pass videos as JSON array in field 'videos'." });
    }

    console.log("Query file:", req.file.path, "Videos:", videoNames);

    const aggregated = {
      per_video: [], // array of { videoName, pythonResponse }
      total_matches: 0,
    };

    // For each video: download from frontend (HTTP), send to Python as form-data with the saved query file
    for (const vname of videoNames) {
      const videoUrl = `${FRONTEND_BASE.replace(/\/$/, "")}/cctv/${encodeURIComponent(vname)}`;
      console.log(`Processing video ${vname} from ${videoUrl}`);

      let videoTmp = null;
      try {
        // download video to temp file
        videoTmp = await downloadToTemp(videoUrl);
      } catch (e) {
        console.error("Failed to download video:", videoUrl, e.message);
        aggregated.per_video.push({
          video: vname,
          error: `Failed to download video from frontend: ${e.message}`
        });
        continue; // next video
      }

      try {
        // Build form-data for python
        const form = new FormData();
        form.append("query", fs.createReadStream(req.file.path), {
          filename: req.file.originalname || "query.jpg",
        });
        form.append("video", fs.createReadStream(videoTmp), { filename: vname });

        // post to python
        const resp = await axios.post(PYTHON_SEARCH_URL, form, {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 300000, // 5 min; increase if videos are long
        });

        const pythonData = resp.data || {};
        // Normalize output_url to absolute so frontend can fetch it
        if (Array.isArray(pythonData.matches)) {
          pythonData.matches = pythonData.matches.map(m => {
            const out = { ...m };
            if (out.output_url && !out.output_url.startsWith("http")) {
              // Python host
              const pyBase = new URL(PYTHON_SEARCH_URL).origin;
              out.output_url = `${pyBase}${out.output_url}`;
            }
            return out;
          });
        }

        aggregated.per_video.push({
          video: vname,
          success: true,
          python: pythonData
        });

        aggregated.total_matches += (pythonData.saved || (pythonData.matches && pythonData.matches.length) || 0);

      } catch (e) {
        console.error("Error calling Python for video", vname, e.message);
        let details = e.message;
        if (e.response && e.response.data) details = e.response.data;
        aggregated.per_video.push({
          video: vname,
          error: `Python processing failed: ${details}`
        });
      } finally {
        // remove downloaded video temp
        if (videoTmp) cleanupFile(videoTmp);
      }
    } // end for

    // cleanup uploaded query file
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    res.json(aggregated);

  } catch (err) {
    console.error("Error in /search-object-multi:", err);
    // cleanup uploaded file
    try { if (req.file) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

module.exports = router;
