const db = require('../config/database');

// 获取月度账单列表
const getMonthlyBills = async (req, res) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT 
        mb.*,
        m.name as member_name,
        u.name as distributor_name,
        lt.contract_sign_date,
        lt.contract_expire_date
      FROM monthly_bills mb
      LEFT JOIN members m ON mb.member_id = m.id
      LEFT JOIN users u ON mb.distributor_id = u.id
      LEFT JOIN labor_tasks lt ON mb.labor_task_id = lt.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND mb.distributor_id = ?';
      params.push(req.user.id);
    }

    if (month) {
      query += ' AND mb.bill_month = ?';
      params.push(month);
    }

    query += ' ORDER BY mb.bill_month DESC, mb.created_at DESC';

    const bills = await db.all(query, params);
    res.json({ success: true, data: { bills } });
  } catch (error) {
    console.error('获取账单列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 确认账单发放保障金
const confirmBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const bill = await db.get('SELECT * FROM monthly_bills WHERE id = ?', [id]);
    if (!bill) {
      return res.status(404).json({ success: false, message: '账单不存在' });
    }

    // 权限检查
    if (req.user.role !== 'admin' && bill.distributor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此账单' });
    }

    await db.run(`
      UPDATE monthly_bills SET
        deposit_confirmed = 1,
        confirmed_by = ?,
        confirmed_at = CURRENT_TIMESTAMP,
        notes = ?
      WHERE id = ?
    `, [req.user.id, notes, id]);

    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'confirm_bill', 'monthly_bill', id, `确认${bill.bill_month}账单`]
    );

    res.json({ success: true, message: '确认成功' });
  } catch (error) {
    console.error('确认账单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取当月统计
const getCurrentMonthStats = async (req, res) => {
  try {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    let query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(CASE WHEN deposit_confirmed = 1 THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN deposit_confirmed = 0 THEN 1 ELSE 0 END) as pending_count,
        SUM(monthly_amount) as total_amount,
        SUM(CASE WHEN deposit_confirmed = 1 THEN monthly_amount ELSE 0 END) as confirmed_amount
      FROM monthly_bills
      WHERE bill_month = ?
    `;
    const params = [currentMonth];

    if (req.user.role !== 'admin') {
      query += ' AND distributor_id = ?';
      params.push(req.user.id);
    }

    const stats = await db.get(query, params);
    res.json({ success: true, data: { stats, currentMonth } });
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取收租情况（按月）
const getMonthlyRentCollection = async (req, res) => {
  try {
    const { startMonth, endMonth } = req.query;
    
    let query = `
      SELECT 
        bill_month,
        distributor_id,
        u.name as distributor_name,
        COUNT(*) as total_members,
        SUM(CASE WHEN deposit_confirmed = 1 THEN 1 ELSE 0 END) as confirmed_count,
        SUM(monthly_amount) as total_amount,
        SUM(CASE WHEN deposit_confirmed = 1 THEN monthly_amount ELSE 0 END) as confirmed_amount
      FROM monthly_bills mb
      LEFT JOIN users u ON mb.distributor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND mb.distributor_id = ?';
      params.push(req.user.id);
    }

    if (startMonth) {
      query += ' AND mb.bill_month >= ?';
      params.push(startMonth);
    }

    if (endMonth) {
      query += ' AND mb.bill_month <= ?';
      params.push(endMonth);
    }

    query += ' GROUP BY bill_month, distributor_id ORDER BY bill_month DESC';

    const collection = await db.all(query, params);
    res.json({ success: true, data: { collection } });
  } catch (error) {
    console.error('获取收租情况错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 生成月度提醒
const generateMonthlyReminder = async (req, res) => {
  try {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // 获取所有分销商
    const distributors = await db.all(`
      SELECT id FROM users WHERE role IN ('distributor_a', 'distributor_b') AND status = 'active'
    `);

    for (const dist of distributors) {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_members,
          SUM(CASE WHEN deposit_confirmed = 1 THEN 1 ELSE 0 END) as confirmed_count,
          SUM(CASE WHEN deposit_confirmed = 0 THEN 1 ELSE 0 END) as pending_count,
          SUM(monthly_amount) as total_amount
        FROM monthly_bills
        WHERE distributor_id = ? AND bill_month = ?
      `, [dist.id, currentMonth]);

      // 检查是否已存在提醒
      const existing = await db.get(
        'SELECT id FROM monthly_reminders WHERE distributor_id = ? AND reminder_month = ?',
        [dist.id, currentMonth]
      );

      if (!existing) {
        await db.run(`
          INSERT INTO monthly_reminders (
            distributor_id, reminder_month, total_members, confirmed_count,
            pending_count, total_amount, is_read
          ) VALUES (?, ?, ?, ?, ?, ?, 0)
        `, [dist.id, currentMonth, stats.total_members, stats.confirmed_count, stats.pending_count, stats.total_amount]);
      }
    }

    res.json({ success: true, message: '提醒生成成功' });
  } catch (error) {
    console.error('生成提醒错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取提醒列表
const getReminders = async (req, res) => {
  try {
    let query = 'SELECT * FROM monthly_reminders WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND distributor_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY reminder_month DESC, created_at DESC';

    const reminders = await db.all(query, params);
    res.json({ success: true, data: { reminders } });
  } catch (error) {
    console.error('获取提醒错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 标记提醒已读
const markReminderRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.run('UPDATE monthly_reminders SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: '标记成功' });
  } catch (error) {
    console.error('标记提醒错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getMonthlyBills,
  confirmBill,
  getCurrentMonthStats,
  getMonthlyRentCollection,
  generateMonthlyReminder,
  getReminders,
  markReminderRead
};
