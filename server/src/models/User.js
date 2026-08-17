import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User schema.
 *
 * Design decisions:
 * - `password` has `select: false` so it is never returned in queries by default.
 *   Any query that legitimately needs the hash (login) must opt-in with .select("+password").
 * - The pre-save hook only rehashes when the password field is actually modified,
 *   preventing unnecessary work on unrelated document updates.
 * - `avatar` and `targetRole` are optional — filled in Phase 3/4.
 * - `isVerified` defaults to false — email verification is a Phase 3 concern.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in query results unless explicitly requested
    },
    avatar: {
      type: String,
      default: null,
    },
    targetRole: {
      type: String,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save hook — hash the password before persisting.
 * Only runs when the password field has been modified to avoid rehashing on other updates.
 * Salt rounds of 12 is the production-appropriate baseline (slower than 10 but far more resistant).
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Instance method — compare a candidate password against the stored hash.
 * Used in login flow. Avoids leaking timing information (bcrypt.compare is constant-time).
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Transform the output so the password field is always stripped,
 * even if someone accidentally runs a query without the select guard.
 */
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
