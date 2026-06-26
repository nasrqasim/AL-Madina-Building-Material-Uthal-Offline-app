import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    financialYear: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }, { collection: 'users', timestamps: true });

  const User = mongoose.model('User', UserSchema);

  const email = "user1najeeboilshop@gmail.com";
  const username = "user1najeeboilshop@gmail.com";
  const plaintextPassword = "Oilshop#User@092";
  const role = "sales_user";
  const financialYear = "2025-2026";
  const name = "Sales User";

  // Check if exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log("User already exists. Updating password and role...");
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10);
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.name = name;
    existingUser.financialYear = financialYear;
    await existingUser.save();
    console.log("User updated successfully");
  } else {
    console.log("Creating new user...");
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10);
    const newUser = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role,
      financialYear,
      isActive: true
    });
    console.log("User created successfully:", newUser);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
