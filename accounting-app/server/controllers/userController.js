const db = require('../config/database');

// 获取分销商列表（仅管理员）
const getDistributors = async (req, res) => {
  try {
    const distributors = await db.all(`
      SELECT 
        u.*,
        COUNT(DISTINCT m.id) as member_count,
        COALESCE(SUM(ar.received_amount), 0) as total_received,
        COALESCE(SUM(ar.commission), 0) as total_commission,
        COALESCE(SUM(ar.net_revenue), 0) as total_net_revenue
      FROM users u
      LEFT JOIN members m ON u.id = m.distributor_id AND m.status = 'active'
      LEFT JOIN accounting_records ar ON u.id = ar.distributor_id
      WHERE u.role IN ('distributor_a', 'distributor_b')
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: { distributors }
    });
  } catch (error) {
    console.error('获取分销商列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取单个分销商详情（仅管理员）
const getDistributorById = async (req, res) => {
  try {
    const { id } = req.params;

    const distributor = await db.get(`
      SELECT * FROM users WHERE id = ? AND role IN ('distributor_a', 'distributor_b')
    `, [id]);

    if (!distributor) {
      return res.status(404).json({ 
        success: false, 
        message: '分销商不存在' 
      });
    }

    // 获取成员列表
    const members = await db.all(`
      SELECT * FROM members WHERE distributor_id = ? ORDER BY created_at DESC
    `, [id]);

    // 获取统计数据
    const stats = await db.get(`
      SELECT 
        COUNT(DISTINCT m.id) as member_count,
        COALESCE(SUM(ar.received_amount), 0) as total_received,
        COALESCE(SUM(ar.deposit), 0) as total_deposit,
        COALESCE(SUM(ar.insurance), 0) as total_insurance,
        COALESCE(SUM(ar.commission), 0) as total_commission,
        COALESCE(SUM(ar.net_revenue), 0) as total_net_revenue,
        COUNT(ar.id) as record_count
      FROM users u
      LEFT JOIN members m ON u.id = m.distributor_id AND m.status = 'active'
      LEFT JOIN accounting_records ar ON u.id = ar.distributor_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    res.json({
      success: true,
      data: { 
        distributor: {
          ...distributor,
          password: undefined
        },
        members,
        stats
      }
    });
  } catch (error) {
    console.error('获取分销商详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 更新分销商信息（仅管理员）
const updateDistributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, commissionRate, status } = req.body;

    const distributor = await db.get(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)',
      [id, 'distributor_a', 'distributor_b']
    );

    if (!distributor) {
      return res.status(404).json({ 
        success: false, 
        message: '分销商不存在' 
      });
    }

    await db.run(`
      UPDATE users SET
        name = ?, phone = ?, email = ?, commission_rate = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, phone, email, commissionRate, status, id]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_distributor', 'user', id, `更新分销商信息: ${name}`]
    );

    res.json({
      success: true,
      message: '分销商信息更新成功'
    });
  } catch (error) {
    console.error('更新分销商错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取操作日志
const getOperationLogs = async (req, res) => {
  try {
    let query = `
      SELECT 
        ol.*,
        u.name as user_name,
        u.role as user_role
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 如果是分销商，只能看到自己的日志
    if (req.user.role !== 'admin') {
      query += ' AND ol.user_id = ?';
      params.push(req.user.id);
    }

    // 时间筛选
    if (req.query.startDate) {
      query += ' AND DATE(ol.created_at) >= ?';
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      query += ' AND DATE(ol.created_at) <= ?';
      params.push(req.query.endDate);
    }

    query += ' ORDER BY ol.created_at DESC LIMIT 100';

    const logs = await db.all(query, params);

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  getDistributors,
  getDistributorById,
  updateDistributor,
  getOperationLogs
};
