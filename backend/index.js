const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer'); // Multer is now imported and configured in auth.js
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const objectSearchMultiRoute = require("./routes/objectSearchMulti");

dotenv.config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your frontend origin
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

const connectDB = require('./config/db'); // Import DB connection
const User = require('./models/User'); // Import User model
const Issue = require('./models/Issue'); // Import Issue model
const authRoutes = require('./routes/auth'); // Import auth routes
app.use(express.json({ limit: '1mb' })); // parse JSON
app.use("/api", objectSearchMultiRoute);

const faceSearchRoutes = require("./routes/persondetection.js"); 
app.use("/api", faceSearchRoutes);

// Connect to database
connectDB();

// Ensure uploads directory exists - this is now handled in auth.js before multer uses it
const UPLOADS_DIR = path.join(__dirname, 'uploads'); // Define it here for static serving
// const VIDEOS_DIR = path.join(__dirname, 'videos'); // Define it here for static serving
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR);
// }

// Multer setup for file uploads - now handled in auth.js
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOADS_DIR);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve static files from uploads directory
const objectSearchRoute = require("./routes/objectSearch");
app.use("/api", objectSearchRoute);
// Use Auth Routes
app.use('/api', authRoutes); // All auth routes will be prefixed with /api

const attendeeRoutes = require('./routes/attendee'); // Import attendee routes
app.use('/api', attendeeRoutes); // All attendee routes will be prefixed with /api

const adminRoutes = require('./routes/admin'); // Import admin routes
app.use('/api', adminRoutes); // All admin routes will be prefixed with /api

const volunteerRoutes = require('./routes/volunteer'); // Import volunteer routes
app.use('/api', volunteerRoutes); // All volunteer routes will be prefixed with /api

app.use('/api', require('./routes/faceLogin'));
app.use('/api', require('./routes/volunteerRegister'));

// Make io available to our routers
app.set('io', io);

// Start server
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
