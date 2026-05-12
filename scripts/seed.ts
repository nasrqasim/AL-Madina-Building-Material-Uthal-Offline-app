import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import ShopProfile from "@/models/ShopProfile";
import Account from "@/models/Account";

async function seed() {
  await dbConnect();
  const superAdminExists = await User.findOne({ username: "superadmin" });
  if (!superAdminExists) {
    await User.create({
      username: "superadmin",
      password: await bcrypt.hash("admin123", 10),
      role: "superadmin",
      financialYear: "2025-2026",
    });
  }

  const adminExists = await User.findOne({ username: "najeebahmed@gmail.com" });
  if (!adminExists) {
    await User.create({
      username: "najeebahmed@gmail.com",
      password: await bcrypt.hash("NajeebOil@Shop", 10),
      role: "admin",
      financialYear: "2025-2026",
    });
  }
  if (!(await ShopProfile.findOne())) {
    await ShopProfile.create({ name: "AL HADEED TRADERS", address: "Main Bazar", ntn: "0000000-0" });
  }
  if ((await Account.countDocuments()) === 0) {
    await Account.insertMany([
      { code: "1000", title: "Cash", type: "cash" },
      { code: "1010", title: "Bank", type: "bank" },
      { code: "1100", title: "Accounts Receivable", type: "receivable" },
      { code: "2100", title: "Accounts Payable", type: "payable" },
      { code: "4100", title: "Sales", type: "income" },
      { code: "5100", title: "Daily Expense", type: "expense" },
    ]);
  }
  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
