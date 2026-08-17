/**
 * Cookie configuration is centralised here so all auth endpoints
 * use identical settings. Changing cookie policy is a one-line edit.
 *
 * httpOnly  — JavaScript cannot read the cookie; mitigates XSS token theft.
 * secure    — Cookie is only sent over HTTPS in production.
 * sameSite  — 'lax' allows cross-site GETs (e.g. top-level navigation)
 *             while blocking cross-site POST requests (CSRF protection).
 * maxAge    — 7 days in milliseconds, kept in sync with JWT_EXPIRES_IN.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, COOKIE_OPTIONS);
};

export const clearAuthCookie = (res) => {
  res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
};
