import mongoose from "mongoose";

const { Schema } = mongoose;

const topicSchema = new Schema(
  {
    subjectObjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    userObjectId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["not started", "in progress", "done"],
      default: "not started",
      index: true,
    },
    /** Which spaced-repetition interval applies next (0 = first review after study). */
    reviewStage: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** When this topic should be reviewed again (set on session completion). */
    nextReviewDate: {
      type: Date,
      index: true,
    },
    /** Last time a completed session covered this topic. */
    lastStudiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Topic = mongoose.model("Topic", topicSchema);

