const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const config = require('../config/config');

// 登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE username = ? AND status = ?',
      [username, 'active']
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
          email: user.email
        }
      }
    });

    // 记录登录日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'login', '用户登录系统']
    );
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 注册
const register = async (req, res) => {
  try {
    const { username, password, name, phone, email, inviteCode } = req.body;

    if (!username || !password || !name || !inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写所有必填字段' 
      });
    }

    // 验证邀请码
    const invite = await db.get(
      'SELECT * FROM invite_codes WHERE code = ? AND status = ?',
      [inviteCode, 'unused']
    );

    if (!invite) {
      return res.status(400).json({ 
        success: false, 
        message: '邀请码无效或已被使用' 
      });
    }

    // 检查用户名是否已存在
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 生成用户邀请码
    const userInviteCode = uuidv4().substring(0, 8).toUpperCase();

    // 根据邀请码确定角色和佣金比例
    let commissionRate = 0;
    if (invite.role === 'distributor_a') {
      commissionRate = 10;
    } else if (invite.role === 'distributor_b') {
      commissionRate = 8;
    }

    // 创建新用户
    const result = await db.run(
      `INSERT INTO users 
      (username, password, name, role, phone, email, commission_rate, invite_code, invited_by, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, name, invite.role, phone, email, commissionRate, userInviteCode, invite.created_by, 'active']
    );

    // 更新邀请码状态
    await db.run(
      'UPDATE invite_codes SET status = ?, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['used', result.id, invite.id]
    );

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [result.id, 'register', `新用户注册: ${username}`]
    );

    res.json({
      success: true,
      message: '注册成功，请登录',
      data: {
        userId: result.id,
        inviteCode: userInviteCode
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 生成邀请码（管理员或A层分销）
const generateInviteCode = async (req, res) => {
  try {
    const { role, count = 1 } = req.body;

    // 权限校验：A层分销只能生成B层邀请码
    if (req.user.role === 'distributor_a' && role !== 'distributor_b') {
      return res.status(403).json({ 
        success: false, 
        message: 'A层分销只能生成B层邀请码' 
      });
    }

    if (!['distributor_a', 'distributor_b'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的角色类型' 
      });
    }

    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = uuidv4().substring(0, 8).toUpperCase();
      await db.run(
        'INSERT INTO invite_codes (code, created_by, role, status) VALUES (?, ?, ?, ?)',
        [code, req.user.id, role, 'unused']
      );
      codes.push(code);
    }

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'generate_invite_code', `生成${count}个${role}邀请码`]
    );

    res.json({
      success: true,
      message: '邀请码生成成功',
      data: { codes }
    });
  } catch (error) {
    console.error('生成邀请码错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取邀请码列表（管理员或A层分销）
const getInviteCodes = async (req, res) => {
  try {
    let query = `
      SELECT 
        ic.*,
        creator.name as creator_name,
        user.name as used_by_name
      FROM invite_codes ic
      LEFT JOIN users creator ON ic.created_by = creator.id
      LEFT JOIN users user ON ic.used_by = user.id
    `;
    const params = [];

    // A层分销只能查看自己生成的邀请码
    if (req.user.role === 'distributor_a') {
      query += ' WHERE ic.created_by = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY ic.created_at DESC';
    const codes = await db.all(query, params);

    res.json({
      success: true,
      data: { codes }
    });
  } catch (error) {
    console.error('获取邀请码列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, username, name, role, phone, email, commission_rate, invite_code, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 修改个人资料（昵称、密码）
const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: '昵称不能为空' });
    }

    const updates = ['name = ?'];
    const params = [name];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    params.push(userId);
    await db.run(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: '个人资料已更新'
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 设置分销商金额参数（可多次修改）
const updateDistributorSettings = async (req, res) => {
  try {
    const { commissionAmount, depositAmount, insuranceAmount } = req.body;
    const userId = req.user.id;

    // 检查必填字段（允许0值）
    if (commissionAmount === undefined || commissionAmount === null ||
        depositAmount === undefined || depositAmount === null ||
        insuranceAmount === undefined || insuranceAmount === null) {
      return res.status(400).json({ success: false, message: '请填写所有金额字段' });
    }

    // 检查用户
    const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 更新金额设置，不设置锁定标志
    await db.run(`
      UPDATE users SET 
        commission_amount = ?,
        deposit_amount = ?,
        insurance_amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [commissionAmount, depositAmount, insuranceAmount, userId]);

    res.json({
      success: true,
      message: '金额设置已保存'
    });
  } catch (error) {
    console.error('设置金额错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 管理员解锁分销商设置
const unlockDistributorSettings = async (req, res) => {
  try {
    const { userId } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '需要管理员权限' });
    }

    await db.run(
      'UPDATE users SET settings_locked = 0 WHERE id = ?',
      [userId]
    );

    res.json({ success: true, message: '已解锁该分销商的设置权限' });
  } catch (error) {
    console.error('解锁设置错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  login,
  register,
  generateInviteCode,
  getInviteCodes,
  getCurrentUser,
  updateProfile,
  updateDistributorSettings,
  unlockDistributorSettings
};
