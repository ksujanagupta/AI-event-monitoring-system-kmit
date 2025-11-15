// routes/aiSummary.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

// NOTE: It is assumed that dotenv.config() is called in your index.js
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is NOT set.");
    // In a production app, you might crash the server or disable the route
}
const ai = apiKey ? new GoogleGenAI(apiKey) : null;


// --- 1. Function to Load and Combine Log Data ---
// Define the directory relative to the route file's location
// routes/aiSummary.js

// ... imports ...

// Define the directory relative to the route file's location
// NOTE: __dirname is /path/to/backend/routes, so we step up (..) to backend/
const LOGS_DIR = path.join(__dirname, '..', 'ai-logs'); 
let LOG_CONTEXT = '';

// ... rest of the code ...

function loadLogData() {
    console.log(`Loading AI logs from: ${LOGS_DIR}`);
    if (!fs.existsSync(LOGS_DIR)) {
        console.error(`Log directory not found: ${LOGS_DIR}`);
        return "Log data context unavailable: Directory not found.";
    }

    const logFiles = fs.readdirSync(LOGS_DIR).filter(file => file.endsWith('.json'));
    
    let combinedLogText = "--- BEGIN CONTEXT LOG FILES ---\n";

    for (const file of logFiles) {
        try {
            const filePath = path.join(LOGS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            combinedLogText += `\n--- FILE: ${file} ---\n`;
            combinedLogText += content;
            combinedLogText += "\n";
        } catch (error) {
            console.error(`Error reading log file ${file}:`, error);
        }
    }

    combinedLogText += "\n--- END CONTEXT LOG FILES ---\n";
    return combinedLogText;
}

// Load logs once when the server starts
LOG_CONTEXT = loadLogData();


// --- 2. Chatbot API Endpoint ---
router.post('/summary/chat', async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: "AI Service is unavailable. Check API Key." });
    }
    
    const { userMessage, chatHistory } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: "User message is required." });
    }

    // A. Construct the system instruction and context
    const systemInstruction = `You are an AI assistant specialized in analyzing event log files. Your task is to provide concise, accurate summaries and answers based ONLY on the provided log data. 
    The logs contain information about fire, crud, violence, lost objects, and lost persons.
    The log data is provided below:\n${LOG_CONTEXT}`;

    // B. Format Chat History for the API (Gemini expects 'model' role for assistant responses)
    const history = chatHistory
        .filter(msg => msg.role !== 'assistant' || msg.content !== 'Hello! Your log files are pre-loaded on the server. Ask me questions about fire, violence, lost objects, and person detection events.') // Remove initial welcome message
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

        // C. Send the AI's response back to the frontend
        res.json({
            response: response.text
        });

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: "Failed to communicate with the AI model.", details: error.message });
    }
});

module.exports = router;