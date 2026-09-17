// routes/aiSummary.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const { requireRole } = require('../middleware/auth');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is NOT set.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Camera logs: hand-written cam*.json files plus cam6.jsonl appended by server/main_live_detection.py
const LOGS_DIR = path.join(__dirname, '..', 'ai-logs');
const MAX_LOG_CHARS = 50000; // keep the prompt bounded as the live log grows

function loadLogData() {
    if (!fs.existsSync(LOGS_DIR)) {
        return "Log data context unavailable: Directory not found.";
    }

    const logFiles = fs.readdirSync(LOGS_DIR).filter(file => file.endsWith('.json') || file.endsWith('.jsonl'));

    let combinedLogText = "";
    for (const file of logFiles) {
        try {
            const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf-8');
            combinedLogText += `\n--- FILE: ${file} ---\n${content}\n`;
        } catch (error) {
            console.error(`Error reading log file ${file}:`, error);
        }
    }

    // keep the newest part: the live log is appended at the end
    return "--- BEGIN CONTEXT LOG FILES ---\n" + combinedLogText.slice(-MAX_LOG_CHARS) + "\n--- END CONTEXT LOG FILES ---\n";
}

// --- Chatbot API Endpoint ---
router.post('/summary/chat', requireRole('admin'), async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: "AI Service is unavailable. Check API Key." });
    }

    const { userMessage, chatHistory = [] } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: "User message is required." });
    }

    // Read logs on every request so new live detections are included
    const systemInstruction = `You are an AI assistant specialized in analyzing event log files. Your task is to provide concise, accurate summaries and answers based ONLY on the provided log data.
    The logs contain information about fire, crowd, violence, lost objects, and lost persons.
    The log data is provided below:\n${loadLogData()}`;

    // Gemini expects 'model' role for assistant responses; drop the UI's welcome message(s) before the first user turn
    const firstUser = chatHistory.findIndex(msg => msg.role === 'user');
    const history = (firstUser === -1 ? [] : chatHistory.slice(firstUser))
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                ...history,
                { role: 'user', parts: [{ text: userMessage }] }
            ],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            }
        });

        res.json({
            response: response.text
        });

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: "Failed to communicate with the AI model.", details: error.message });
    }
});

module.exports = router;
