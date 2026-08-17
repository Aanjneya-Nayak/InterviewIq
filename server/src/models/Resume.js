import mongoose from "mongoose";

/**
 * Resume model.
 *
 * Design decisions:
 * - One resume per user is enforced by the `user` field's unique index.
 *   The service layer uses findOneAndUpdate with upsert:true so both first-time
 *   uploads and replacements go through a single code path.
 * - publicId is stored separately from secureUrl so deletion never requires
 *   parsing a URL — cloudinary.uploader.destroy(publicId) is called directly.
 * - fileSize is stored in bytes; the UI is responsible for formatting (KB/MB).
 * - resourceType is always "raw" for PDF/DOCX — Cloudinary uses this to
 *   determine how to store and serve the file.
 * - uploadedAt tracks when the file was last replaced, independently of the
 *   Mongoose-managed updatedAt timestamp.
 */
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One active resume per user
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true, // Cloudinary asset identifier — used for deletion
    },
    secureUrl: {
      type: String,
      required: true, // HTTPS URL served to the client for preview / download
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["raw"], // PDF and DOCX are always "raw" in Cloudinary
      default: "raw",
    },
    mimeType: {
      type: String,
      required: true,
      enum: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    },
    fileSize: {
      type: Number,
      required: true, // Bytes
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Plain text extracted from the resume file at upload time.
     * Stored here so analysis never needs to re-download or re-parse the file.
     * null means the file was uploaded before this field existed or parsing failed
     * silently (legacy records) — the analysis service guards against this.
     */
    parsedText: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt
  }
);

resumeSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
