const mongoose = require('mongoose');

// Database name: blood_donation
mongoose.connect('mongodb://127.0.0.1:27017/blood_donation')
  .then(() => console.log("✅ MongoDB Connected: Blood Donation Database"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- User Schema ---
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  blood_group: String,
  password: String,
  created_at: { type: Date, default: Date.now }
});

// --- Donation Schema ---
const donationSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  first_name: String,
  last_name: String,
  blood_group: String,
  age: Number,
  phone: String,
  email: String,
  organisation: String,
  venue: String,
  camp_day: { type: String, default: 'Day 1' },
  units: Number,
  status: { type: String, default: 'Confirmed' },
  donated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema, 'account create');
const Donation = mongoose.model('Donation', donationSchema, 'register donation');

const stmts = {
  async findUserByEmail(email) {
    return await User.findOne({ email: email.toLowerCase().trim() });
  },
  async createUser(data) {
    const user = new User(data);
    await user.save();
    return { lastInsertRowid: user._id };
  },
  async createDonation(data) {
    const donation = new Donation(data);
    await donation.save();
    return { lastInsertRowid: donation._id };
  },
  async allDonations() {
    return await Donation.find().sort({ donated_at: -1 });
  },
  async countDonations() {
    const count = await Donation.countDocuments();
    return { total: count };
  },
  async countConfirmed() {
    const count = await Donation.countDocuments({ status: 'Confirmed' });
    return { total: count };
  },
  async sumUnits() {
    const result = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$units" } } }
    ]);
    return { total: result[0]?.total || 0 };
  },
  async recentDonation(user_id) {
    return await Donation.findOne({ user_id }).sort({ donated_at: -1 });
  }
};

module.exports = { stmts };