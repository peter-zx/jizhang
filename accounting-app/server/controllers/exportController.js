const xlsx = require('xlsx');
const db = require('../config/database');

// 导出成员数据
const exportMembers = async (req, res) => {
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

    if (req.user.role !== 'admin') {
      query += ' AND m.distributor_id = ?';
      params.push(req.user.id);
    }

    const members = await db.all(query, params);

    // 格式化数据
    const data = members.map(m => ({
      '姓名': m.name,
      '年龄': m.age,
      '性别': m.gender,
      '电话': m.phone,
      '住址': m.address,
      '紧急联系人': m.emergency_contact_name,
      '紧急联系电话': m.emergency_contact_phone,
      '证件一': m.id_card_1,
      '证件一注册日期': m.id_card_1_register_date,
      '证件一到期日期': m.id_card_1_expire_date,
      '证件二': m.id_card_2,
      '证件二注册日期': m.id_card_2_register_date,
      '证件二到期日期': m.id_card_2_expire_date,
      '城市': m.city,
      '所属分销商': m.distributor_name,
      '状态': m.status,
      '创建时间': m.created_at
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '成员列表');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=members.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'export_members', `导出成员数据，共${members.length}条`]
    );
  } catch (error) {
    console.error('导出成员数据错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 导出账本数据
const exportRecords = async (req, res) => {
  try {
    let query = `
      SELECT 
        ar.*,
        m.name as member_name,
        u.name as distributor_name
      FROM accounting_records ar
      LEFT JOIN members m ON ar.member_id = m.id
      LEFT JOIN users u ON ar.distributor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND ar.distributor_id = ?';
      params.push(req.user.id);
    }

    if (req.query.startDate) {
      query += ' AND ar.record_date >= ?';
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      query += ' AND ar.record_date <= ?';
      params.push(req.query.endDate);
    }

    query += ' ORDER BY ar.record_date DESC';

    const records = await db.all(query, params);

    // 格式化数据
    const data = records.map(r => ({
      '日期': r.record_date,
      '成员姓名': r.member_name,
      '到账金额': r.received_amount,
      '保障金': r.deposit,
      '保险金额': r.insurance,
      '佣金': r.commission,
      '净收入': r.net_revenue,
      '城市': r.city,
      '分销商': r.distributor_name,
      '备注': r.notes,
      '创建时间': r.created_at
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '账本记录');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=accounting_records.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'export_records', `导出账本数据，共${records.length}条`]
    );
  } catch (error) {
    console.error('导出账本数据错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 导出完整报表（仅管理员）
const exportFullReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '需要管理员权限' 
      });
    }

    // 获取所有分销商及其统计数据
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
    `);

    const distributorData = distributors.map(d => ({
      '姓名': d.name,
      '层级': d.role === 'distributor_a' ? 'A层' : 'B层',
      '佣金比例': d.commission_rate + '%',
      '成员数': d.member_count,
      '总营收': d.total_received,
      '总佣金': d.total_commission,
      '净收入': d.total_net_revenue,
      '电话': d.phone,
      '邮箱': d.email,
      '状态': d.status
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(distributorData);
    xlsx.utils.book_append_sheet(workbook, worksheet, '分销商统计');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=full_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

    // 记录操作日志
    await db.run(
      'INSERT INTO operation_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'export_full_report', '导出完整报表']
    );
  } catch (error) {
    console.error('导出完整报表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  exportMembers,
  exportRecords,
  exportFullReport
};
