const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/accounting.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('数据库连接失败:', err);
          reject(err);
        } else {
          console.log('数据库连接成功');
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 用户表（管理员和分销商）
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            commission_rate REAL DEFAULT 0,
            commission_amount REAL DEFAULT 0,
            deposit_amount REAL DEFAULT 0,
            insurance_amount REAL DEFAULT 0,
            settings_locked INTEGER DEFAULT 0,
            invite_code TEXT UNIQUE,
            invited_by INTEGER,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 邀请码表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS invite_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            created_by INTEGER NOT NULL,
            used_by INTEGER,
            role TEXT NOT NULL,
            status TEXT DEFAULT 'unused',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME,
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (used_by) REFERENCES users(id)
          )
        `);

        // 成员表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            address TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            id_card_1 TEXT,
            id_card_1_register_date DATE,
            id_card_1_expire_date DATE,
            id_card_2 TEXT,
            id_card_2_register_date DATE,
            id_card_2_expire_date DATE,
            city TEXT,
            distributor_id INTEGER NOT NULL,
            documents TEXT, -- 存储证件图片路径的 JSON
            additional_info TEXT, -- 存储未来新增词条的 JSON
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (distributor_id) REFERENCES users(id)
          )
        `);

        // 人员海（人员池）
        this.db.run(`
          CREATE TABLE IF NOT EXISTS member_pool (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            address TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            id_card_1 TEXT,
            id_card_2 TEXT,
            city TEXT,
            distributor_id INTEGER NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (distributor_id) REFERENCES users(id)
          )
        `);

        // 劳动任务表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS labor_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_pool_id INTEGER NOT NULL,
            member_id INTEGER,
            contract_sign_date DATE NOT NULL,
            contract_years INTEGER NOT NULL,
            contract_expire_date DATE NOT NULL,
            monthly_amount REAL NOT NULL,
            contract_files TEXT, -- 存储合同图片路径的 JSON
            task_status TEXT DEFAULT 'active',
            exit_date DATE,
            exit_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_pool_id) REFERENCES member_pool(id),
            FOREIGN KEY (member_id) REFERENCES members(id)
          )
        `);

        // 月度账单确认表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS monthly_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            labor_task_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            distributor_id INTEGER NOT NULL,
            bill_month TEXT NOT NULL,
            monthly_amount REAL NOT NULL,
            deposit_confirmed INTEGER DEFAULT 0,
            confirmed_by INTEGER,
            confirmed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (labor_task_id) REFERENCES labor_tasks(id),
            FOREIGN KEY (member_id) REFERENCES members(id),
            FOREIGN KEY (distributor_id) REFERENCES users(id),
            FOREIGN KEY (confirmed_by) REFERENCES users(id)
          )
        `);

        // 账本记录表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS accounting_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            distributor_id INTEGER NOT NULL,
            received_amount REAL NOT NULL,
            deposit REAL NOT NULL,
            insurance REAL NOT NULL,
            commission REAL NOT NULL,
            commission_type TEXT DEFAULT 'rate',
            net_revenue REAL NOT NULL,
            record_date DATE NOT NULL,
            city TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(id),
            FOREIGN KEY (distributor_id) REFERENCES users(id)
          )
        `);

        // 月度统计提醒表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS monthly_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            distributor_id INTEGER NOT NULL,
            reminder_month TEXT NOT NULL,
            total_members INTEGER DEFAULT 0,
            confirmed_count INTEGER DEFAULT 0,
            pending_count INTEGER DEFAULT 0,
            total_amount REAL DEFAULT 0,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (distributor_id) REFERENCES users(id)
          )
        `);

        // 操作日志表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('数据表初始化完成');
            this.initDefaultData().then(resolve).catch(reject);
          }
        });
      });
    });
  }

  initDefaultData() {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');

      // 先执行数据库迁移，添加缺失的字段
      this.migrateDatabase().then(() => {
        // 检查是否已有管理员
        this.db.get('SELECT * FROM users WHERE role = ?', ['admin'], (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            // 创建默认管理员账户
            const hashedPassword = bcrypt.hashSync('admin', 10);
            const adminInviteCode = uuidv4().substring(0, 8).toUpperCase();

            this.db.run(`
              INSERT INTO users (username, password, name, role, invite_code, status)
              VALUES (?, ?, ?, ?, ?, ?)
            `, ['admin', hashedPassword, '系统管理员', 'admin', adminInviteCode, 'active'], (err) => {
              if (err) {
                reject(err);
              } else {
                console.log('默认管理员账户创建成功');
                console.log('管理员账号: admin');
                console.log('管理员密码: admin');
                console.log('管理员邀请码:', adminInviteCode);
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      }).catch(reject);
    });
  }

  // 数据库迁移：添加缺失的字段
  migrateDatabase() {
    return new Promise((resolve, reject) => {
      console.log('开始数据库迁移...');
      
      // 检查并添加 users 表的新字段
      this.db.get("PRAGMA table_info(users)", (err, info) => {
        if (err) {
          console.log('检查表结构失败:', err);
        }
        
        // 添加 commission_amount 字段
        this.db.run('ALTER TABLE users ADD COLUMN commission_amount REAL DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加commission_amount字段失败:', err.message);
          } else {
            console.log('✓ users.commission_amount 字段已就绪');
          }
        });

        // 添加 deposit_amount 字段
        this.db.run('ALTER TABLE users ADD COLUMN deposit_amount REAL DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加deposit_amount字段失败:', err.message);
          } else {
            console.log('✓ users.deposit_amount 字段已就绪');
          }
        });

        // 添加 insurance_amount 字段
        this.db.run('ALTER TABLE users ADD COLUMN insurance_amount REAL DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加insurance_amount字段失败:', err.message);
          } else {
            console.log('✓ users.insurance_amount 字段已就绪');
          }
        });

        // 添加 settings_locked 字段
        this.db.run('ALTER TABLE users ADD COLUMN settings_locked INTEGER DEFAULT 0', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加settings_locked字段失败:', err.message);
          } else {
            console.log('✓ users.settings_locked 字段已就绪');
          }
        });

        // 检查并添加 members 表的新字段
        // 添加 documents 字段
        this.db.run('ALTER TABLE members ADD COLUMN documents TEXT DEFAULT "{}"', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加documents字段失败:', err.message);
          } else {
            console.log('✓ members.documents 字段已就绪');
          }
        });

        // 添加 additional_info 字段
        this.db.run('ALTER TABLE members ADD COLUMN additional_info TEXT DEFAULT "{}"', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加additional_info字段失败:', err.message);
          } else {
            console.log('✓ members.additional_info 字段已就绪');
          }
        });

        // 添加 contract_files 字段
        this.db.run('ALTER TABLE members ADD COLUMN contract_files TEXT DEFAULT "{}"', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('添加contract_files字段失败:', err.message);
          } else {
            console.log('✓ members.contract_files 字段已就绪');
          }
          
          // 所有迁移完成
          console.log('数据库迁移完成！');
          resolve();
        });
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
