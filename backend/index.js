const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config(); // Load environment variables from .env file

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to backend/.env (see .env.example).');
  process.exit(1);
}

const connectDB = require('./config/db');
const { verifyToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

// Only logged-in users may open a socket
io.use((socket, next) => {
  try {
    socket.user = verifyToken(socket.handshake.auth?.token);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', require('./routes/persondetection'));
app.use('/api', require('./routes/aiSummary'));
app.use('/api', require('./routes/objectSearch'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/attendee'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/volunteer'));
app.use('/api', require('./routes/lostFound'));

// Make io available to our routers
app.set('io', io);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
