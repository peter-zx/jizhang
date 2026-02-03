const db = require('../config/database');

// 获取人员池列表
const getMemberPool = async (req, res) => {
  try {
    let query = 'SELECT * FROM member_pool WHERE 1=1';
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND distributor_id = ?';
      params.push(req.user.id);
    }

    if (req.query.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(req.query.isActive);
    }

    query += ' ORDER BY created_at DESC';

    const members = await db.all(query, params);
    res.json({ success: true, data: { members } });
  } catch (error) {
    console.error('获取人员池错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 添加到人员池
const addToPool = async (req, res) => {
  try {
    const {
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard2, city
    } = req.body;

    const distributorId = req.user.role === 'admin' ? req.body.distributorId : req.user.id;

    const result = await db.run(`
      INSERT INTO member_pool (
        name, age, gender, phone, address,
        emergency_contact_name, emergency_contact_phone,
        id_card_1, id_card_2, city, distributor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, age, gender, phone, address, emergencyContactName, emergencyContactPhone, idCard1, idCard2, city, distributorId]);

    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'add_to_pool', 'member_pool', result.id, `添加人员到人员池: ${name}`]
    );

    res.json({ success: true, message: '添加成功', data: { id: result.id } });
  } catch (error) {
    console.error('添加人员池错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 创建劳动任务（从人员池）
const createLaborTask = async (req, res) => {
  try {
    const {
      memberPoolId,
      contractSignDate,
      contractYears,
      monthlyAmount
    } = req.body;

    // 计算合同到期日期
    const signDate = new Date(contractSignDate);
    const expireDate = new Date(signDate);
    expireDate.setFullYear(expireDate.getFullYear() + parseInt(contractYears));

    // 获取人员池信息
    const poolMember = await db.get('SELECT * FROM member_pool WHERE id = ?', [memberPoolId]);
    if (!poolMember) {
      return res.status(404).json({ success: false, message: '人员不存在' });
    }

    // 创建正式成员记录
    const memberResult = await db.run(`
      INSERT INTO members (
        name, age, gender, phone, address,
        emergency_contact_name, emergency_contact_phone,
        id_card_1, id_card_2, city, distributor_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      poolMember.name, poolMember.age, poolMember.gender, poolMember.phone, poolMember.address,
      poolMember.emergency_contact_name, poolMember.emergency_contact_phone,
      poolMember.id_card_1, poolMember.id_card_2, poolMember.city, poolMember.distributor_id, 'active'
    ]);

    // 创建劳动任务
    const taskResult = await db.run(`
      INSERT INTO labor_tasks (
        member_pool_id, member_id, contract_sign_date, contract_years,
        contract_expire_date, monthly_amount, task_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [memberPoolId, memberResult.id, contractSignDate, contractYears, expireDate.toISOString().split('T')[0], monthlyAmount, 'active']);

    // 更新人员池状态
    await db.run('UPDATE member_pool SET is_active = 1 WHERE id = ?', [memberPoolId]);

    // 生成未来月份的账单
    await generateMonthlyBills(taskResult.id, memberResult.id, poolMember.distributor_id, signDate, expireDate, monthlyAmount);

    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create_task', 'labor_task', taskResult.id, `创建劳动任务: ${poolMember.name}`]
    );

    res.json({ success: true, message: '任务创建成功', data: { taskId: taskResult.id, memberId: memberResult.id } });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 生成月度账单
async function generateMonthlyBills(taskId, memberId, distributorId, startDate, endDate, monthlyAmount) {
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate < end) {
    const billMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    await db.run(`
      INSERT INTO monthly_bills (
        labor_task_id, member_id, distributor_id, bill_month, monthly_amount, deposit_confirmed
      ) VALUES (?, ?, ?, ?, ?, 0)
    `, [taskId, memberId, distributorId, billMonth, monthlyAmount]);

    currentDate.setMonth(currentDate.getMonth() + 1);
  }
}

// 退出劳动任务
const exitLaborTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { exitReason } = req.body;

    const task = await db.get('SELECT * FROM labor_tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const exitDate = new Date().toISOString().split('T')[0];

    await db.run(`
      UPDATE labor_tasks SET
        task_status = 'exited',
        exit_date = ?,
        exit_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [exitDate, exitReason, taskId]);

    // 更新成员状态
    await db.run('UPDATE members SET status = ? WHERE id = ?', ['inactive', task.member_id]);

    // 删除未来的账单
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await db.run('DELETE FROM monthly_bills WHERE labor_task_id = ? AND bill_month > ?', [taskId, currentMonth]);

    await db.run(
      'INSERT INTO operation_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'exit_task', 'labor_task', taskId, `退出劳动任务: ${exitReason}`]
    );

    res.json({ success: true, message: '退出成功' });
  } catch (error) {
    console.error('退出任务错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取劳动任务列表
const getLaborTasks = async (req, res) => {
  try {
    let query = `
      SELECT 
        lt.*,
        m.name as member_name,
        u.name as distributor_name
      FROM labor_tasks lt
      LEFT JOIN members m ON lt.member_id = m.id
      LEFT JOIN users u ON m.distributor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ' AND m.distributor_id = ?';
      params.push(req.user.id);
    }

    if (req.query.status) {
      query += ' AND lt.task_status = ?';
      params.push(req.query.status);
    }

    query += ' ORDER BY lt.created_at DESC';

    const tasks = await db.all(query, params);
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  getMemberPool,
  addToPool,
  createLaborTask,
  exitLaborTask,
  getLaborTasks
};
