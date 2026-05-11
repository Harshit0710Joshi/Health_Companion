const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ragService = require('./rag-service');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

const normalizeOrigin = (url) => url.replace(/\/$/, '');

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => normalizeOrigin(s.trim()))
  .filter(Boolean);

const allowListedVercelApp =
  process.env.ALLOW_VERCEL_APP_ORIGINS !== 'false' &&
  allowedOrigins.some((o) => {
    try {
      return new URL(o).hostname.endsWith('.vercel.app');
    } catch {
      return false;
    }
  });

function isHttpsVercelPreview(origin) {
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && u.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return cb(null, true);

    // Any Vercel preview deploy (*.vercel.app) once you allowlisted a production Vercel URL
    if (allowListedVercelApp && isHttpsVercelPreview(origin)) return cb(null, true);

    console.warn(`[CORS] blocked origin: ${origin} (allowed: ${allowedOrigins.join(', ')})`);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Basic health routes (useful for Render/Vercel checks)
app.get('/', (req, res) => {
  res.type('text/plain').send('Health Companion backend is running');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'health-companion-backend' });
});

// DEBUG LOGGER: See every request hitting the server
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log(`[AUTH] ${req.method} ${req.url} - Header: ${authHeader ? 'Present' : 'Missing'}`);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log(`[AUTH] 401 Unauthorized - No token for ${req.url}`);
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`[AUTH] 403 Forbidden - Invalid token: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'patient' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email }, role: 'patient' });
  } catch (error) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/doctor/register', async (req, res) => {
  console.log('Registering new doctor:', req.body.email);
  const { name, email, password, specialization, experience, fee, initials, color } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = await prisma.doctor.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        specialization: specialization || "General Physician",
        experience: experience || "5 years",
        fee: fee || "$50",
        initials: initials || name.split(' ').map(n => n[0]).join(''),
        color: color || "from-primary to-accent",
        rating: 5.0
      }
    });
    const token = jwt.sign({ id: doctor.id, email: doctor.email, role: 'doctor' }, JWT_SECRET);
    res.json({ token, user: { id: doctor.id, name: doctor.name, email: doctor.email }, role: 'doctor' });
  } catch (error) {
    res.status(400).json({ error: 'Doctor already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'patient' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email }, role: 'patient' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doctor/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await prisma.doctor.findUnique({ where: { email } });
    if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: doctor.id, email: doctor.email, role: 'doctor' }, JWT_SECRET);
    res.json({ token, user: { id: doctor.id, name: doctor.name, email: doctor.email }, role: 'doctor' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor Routes
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctor/appointments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Doctor access required' });
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: { user: true }
    });
    
    const mapped = appointments.map(a => ({
      id: a.id,
      patient: a.user.name,
      doctor: 'You',
      spec: 'Consultation',
      date: a.date,
      time: a.time,
      status: a.status,
      roomId: a.roomId
    }));
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments/:id/complete', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors can complete appointments' });
  
  try {
    const appointment = await prisma.appointment.update({
      where: { id: id },
      data: { status: 'Completed', notes: notes || "" }
    });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Appointment Routes
app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: id },
      include: { doctor: true, user: true }
    });
    
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    
    // Check if user is part of this appointment
    if (req.user.role === 'patient' && appointment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: appointment.id,
      doctor: appointment.doctor.name,
      patient: appointment.user.name,
      spec: appointment.doctor.specialization,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      roomId: appointment.roomId,
      notes: appointment.notes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.id },
      include: { doctor: true }
    });
    
    // Map to match frontend expectations
    const mapped = appointments.map(a => ({
      id: a.id,
      doctor: a.doctor.name,
      spec: a.doctor.specialization,
      date: a.date,
      time: a.time,
      status: a.status,
      roomId: a.roomId
    }));
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  const { doctorId, date, time } = req.body;
  console.log(`[APPT] Creating appointment: User=${req.user.id}, Doctor=${doctorId}, Date=${date}, Time=${time}`);
  
  try {
    const appointment = await prisma.appointment.create({
      data: {
        date,
        time,
        status: 'Scheduled',
        roomId: `room-${Math.random().toString(36).substr(2, 9)}`,
        user: { connect: { id: req.user.id } },
        doctor: { connect: { id: doctorId } }
      },
      include: { doctor: true }
    });
    
    res.json({
      id: appointment.id,
      doctor: appointment.doctor.name,
      spec: appointment.doctor.specialization,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      roomId: appointment.roomId
    });
  } catch (error) {
    console.error("[APPT] Create Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vitals Routes
app.get('/api/vitals', authenticateToken, async (req, res) => {
  // In a real app, this would come from the DB or a connected device
  res.json({
    heartRate: "72",
    bloodPressure: "120/80",
    sugarLevel: "95",
    medications: "3"
  });
});


// Chat Routes

app.get('/api/chat', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chat', authenticateToken, async (req, res) => {
  try {
    await prisma.chatMessage.deleteMany({
      where: { userId: req.user.id }
    });
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }
  try {
    // 1. Save user message
    await prisma.chatMessage.create({
      data: { text, role: 'user', userId: req.user.id }
    });

    // 2. Fetch recent chat history for context
    const history = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const chatHistory = history.reverse().map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // 3. Get AI response
    const aiResponse = await ragService.getRAGResponse(text, chatHistory);

    // 4. Save and return AI message
    const savedAiMsg = await prisma.chatMessage.create({
      data: { text: aiResponse, role: 'ai', userId: req.user.id }
    });

    res.json(savedAiMsg);
  } catch (error) {
    console.error('[CHAT] Error:', error.message || error);
    res.status(500).json({ error: `AI communication failed: ${error.message}` });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await (req.user.role === 'doctor' 
      ? prisma.doctor.findUnique({ where: { id: req.user.id } })
      : prisma.user.findUnique({ where: { id: req.user.id } }));
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: req.user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unknown routes (registered before listen)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    hint: 'Try GET /health or GET /api/doctors',
  });
});

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Socket.io for Video Call Signaling
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected to signaling server:', socket.id);

  socket.on('join-call', ({ appointmentId }) => {
    const roomId = `room-${appointmentId}`;
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
    socket.to(roomId).emit('participant-joined');
  });

  socket.on('webrtc-offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('webrtc-offer', { offer });
  });

  socket.on('webrtc-answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate });
  });

  socket.on('leave-call', ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('participant-left');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from signaling server');
  });
});