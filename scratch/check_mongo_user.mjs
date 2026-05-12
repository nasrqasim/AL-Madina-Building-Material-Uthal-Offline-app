import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=["']?(.+?)["']?(\s|$)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1] : null;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  financialYear: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUser() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ username: 'superadmin' });
  if (user) {
    console.log('User found:', {
      username: user.username,
      role: user.role,
      financialYear: user.financialYear,
    });
    
    const isMatch1 = await bcrypt.compare('admin123', user.password);
    console.log('Password "admin123" matches:', isMatch1);
    
    const isMatch2 = await bcrypt.compare('Najeeb@ErpAdmin', user.password);
    console.log('Password "Najeeb@ErpAdmin" matches:', isMatch2);
  } else {
    console.log('User "superadmin" not found');
  }

  await mongoose.disconnect();
}

checkUser().catch(console.error);
