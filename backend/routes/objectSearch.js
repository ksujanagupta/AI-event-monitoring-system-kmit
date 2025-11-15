const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/search-object", upload.fields([
    { name: "query", maxCount: 1 },
    { name: "video", maxCount: 1 }
]), async (req, res) => {
    console.log("=== Object Search Request Received ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    try {
        // Check if files were uploaded
        if (!req.files || !req.files["query"] || !req.files["query"][0]) {
            console.error("ERROR: Query file not found in request");
            return res.status(400).json({
                error: "Query image file is required"
            });
        }

        if (!req.files["video"] || !req.files["video"][0]) {
            console.error("ERROR: Video file not found in request");
            return res.status(400).json({
                error: "Video file is required"
            });
        }

        const queryFile = req.files["query"][0];
        const videoFile = req.files["video"][0];

        console.log("Query file:", queryFile.filename, "Path:", queryFile.path);
        console.log("Video file:", videoFile.filename, "Path:", videoFile.path);

        const form = new FormData();
        form.append("query", fs.createReadStream(queryFile.path));
        form.append("video", fs.createReadStream(videoFile.path));

        console.log("Sending request to FastAPI at http://localhost:8000/search-object");
        
        const pythonRes = await axios.post(
            "http://localhost:8000/search-object",
            form,
            { 
                headers: form.getHeaders(), 
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 300000 // 5 minutes timeout
            }
        );

        console.log("FastAPI Response received:", {
            status: pythonRes.status,
            dataKeys: Object.keys(pythonRes.data || {})
        });

        // cleanup temp files
        try {
            fs.unlinkSync(queryFile.path);
            fs.unlinkSync(videoFile.path);
            console.log("Temporary files cleaned up");
        } catch (cleanupError) {
            console.error("Error cleaning up temp files:", cleanupError.message);
        }

        console.log("Sending response to frontend");
        res.json(pythonRes.data);

    } catch (error) {
        console.error("ERROR in objectSearch route:", error.message);
        console.error("Error stack:", error.stack);
        
        // Clean up files if they exist
        if (req.files) {
            try {
                if (req.files["query"] && req.files["query"][0]) {
                    fs.unlinkSync(req.files["query"][0].path);
                }
                if (req.files["video"] && req.files["video"][0]) {
                    fs.unlinkSync(req.files["video"][0].path);
                }
            } catch (cleanupError) {
                console.error("Error cleaning up files after error:", cleanupError.message);
            }
        }

        // Check if it's an axios error (FastAPI connection issue)
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "FastAPI server is not running. Please start the Python server on port 8000.",
                details: error.message
            });
        }

        if (error.response) {
            // FastAPI returned an error
            return res.status(error.response.status || 500).json({
                error: error.response.data || error.message
            });
        }

        res.status(500).json({
            error: error.message,
            details: error.stack
        });
    }
});

// New route: Search object in multiple videos from public folder
router.post("/search-object-multiple", upload.single("query"), async (req, res) => {
    console.log("=== Multiple Video Object Search Request Received ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    try {
        // Check if query image was uploaded
        if (!req.file) {
            console.error("ERROR: Query image file not found in request");
            return res.status(400).json({
                error: "Query image file is required"
            });
        }

        // Get video files list from request body
        const videoFiles = req.body.video_files;
        if (!videoFiles) {
            console.error("ERROR: Video files list not provided");
            return res.status(400).json({
                error: "Video files list is required (comma-separated filenames)"
            });
        }

        console.log("Query file:", req.file.filename, "Path:", req.file.path);
        console.log("Video files to process:", videoFiles);

        const form = new FormData();
        form.append("query", fs.createReadStream(req.file.path));
        form.append("video_files", videoFiles); // Comma-separated string

        console.log("Sending request to FastAPI at http://localhost:8000/search-object-multiple");
        
        const pythonRes = await axios.post(
            "http://localhost:8000/search-object-multiple",
            form,
            { 
                headers: form.getHeaders(), 
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 600000 // 10 minutes timeout for multiple videos
            }
        );

        console.log("FastAPI Response received:", {
            status: pythonRes.status,
            totalVideos: pythonRes.data?.total_videos,
            processedVideos: pythonRes.data?.processed_videos
        });

        // Cleanup temp query file
        try {
            fs.unlinkSync(req.file.path);
            console.log("Temporary query file cleaned up");
        } catch (cleanupError) {
            console.error("Error cleaning up temp file:", cleanupError.message);
        }

        console.log("Sending response to frontend");
        res.json(pythonRes.data);

    } catch (error) {
        console.error("ERROR in search-object-multiple route:", error.message);
        console.error("Error stack:", error.stack);
        
        // Clean up file if it exists
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error("Error cleaning up file after error:", cleanupError.message);
            }
        }

        // Check if it's an axios error (FastAPI connection issue)
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: "FastAPI server is not running. Please start the Python server on port 8000.",
                details: error.message
            });
        }

        if (error.response) {
            // FastAPI returned an error
            return res.status(error.response.status || 500).json({
                error: error.response.data || error.message
            });
        }

        res.status(500).json({
            error: error.message,
            details: error.stack
        });
    }
});

module.exports = router;  