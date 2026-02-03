const db = require('../config/database');

// 获取成员列表
const getMembers = async (req, res) => {
  try {
    let query = `
      SELECT 
        m.*,
        u.name as distributor_name,
        u.role as distributor_role
      FROM members m
      LEFT JOIN users u ON m.distributor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 如果是分销商，只能看到自己的成员
    if (req.user.role !== 'admin') {
      query += ' AND m.distributor_id = ?';
      params.push(req.user.id);
    }

    // 筛选条件
    if (req.query.status) {
      query += ' AND m.status = ?';
      params.push(req.query.status);
    }

    if (req.query.city) {
      query += ' AND m.city = ?';
      params.push(req.query.city);
    }

    if (req.query.distributorId) {
      query += ' AND m.distributor_id = ?';
      params.push(req.query.distributorId);
    }

    query += ' ORDER BY m.created_at DESC';

    const members = await db.all(query, params);

    res.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('获取成员列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取单个成员详情
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await db.get(`
      SELECT 
        m.*,
        u.name as distributor_name,
        u.role as distributor_role,
        u.phone as distributor_phone
      FROM members m
      LEFT JOIN users u ON m.distributor_id = u.id
      WHERE m.id = ?
    `, [id]);

    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '成员不存在' 
      });
    }

    // 权限检查：分销商只能查看自己的成员
    if (req.user.role !== 'admin' && member.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权查看此成员' 
      });
    }

    // 获取成员的账本记录
    const records = await db.all(`
      SELECT * FROM accounting_records 
      WHERE member_id = ? 
      ORDER BY record_date DESC
    `, [id]);

    // 计算统计数据
    const stats = {
      totalReceived: 0,
      totalDeposit: 0,
      totalInsurance: 0,
      totalCommission: 0,
      totalNetRevenue: 0,
      recordCount: records.length
    };

    records.forEach(record => {
      stats.totalReceived += record.received_amount;
      stats.totalDeposit += record.deposit;
      stats.totalInsurance += record.insurance;
      stats.totalCommission += record.commission;
      stats.totalNetRevenue += record.net_revenue;
    });

    res.json({
      success: true,
      data: { 
        member,
        records,
        stats
      }
    });
  } catch (error) {
    console.error('获取成员详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 创建成员
const createMember = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone,
      idCard1,
      idCard1RegisterDate,
      idCard1ExpireDate,
      idCard2,
      idCard2RegisterDate,
      idCard2ExpireDate,
      city,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名不能为空' 
      });
    }

    // 分销商只能为自己添加成员
    const distributorId = req.user.role === 'admin' ? req.body.distributorId : req.user.id;

    if (!distributorId) {
      return res.status(400).json({ 
        success: false, 
        message: '必须指定所属分销商' 
      });
    }

    const result = await db.run(`
      INSERT INTO members (
        name, age, gender, phone, address,
        emergency_contact_name, emergency_contact_phone,
        id_card_1, id_card_1_register_date, id_card_1_expire_date,
        id_card_2, id_card_2_register_date, id_card_2_expire_date,
        city, distributor_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard1RegisterDate, idCard1ExpireDate,
      idCard2, idCard2RegisterDate, idCard2ExpireDate,
      city, distributorId, status || 'active'
    ]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create_member', 'member', result.id, `创建成员: ${name}`]
    );

    res.json({
      success: true,
      message: '成员创建成功',
      data: { memberId: result.id }
    });
  } catch (error) {
    console.error('创建成员错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 更新成员
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查成员是否存在
    const member = await db.get('SELECT * FROM members WHERE id = ?', [id]);
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '成员不存在' 
      });
    }

    // 权限检查：分销商只能修改自己的成员
    if (req.user.role !== 'admin' && member.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此成员' 
      });
    }

    const {
      name,
      age,
      gender,
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone,
      idCard1,
      idCard1RegisterDate,
      idCard1ExpireDate,
      idCard2,
      idCard2RegisterDate,
      idCard2ExpireDate,
      city,
      status
    } = req.body;

    await db.run(`
      UPDATE members SET
        name = ?, age = ?, gender = ?, phone = ?, address = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?,
        id_card_1 = ?, id_card_1_register_date = ?, id_card_1_expire_date = ?,
        id_card_2 = ?, id_card_2_register_date = ?, id_card_2_expire_date = ?,
        city = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard1RegisterDate, idCard1ExpireDate,
      idCard2, idCard2RegisterDate, idCard2ExpireDate,
      city, status, id
    ]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_member', 'member', id, `更新成员信息: ${name}`]
    );

    res.json({
      success: true,
      message: '成员更新成功'
    });
  } catch (error) {
    console.error('更新成员错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 删除成员
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查成员是否存在
    const member = await db.get('SELECT * FROM members WHERE id = ?', [id]);
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '成员不存在' 
      });
    }

    // 权限检查：分销商只能删除自己的成员
    if (req.user.role !== 'admin' && member.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权删除此成员' 
      });
    }

    // 检查是否有关联的账本记录
    const recordCount = await db.get(
      'SELECT COUNT(*) as count FROM accounting_records WHERE member_id = ?',
      [id]
    );

    if (recordCount.count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '该成员有关联的账本记录，无法删除' 
      });
    }

    await db.run('DELETE FROM members WHERE id = ?', [id]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_member', 'member', id, `删除成员: ${member.name}`]
    );

    res.json({
      success: true,
      message: '成员删除成功'
    });
  } catch (error) {
    console.error('删除成员错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取即将过期的证件
const getExpiringDocuments = async (req, res) => {
  try {
    const days = req.query.days || 30;
    
    let query = `
      SELECT 
        m.*,
        u.name as distributor_name
      FROM members m
      LEFT JOIN users u ON m.distributor_id = u.id
      WHERE m.status = 'active'
      AND (
        DATE(m.id_card_1_expire_date) BETWEEN DATE('now') AND DATE('now', '+${days} days')
        OR DATE(m.id_card_2_expire_date) BETWEEN DATE('now') AND DATE('now', '+${days} days')
        OR DATE(m.id_card_1_expire_date) < DATE('now')
        OR DATE(m.id_card_2_expire_date) < DATE('now')
      )
    `;

    const params = [];
    if (req.user.role !== 'admin') {
      query += ' AND m.distributor_id = ?';
      params.push(req.user.id);
    }

    const members = await db.all(query, params);

    res.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('获取过期证件错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getExpiringDocuments
};
