const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * PERSON SEARCH: Calls FastAPI /search-face
 * Sends: query image + video
 * Returns: matching frames with URLs
 */
router.post(
  "/search-face",
  upload.fields([
    { name: "query", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    console.log("\n=== FACE SEARCH REQUEST RECEIVED ===");

    try {
      // Check files
      if (!req.files || !req.files.query || !req.files.query[0]) {
        return res.status(400).json({ error: "Query image is required" });
      }
      if (!req.files.video || !req.files.video[0]) {
        return res.status(400).json({ error: "Video file is required" });
      }

      const queryFile = req.files.query[0];
      const videoFile = req.files.video[0];

      console.log("Query file:", queryFile.path);
      console.log("Video file:", videoFile.path);

      // Build form data
      const form = new FormData();
      form.append("query", fs.createReadStream(queryFile.path));
      form.append("video", fs.createReadStream(videoFile.path));

      console.log("Sending request → FastAPI : http://localhost:8000/search-face");

      // Send to FastAPI
      const fastApiRes = await axios.post(
        "http://localhost:8000/search-face",
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 300000 // 5-minute timeout
        }
      );

      console.log("Response from FastAPI:", fastApiRes.data);

      // Clean temp files
      try {
        fs.unlinkSync(queryFile.path);
        fs.unlinkSync(videoFile.path);
      } catch (err) {
        console.log("Cleanup error:", err.message);
      }

      res.json(fastApiRes.data);

    } catch (error) {
      console.error("ERROR in /search-face route:", error.message);

      // Clean temp files on error
      if (req.files) {
        try {
          if (req.files.query) fs.unlinkSync(req.files.query[0].path);
          if (req.files.video) fs.unlinkSync(req.files.video[0].path);
        } catch (cleanupErr) {
          console.log("Cleanup error:", cleanupErr.message);
        }
      }

      // FastAPI connection error
      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          error: "FastAPI is not running on port 8000",
        });
      }

      // FastAPI returned error
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * FACE SEARCH MULTIPLE: Calls FastAPI /search-face-multiple
 * Sends: query image + comma-separated video filenames
 * Returns: matching frames with URLs for each video
 */
router.post(
  "/search-face-multiple",
  upload.single("query"),
  async (req, res) => {
    console.log("\n=== FACE SEARCH MULTIPLE REQUEST RECEIVED ===");

    try {
      // Check query image
      if (!req.file) {
        return res.status(400).json({ error: "Query image is required" });
      }

      // Get video files list (comma-separated string)
      const videoFiles = req.body.video_files;
      if (!videoFiles) {
        // Cleanup query file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: "Video files list is required (comma-separated filenames)",
        });
      }

      console.log("Query file:", req.file.path);
      console.log("Video files to process:", videoFiles);

      // Build form data
      const form = new FormData();
      form.append("query", fs.createReadStream(req.file.path), {
        filename: req.file.originalname || "query.jpg",
      });
      form.append("video_files", videoFiles); // Comma-separated string

      console.log(
        "Sending request → FastAPI : http://localhost:8000/search-face-multiple"
      );

      // Send to FastAPI
      const fastApiRes = await axios.post(
        "http://localhost:8000/search-face-multiple",
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 600000, // 10-minute timeout for multiple videos
        }
      );

      console.log("Response from FastAPI:", {
        status: fastApiRes.status,
        totalVideos: fastApiRes.data?.total_videos,
        processedVideos: fastApiRes.data?.processed_videos,
      });

      // Clean temp query file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.log("Cleanup error:", err.message);
      }

      res.json(fastApiRes.data);

    } catch (error) {
      console.error("ERROR in /search-face-multiple route:", error.message);

      // Clean temp files on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
          console.log("Cleanup error:", cleanupErr.message);
        }
      }

      // FastAPI connection error
      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          error: "FastAPI is not running on port 8000",
        });
      }

      // FastAPI returned error
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
