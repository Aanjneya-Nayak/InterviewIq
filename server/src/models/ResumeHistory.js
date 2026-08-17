import mongoose from "mongoose";

/**
 * ResumeHistory model.
 *
 * Records a lightweight snapshot every time a user uploads or replaces
 * their resume. The active Resume document is always the source of truth;
 * this collection exists solely to show the user their upload history.
 *
 * Design decisions:
 * - No unique index on `user` — multiple history entries per user are expected.
 * - `secureUrl` is kept so old versions can be previewed (Cloudinary overwrites
 *   the live asset, but history entries hold the URL at the time of upload).
 * - `parsedText` is NOT stored here to keep the collection lightweight.
 * - TTL is intentionally omitted — history is kept indefinitely unless the
 *   user requests deletion in a future feature.
 */
const resumeHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: { type: String, required: true, trim: true },
    mimeType: {
      type: String,
      required: true,
      enum: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    },
    fileSize: { type: Number, required: true },
    secureUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

resumeHistorySchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const ResumeHistory = mongoose.model("ResumeHistory", resumeHistorySchema);

export default ResumeHistory;
