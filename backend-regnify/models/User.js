// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["HR", "EMPLOYEE", "MANAGER", "SITE-HEAD"],
    default: "EMPLOYEE"
  },
  is_active: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);