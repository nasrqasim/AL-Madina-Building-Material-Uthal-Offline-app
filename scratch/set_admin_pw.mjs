import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb+srv://oilshop:Oil%233421@cluster0.68vjmln.mongodb.net/pos_system_db?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
            username: String,
            password: String,
            role: String,
            financialYear: String,
            isActive: Boolean
        });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const email = 'superadmin@erp.com';
        const newPassword = 'Najeeb@ErpAdmin';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        let user = await User.findOne({ email: email });
        
        if (!user) {
            console.log('User not found by email, trying username superadmin');
            user = await User.findOne({ username: 'superadmin' });
        }

        if (user) {
            user.password = hashedPassword;
            user.email = email; // Ensure email is set correctly
            await user.save();
            console.log('Password updated successfully for', user.username);
        } else {
            console.log('User not found. Creating new superadmin user.');
            await User.create({
                name: 'Super Admin',
                email: email,
                username: 'superadmin',
                password: hashedPassword,
                role: 'superadmin',
                financialYear: '2025-2026',
                isActive: true
            });
            console.log('Superadmin user created.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
