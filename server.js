const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { stmts } = require('./database');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'blood_donation_2026_secret';
const ADMIN_KEY = 'Admin@2026';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(__dirname));

// --- Auth Middlewares ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Session expired.' }); }
}

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY)
    return res.status(403).json({ error: 'Forbidden.' });
  next();
}

// --- API Endpoints ---

app.post('/api/signup', async (req, res) => {
  try {
    const { first_name, last_name, email, blood_group, password } = req.body;
    const existing = await stmts.findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const info = await stmts.createUser({ first_name, last_name, email, blood_group, password: hashed });
    res.status(201).json({ message: 'Account created!', user_id: info.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await stmts.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, name: `${user.first_name} ${user.last_name}`, blood_group: user.blood_group }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, name: `${user.first_name} ${user.last_name}`, email: user.email, blood_group: user.blood_group } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/donate', requireAuth, async (req, res) => {
  try {
    const { age, phone, organisation, venue, camp_day } = req.body;
    const user = req.user;
    const last = await stmts.recentDonation(user.id);
    if (last) {
      const days = (Date.now() - new Date(last.donated_at).getTime()) / 86400000;
      if (days < 56) return res.status(400).json({ error: `You must wait ${Math.ceil(56-days)} more days.` });
    }
    const units = Math.floor(Math.random() * 2) + 1;
    await stmts.createDonation({ user_id: user.id, first_name: user.name.split(' ')[0], last_name: user.name.split(' ')[1] || '', blood_group: user.blood_group, age, phone, email: user.email, organisation, venue, camp_day, units });
    res.status(201).json({ message: 'Donation registered!', donor: { name: user.name, blood_group: user.blood_group, venue, units, camp_day: camp_day || 'Day 1' } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/donations', requireAdmin, async (req, res) => {
  const rows = await stmts.allDonations();
  res.json({ donations: rows });
});

app.get('/api/stats', requireAdmin, async (req, res) => {
  const reg = await stmts.countDonations();
  const conf = await stmts.countConfirmed();
  const units = await stmts.sumUnits();
  res.json({ total_registrations: reg.total, confirmed_donors: conf.total, total_units: units.total });
});

app.listen(PORT, () => {
  console.log(`\n🩸 Blood Donation API running → http://localhost:${PORT}`);
  console.log(`✅ Connected to MongoDB (blood_donation)\n`);
});