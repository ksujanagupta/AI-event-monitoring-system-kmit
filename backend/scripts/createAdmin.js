// Usage: node scripts/createAdmin.js <name> <email> <password>
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) {
  console.error('Usage: node scripts/createAdmin.js <name> <email> <password>');
  process.exit(1);
}

(async () => {
  await connectDB();
  await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'admin', isApproved: true });
  console.log(`Admin "${name}" created.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
