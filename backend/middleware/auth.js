const jwt = require('jsonwebtoken');

// ponytail: role lives in the token, so revoking a user takes effect at expiry; add a DB lookup if instant revocation matters
const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '12h' });

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Usage: router.get('/path', requireRole('admin'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    try {
      req.user = verifyToken(token);
    } catch {
      return res.status(401).json({ msg: 'Please log in.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    next();
  };
}

// face-api.js descriptors are compared by Euclidean distance (the library's own cutoff is ~0.6)
const isDescriptor = (d) => Array.isArray(d) && d.length === 128 && d.every(Number.isFinite);

function faceMatches(a, b) {
  if (!isDescriptor(a) || !isDescriptor(b)) return false;
  const distance = Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));
  return distance <= Number(process.env.FACE_MATCH_THRESHOLD || 0.5);
}

module.exports = { signToken, verifyToken, requireRole, isDescriptor, faceMatches };
