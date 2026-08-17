import * as resumeService from "../services/resumeService.js";

/**
 * Controllers are intentionally thin — they receive the request,
 * delegate to the service layer, and shape the response.
 * No Cloudinary or file logic lives here.
 */

/**
 * POST /api/resume/upload
 * Upload a resume for the first time.
 */
export const uploadResume = async (req, res, next) => {
  try {
    const resume = await resumeService.uploadResume(req.user._id, req.file);
    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully.",
      resume,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resume
 * Get the authenticated user's resume metadata.
 */
export const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResume(req.user._id);

    if (!resume) {
      return res.status(200).json({
        success: true,
        resume: null,
      });
    }

    res.status(200).json({
      success: true,
      resume,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/resume
 * Delete the authenticated user's resume from Cloudinary and database.
 */
export const deleteResume = async (req, res, next) => {
  try {
    await resumeService.deleteResume(req.user._id);
    res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/resume/replace
 * Replace an existing resume with a new file.
 * Uses the same service method as upload — the upsert handles both cases.
 */
export const replaceResume = async (req, res, next) => {
  try {
    const resume = await resumeService.uploadResume(req.user._id, req.file);
    res.status(200).json({
      success: true,
      message: "Resume replaced successfully.",
      resume,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resume/history
 * Return the last 5 resume upload history entries for the authenticated user.
 */
export const getResumeHistory = async (req, res, next) => {
  try {
    const history = await resumeService.getResumeHistory(req.user._id, 5);
    res.status(200).json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
