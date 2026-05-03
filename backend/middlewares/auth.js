import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded?.id;
    next();
    console.log("User:", req.user);
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default protect;
