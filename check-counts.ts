import mongoose from 'mongoose';
import dbConnect from './src/lib/db';
import Category from './src/models/Category';
import Item from './src/models/Item';

async function check() {
  await dbConnect();
  console.log("Categories:", await Category.countDocuments());
  console.log("Items:", await Item.countDocuments());
  process.exit(0);
}
check();
