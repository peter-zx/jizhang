const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '无效的认证令牌' 
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限' 
    });
  }
  next();
};

const distributorOrAdmin = (req, res, next) => {
  if (!['admin', 'distributor_a', 'distributor_b'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: '需要分销商或管理员权限' 
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminOnly,
  distributorOrAdmin
};
