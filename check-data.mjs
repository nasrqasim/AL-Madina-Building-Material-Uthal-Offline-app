import mongoose from 'mongoose';
import dbConnect from './src/lib/db';
import Account from './src/models/Account';
import Category from './src/models/Category';
import { DocumentSetting } from './src/models/DocumentSetting';
import Employee from './src/models/Employee';
import { FinancialYear } from './src/models/FinancialYear';
import { InventorySetting } from './src/models/InventorySetting';
import Invoice from './src/models/Invoice';
import Item from './src/models/Item';
import Journal from './src/models/Journal';
import JournalEntry from './src/models/JournalEntry';
import Party from './src/models/Party';
import Payroll from './src/models/Payroll';
import { PrintFormat } from './src/models/PrintFormat';
import { Role } from './src/models/Role';
import ShopProfile from './src/models/ShopProfile';
import { User } from './src/models/User';
import VehicleLog from './src/models/VehicleLog';

async function checkData() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const models = {
        Account,
        Category,
        DocumentSetting,
        Employee,
        FinancialYear,
        InventorySetting,
        Invoice,
        Item,
        Journal,
        JournalEntry,
        Party,
        Payroll,
        PrintFormat,
        Role,
        ShopProfile,
        User,
        VehicleLog
    };

    for (const [name, model] of Object.entries(models)) {
        if (!model) {
            console.log(`${name}: Model not found`);
            continue;
        }
        const count = await model.countDocuments({});
        console.log(`${name}: ${count}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
