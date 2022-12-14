const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Teacher Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Teacher Email is required"],
      unique: [true, "Email address already exist"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("teacher", teacherSchema);
