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
    plannedDay: { type: String },
  },
  { timestamps: true }
);

sessionSchema.pre('validate', function () {
  this.plannedDay = this.status === 'planned' && this.date ? this.date.toISOString().slice(0, 10) : undefined;
});
sessionSchema.index({ topicObjectId: 1, plannedDay: 1 }, {
  unique: true,
  partialFilterExpression: { status: 'planned', plannedDay: { $type: 'string' } },
});
sessionSchema.index({ topicObjectId: 1, status: 1, completedAt: 1 });
sessionSchema.index({ userObjectId: 1, date: -1, startTime: -1 });
export const Session = mongoose.model("Session", sessionSchema);

