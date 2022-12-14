const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "subject is required"],
      enum: ["English", "Hindi", "Maths", "Science"],
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, "marks is required"],
      trim: true,
    },
    teacherId: {
      type: ObjectId,
      ref: "teacher",
      required: [true, "teacherID is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("student", studentSchema);
