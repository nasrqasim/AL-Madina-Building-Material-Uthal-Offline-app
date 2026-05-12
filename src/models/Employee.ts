import mongoose, { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    designation: { type: String, default: "" },
    department: { type: String, default: "" },
    cnic: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    joiningDate: { type: Date, default: Date.now },
    basicSalary: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    bankName: { type: String, default: "" },
    accountNo: { type: String, default: "" },
  },
  { timestamps: true }
);

const Employee = models.Employee || model("Employee", EmployeeSchema);
export default Employee;
