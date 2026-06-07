const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak. Token tidak disediakan.' 
    });
  }

  // Format header biasanya: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false, 
      message: 'Format token tidak valid (Gunakan: Bearer <token>).' 
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_maggot_2025');
    req.user = decoded; // Menyimpan data user ter-decode ke request object
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak valid atau telah kedaluwarsa.' 
    });
  }
};
