import dbConnect from './src/lib/db';
import Category from './src/models/Category';

async function dump() {
  await dbConnect();
  const cats = await Category.find();
  console.log("Categories:", JSON.stringify(cats, null, 2));
  process.exit(0);
}
dump();
