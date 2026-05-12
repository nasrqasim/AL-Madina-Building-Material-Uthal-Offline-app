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

async function resetPassword() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const result = await User.updateOne(
    { username: 'superadmin' },
    { $set: { password: hashedPassword } }
  );
  
  if (result.matchedCount > 0) {
    console.log('Password reset successfully for superadmin');
  } else {
    console.log('User superadmin not found. Creating...');
    await User.create({
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      financialYear: '2025-2026'
    });
    console.log('User superadmin created.');
  }

  await mongoose.disconnect();
}

resetPassword().catch(console.error);
