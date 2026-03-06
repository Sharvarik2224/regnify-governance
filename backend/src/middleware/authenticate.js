import getFirebaseAdmin from "../config/firebaseAdmin.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    return next();
  } catch (error) {
    console.error("[AuthMiddleware] Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authenticate;
