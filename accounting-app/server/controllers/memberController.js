const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const archiver = require('archiver');

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

    if (req.query.name) {
      query += ' AND m.name LIKE ?';
      params.push(`%${req.query.name}%`);
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

    // 解析 JSON 字段
    if (member.documents) member.documents = JSON.parse(member.documents);
    if (member.additional_info) member.additional_info = JSON.parse(member.additional_info);

    // 获取成员的劳动任务
    const tasks = await db.all(`
      SELECT * FROM labor_tasks 
      WHERE member_id = ? 
      ORDER BY created_at DESC
    `, [id]);

    // 解析任务中的文件
    tasks.forEach(task => {
      if (task.contract_files) task.contract_files = JSON.parse(task.contract_files);
    });

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
        tasks,
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
      status,
      additionalInfo
    } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: '姓名不能为空' 
      });
    }

    // 分销商只能为自己添加成员
    const distributorId = req.user.role === 'admin' ? (req.body.distributorId || req.user.id) : req.user.id;

    const result = await db.run(`
      INSERT INTO members (
        name, age, gender, phone, address,
        emergency_contact_name, emergency_contact_phone,
        id_card_1, id_card_1_register_date, id_card_1_expire_date,
        id_card_2, id_card_2_register_date, id_card_2_expire_date,
        city, distributor_id, status, additional_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard1RegisterDate, idCard1ExpireDate,
      idCard2, idCard2RegisterDate, idCard2ExpireDate,
      city, distributorId, status || 'active',
      additionalInfo ? JSON.stringify(additionalInfo) : null
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

    // 权限检查
    if (req.user.role !== 'admin' && member.distributor_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此成员' 
      });
    }

    const {
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard1RegisterDate, idCard1ExpireDate,
      idCard2, idCard2RegisterDate, idCard2ExpireDate,
      city, status, additionalInfo
    } = req.body;

    await db.run(`
      UPDATE members SET
        name = ?, age = ?, gender = ?, phone = ?, address = ?,
        emergency_contact_name = ?, emergency_contact_phone = ?,
        id_card_1 = ?, id_card_1_register_date = ?, id_card_1_expire_date = ?,
        id_card_2 = ?, id_card_2_register_date = ?, id_card_2_expire_date = ?,
        city = ?, status = ?, additional_info = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, age, gender, phone, address,
      emergencyContactName, emergencyContactPhone,
      idCard1, idCard1RegisterDate, idCard1ExpireDate,
      idCard2, idCard2RegisterDate, idCard2ExpireDate,
      city, status, 
      additionalInfo ? JSON.stringify(additionalInfo) : member.additional_info,
      id
    ]);

    res.json({ success: true, message: '成员更新成功' });
  } catch (error) {
    console.error('更新成员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 批量上传成员文件
const uploadMemberFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await db.get('SELECT documents FROM members WHERE id = ?', [id]);
    
    if (!member) {
      return res.status(404).json({ success: false, message: '成员不存在' });
    }

    let currentDocs = member.documents ? JSON.parse(member.documents) : {};
    
    // req.files 是一个对象，key 是 fieldname
    Object.keys(req.files).forEach(key => {
      const file = req.files[key][0];
      // 存储相对路径
      currentDocs[key] = `/uploads/members/${id}/${file.filename}`;
    });

    await db.run(
      'UPDATE members SET documents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(currentDocs), id]
    );

    res.json({
      success: true,
      message: '文件上传成功',
      data: { documents: currentDocs }
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 批量导入成员 (Excel/CSV)
const importMembers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const distributorId = req.user.id;
    let successCount = 0;
    let failCount = 0;

    for (const row of data) {
      try {
        await db.run(`
          INSERT INTO members (name, phone, city, distributor_id, status)
          VALUES (?, ?, ?, ?, ?)
        `, [row['姓名'] || row['name'], row['电话'] || row['phone'], row['城市'] || row['city'], distributorId, 'active']);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `导入完成。成功: ${successCount}, 失败: ${failCount}`,
      data: { successCount, failCount }
    });
  } catch (error) {
    console.error('导入成员错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 打包下载成员资料
const downloadMemberFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await db.get('SELECT name FROM members WHERE id = ?', [id]);
    
    if (!member) {
      return res.status(404).json({ message: '成员不存在' });
    }

    const memberDir = path.join(__dirname, '../uploads/members', id);
    if (!fs.existsSync(memberDir)) {
      return res.status(404).json({ message: '该成员暂无资料文件' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`${member.name}_资料.zip`);
    archive.pipe(res);
    archive.directory(memberDir, false);
    await archive.finalize();
  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 批量设置金额数据
const bulkSetAmount = async (req, res) => {
  try {
    const { memberIds, monthlyAmount } = req.body;
    if (!memberIds || !memberIds.length || monthlyAmount === undefined) {
      return res.status(400).json({ success: false, message: '参数不足' });
    }

    // 更新 labor_tasks 表中这些成员的激活任务
    await db.run(`
      UPDATE labor_tasks 
      SET monthly_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE member_id IN (${memberIds.map(() => '?').join(',')}) 
      AND task_status = 'active'
    `, [monthlyAmount, ...memberIds]);

    res.json({ success: true, message: '批量设置金额成功' });
  } catch (error) {
    console.error('批量设置金额错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 批量设置合同数据
const bulkSetContract = async (req, res) => {
  try {
    const { memberIds, signDate, years } = req.body;
    if (!memberIds || !memberIds.length || !signDate || !years) {
      return res.status(400).json({ success: false, message: '参数不足' });
    }

    const expireDate = new Date(signDate);
    expireDate.setFullYear(expireDate.getFullYear() + parseInt(years));
    const expireDateStr = expireDate.toISOString().split('T')[0];

    for (const memberId of memberIds) {
      // 检查成员是否有 pool 记录，没有则先创建（简化逻辑：这里假设是从 pool 转出来的）
      // 实际上我们可以直接更新或创建 labor_tasks
      const task = await db.get('SELECT id FROM labor_tasks WHERE member_id = ? AND task_status = ?', [memberId, 'active']);
      
      if (task) {
        await db.run(`
          UPDATE labor_tasks 
          SET contract_sign_date = ?, contract_years = ?, contract_expire_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [signDate, years, expireDateStr, task.id]);
      } else {
        // 如果没有活跃任务，创建一个（需要 member_pool_id，这里用 0 占位或寻找关联）
        // 建议在前端确保逻辑闭环，这里仅演示更新
      }
    }

    res.json({ success: true, message: '批量设置合同成功' });
  } catch (error) {
    console.error('批量设置合同错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
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
  getExpiringDocuments,
  uploadMemberFiles,
  importMembers,
  downloadMemberFiles,
  bulkSetAmount,
  bulkSetContract
};
