/** User id from JWT payload (`jwt.sign({ id: user._id }, ...)`). */
export const getAuthUserId = (req) => {
  const id = req.user?.id;
  return id ? String(id) : null;
};

export const belongsToUser = (doc, userId) => {
  if (!doc || !userId) return false;
  const ownerId = doc.userObjectId?._id ?? doc.userObjectId;
  return ownerId && String(ownerId) === String(userId);
};

/** Sets userObjectId on create payloads from the authenticated user. */
export const injectAuthUserId = (req, res, next) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.body.userObjectId = userId;
  next();
};

export const stripUserObjectId = (data) => {
  if (!data || typeof data !== "object") return data;
  const { userObjectId: _omit, ...rest } = data;
  return rest;
};
