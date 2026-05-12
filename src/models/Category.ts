import mongoose, { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    type: { type: String, enum: ["main", "sub"], required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", CategorySchema);
export default Category;
