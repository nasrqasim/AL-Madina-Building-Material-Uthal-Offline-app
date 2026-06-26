import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    username: String,
    role: String,
    financialYear: String,
    isActive: Boolean
  }, { collection: 'users' });

  const User = mongoose.model('User', UserSchema);

  const users = await User.find({});
  console.log("Existing Users:", JSON.stringify(users, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
