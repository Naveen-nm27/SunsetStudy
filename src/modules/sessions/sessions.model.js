import mongoose from "mongoose";

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userObjectId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectObjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    topicObjectId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    review: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["planned", "completed"],
      default: "planned",
      index: true,
    },
    /** When the session was marked completed (used for charts / retention). */
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);

