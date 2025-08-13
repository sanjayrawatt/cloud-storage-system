import jwt from 'jsonwebtoken';

// --- THIS IS THE EXACT SAME SECRET KEY ---
const JWT_SECRET = '2474f9221155aeed6f471f0b133b0760a318c195b500e757b8b69bbe67b9e03a';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is malformed, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;
