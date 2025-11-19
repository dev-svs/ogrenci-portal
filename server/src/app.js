require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const pool = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const uc1Routes = require('./routes/uc1.routes');



const app = express();
app.use('/api/uc1', uc1Routes);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB DOWN', details: e.message });
  }
});

app.use('/api/auth', authRoutes);

// basit hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('ERR:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));

const clubsRoutes = require('./routes/clubs.routes');
app.use('/api/clubs', clubsRoutes);

const examsRoutes = require('./routes/exams.routes');
app.use('/api/exams', examsRoutes);

const counselRoutes = require('./routes/counsel.routes');
app.use('/api/counsel', counselRoutes);

const apptRoutes = require('./routes/appt.routes');
app.use('/api/appts', apptRoutes);

const eventsRoutes = require('./routes/events.routes');
app.use('/api/events', eventsRoutes);

const usersRoutes = require('./routes/users.routes');
app.use('/api/users', usersRoutes);

const suggestionsRoutes = require('./routes/suggestions.routes');
app.use('/api/suggestions', suggestionsRoutes);