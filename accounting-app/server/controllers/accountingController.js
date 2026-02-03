const db = require('../config/database');

// 获取账本记录
const getRecords = async (req, res) => {
  try {
    let query = `
      SELECT 
        ar.*,
        m.name as member_name,
        u.name as distributor_name,
        u.role as distributor_role
      FROM accounting_records ar
      LEFT JOIN members m ON ar.member_id = m.id
      LEFT JOIN users u ON ar.distributor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 如果是分销商，只能看到自己的记录
    if (req.user.role !== 'admin') {
      query += ' AND ar.distributor_id = ?';
      params.push(req.user.id);
    }

    // 筛选条件
    if (req.query.memberId) {
      query += ' AND ar.member_id = ?';
      params.push(req.query.memberId);
    }

    if (req.query.distributorId) {
      query += ' AND ar.distributor_id = ?';
      params.push(req.query.distributorId);
    }

    if (req.query.startDate) {
      query += ' AND ar.record_date >= ?';
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      query += ' AND ar.record_date <= ?';
      params.push(req.query.endDate);
    }

    query += ' ORDER BY ar.record_date DESC, ar.created_at DESC';

    const records = await db.all(query, params);

    res.json({
      success: true,
      data: { records }
    });
  } catch (error) {
    console.error('获取账本记录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 创建账本记录
const createRecord = async (req, res) => {
  try {
    const {
      memberId,
      receivedAmount,
      deposit,
      insurance,
      commission,
      commissionType,
      recordDate,
      city,
      notes
    } = req.body;

    if (!memberId || !receivedAmount || !deposit || !insurance || !recordDate) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写所有必填字段' 
      });
    }

    // 检查成员是否存在
    const member = await db.get('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '成员不存在' 
      });
    }

    // 权限检查：分销商只能为自己的成员创建记录
    if (req.user.role !== 'admin' && member.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权为此成员创建记录' 
      });
    }

    let finalCommission = 0;
    
    // 根据佣金类型计算
    if (commissionType === 'amount') {
      // 固定金额
      finalCommission = parseFloat(commission || 0);
    } else {
      // 比例计算
      const distributor = await db.get(
        'SELECT commission_rate FROM users WHERE id = ?',
        [member.distributor_id]
      );
      finalCommission = receivedAmount * (distributor.commission_rate / 100);
    }

    const netRevenue = receivedAmount - deposit - insurance - finalCommission;

    const result = await db.run(`
      INSERT INTO accounting_records (
        member_id, distributor_id, received_amount, deposit, insurance,
        commission, commission_type, net_revenue, record_date, city, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memberId, member.distributor_id, receivedAmount, deposit, insurance,
      finalCommission, commissionType || 'rate', netRevenue, recordDate, city, notes
    ]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create_record', 'accounting_record', result.id, `创建账本记录: ${member.name} ¥${receivedAmount}`]
    );

    res.json({
      success: true,
      message: '记录创建成功',
      data: { recordId: result.id }
    });
  } catch (error) {
    console.error('创建记录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 更新账本记录
const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查记录是否存在
    const record = await db.get('SELECT * FROM accounting_records WHERE id = ?', [id]);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: '记录不存在' 
      });
    }

    // 权限检查：分销商只能修改自己的记录
    if (req.user.role !== 'admin' && record.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此记录' 
      });
    }

    const {
      receivedAmount,
      deposit,
      insurance,
      recordDate,
      city,
      notes
    } = req.body;

    // 获取分销商的佣金比例
    const distributor = await db.get(
      'SELECT commission_rate FROM users WHERE id = ?',
      [record.distributor_id]
    );

    // 重新计算佣金和净收入
    const commission = receivedAmount * (distributor.commission_rate / 100);
    const netRevenue = receivedAmount - deposit - insurance - commission;

    await db.run(`
      UPDATE accounting_records SET
        received_amount = ?, deposit = ?, insurance = ?,
        commission = ?, net_revenue = ?, record_date = ?,
        city = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      receivedAmount, deposit, insurance,
      commission, netRevenue, recordDate,
      city, notes, id
    ]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_record', 'accounting_record', id, `更新账本记录 ¥${receivedAmount}`]
    );

    res.json({
      success: true,
      message: '记录更新成功'
    });
  } catch (error) {
    console.error('更新记录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 删除账本记录
const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查记录是否存在
    const record = await db.get('SELECT * FROM accounting_records WHERE id = ?', [id]);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: '记录不存在' 
      });
    }

    // 权限检查：只有管理员可以删除记录
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '只有管理员可以删除记录' 
      });
    }

    await db.run('DELETE FROM accounting_records WHERE id = ?', [id]);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_record', 'accounting_record', id, `删除账本记录`]
    );

    res.json({
      success: true,
      message: '记录删除成功'
    });
  } catch (error) {
    console.error('删除记录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取统计数据
const getStatistics = async (req, res) => {
  try {
    let query = 'SELECT * FROM accounting_records WHERE 1=1';
    const params = [];

    // 如果是分销商，只统计自己的数据
    if (req.user.role !== 'admin') {
      query += ' AND distributor_id = ?';
      params.push(req.user.id);
    }

    // 时间范围筛选
    if (req.query.startDate) {
      query += ' AND record_date >= ?';
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      query += ' AND record_date <= ?';
      params.push(req.query.endDate);
    }

    const records = await db.all(query, params);

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

    // 获取成员总数
    let memberQuery = 'SELECT COUNT(*) as count FROM members WHERE status = "active"';
    const memberParams = [];
    if (req.user.role !== 'admin') {
      memberQuery += ' AND distributor_id = ?';
      memberParams.push(req.user.id);
    }
    const memberCount = await db.get(memberQuery, memberParams);
    stats.totalMembers = memberCount.count;

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getStatistics
};
