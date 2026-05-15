import mongoose from "mongoose";

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    userObjectId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["academic", "hobby", "project"],
      required: true,
      index: true,
    },
    description: { type: String, default: "", trim: true },
    color: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);

