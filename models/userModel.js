import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const userSchema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String, required: true },
    gender: { type: String, required: true },
    email: { type: String, required: true },
    mobile_number: { type: String, required: true },
    lrn: { type: String, required: true },
    section: { type: String, required: true },
    password: { type: String, required: true },
    adviser: { type: String, required: true },
    grade: { type: String, required: true },
    grade_lvl: { type: String, required: true },
    image: { type: String, required: true },
    passwordLastUpdated: { type: Date, default: Date.now },
    passwordResetRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
