require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const os = require('os');
const mongoose = require('mongoose');

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const sopRoutes = require('./routes/sopRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

/* =========================
   MIDDLEWARE
========================= */
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']; // Add your exact frontend URL here

app.use(cors({
  origin: allowedOrigins, 
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

/* =========================
   ADVANCED HEALTH FUNCTION
========================= */
const getCPUUsage = () => {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  cpus.forEach(core => {
    for (let type in core.times) {
      total += core.times[type];
    }
    idle += core.times.idle;
  });

  return {
    usagePercent: Math.round((1 - idle / total) * 100)
  };
};

const getHealthStatus = () => ({
  status: 'online',

  uptime: process.uptime(),

  timestamp: Date.now(),

  db: {
    status: mongoose.connection.readyState === 1 ? 'online' : 'db-down'
  },

  memory: {
    rss: process.memoryUsage().rss,
    heapTotal: process.memoryUsage().heapTotal,
    heapUsed: process.memoryUsage().heapUsed
  },

  cpu: getCPUUsage(),

  system: {
    loadAvg: os.loadavg(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem()
  }
});

/* =========================
   HEALTH ENDPOINT
========================= */
app.get('/health', (req, res) => {
  res.status(200).json(getHealthStatus());
});

/* =========================
   SWAGGER
========================= */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'DMAC Gatekeeper API',
    version: '1.0.0',
    description: 'API Documentation'
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* =========================
   ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/sops', sopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

/* =========================
   SERVER + SOCKET.IO
========================= */
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

const EVENTS = {
  STATUS: 'server_status'
};

/* =========================
   SOCKET CONNECTION
========================= */
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send full system health immediately
  socket.emit(EVENTS.STATUS, getHealthStatus());

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

/* =========================
   HEARTBEAT (5 sec)
========================= */
setInterval(() => {
  io.emit(EVENTS.STATUS, getHealthStatus());
}, 5000);

/* =========================
   START SERVER AFTER DB
========================= */
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ DB connection failed:', error);
    process.exit(1);
  }
};

startServer();