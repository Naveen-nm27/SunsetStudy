import mongoose from "mongoose";

const { Schema } = mongoose;

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const blockSchema = new Schema(
  {
    userObjectId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["lecture", "sleep", "family", "work", "other"],
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    recurring: { type: Boolean, default: false, index: true },
    days: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          if (!this.recurring) return (v ?? []).length === 0;
          if (!Array.isArray(v) || v.length === 0) return false;
          const normalized = v.map((d) => String(d).toLowerCase());
          return normalized.every((d) => DAYS.includes(d));
        },
        message:
          "If recurring is true, days must be a non-empty array of valid weekday strings; otherwise days must be empty.",
      },
    },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const Block = mongoose.model("Block", blockSchema);

