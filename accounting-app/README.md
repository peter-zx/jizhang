# 会计应用系统 (Accounting Application)

一个基于 React + Node.js 的分销商管理系统，用于管理分销商、成员、劳动任务和财务结算。

## 📋 项目简介

该系统支持多层级分销商管理，包括成员信息管理、金额设置、月度账单确认、账本记录等核心功能。采用前后端分离架构，提供完整的用户权限管理和数据统计功能。

## 🚀 技术栈

### 前端
- **React 18** - UI框架
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Axios** - HTTP客户端

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **SQLite** - 数据库
- **bcryptjs** - 密码加密
- **jsonwebtoken** - 身份认证

## 📦 安装和启动

### 环境要求
- Node.js 14+
- npm 6+

### 安装依赖
```bash
cd accounting-app
npm install
```

### 启动项目

**开发环境 - 需要两个终端**

终端1 - 启动后端服务（端口5000）:
```bash
npm run server
```

终端2 - 启动前端开发服务器（端口3000）:
```bash
npm run dev
```

### 访问系统
- 前端地址: http://localhost:3000
- 后端API: http://localhost:5000/api

### 默认账号
```
管理员账号: admin
密码: admin
邀请码: (启动后端后控制台会显示)
```

## 🏗️ 项目结构

```
accounting-app/
├── server/                 # 后端代码
│   ├── config/            # 配置文件
│   │   ├── config.js      # 全局配置
│   │   └── database.js    # 数据库配置和迁移
│   ├── controllers/       # 业务逻辑控制器
│   │   ├── accountingController.js    # 账本管理
│   │   ├── authController.js          # 认证和用户管理
│   │   ├── billingController.js       # 月度账单
│   │   ├── memberController.js        # 成员管理
│   │   └── ...
│   ├── routes/            # 路由定义
│   ├── middleware/        # 中间件（认证等）
│   └── server.js          # 服务入口
│
├── src/                   # 前端代码
│   ├── pages/             # 页面组件
│   │   ├── DistributorOverview.jsx   # 我的数据
│   │   ├── MemberManagement.jsx      # 成员管理
│   │   ├── AmountManagement.jsx      # 金额管理
│   │   ├── MonthlyBilling.jsx        # 月度账单确认
│   │   ├── AccountingBook.jsx        # 账本管理
│   │   └── ...
│   ├── api/               # API调用封装
│   ├── components/        # 公共组件
│   ├── styles/            # 样式文件
│   ├── App.jsx            # 主应用
│   └── main.jsx           # 入口文件
│
├── data/                  # 数据库文件
│   └── accounting.db      # SQLite数据库
│
└── 项目交接文档.md         # 详细技术文档
```

## 🎯 核心功能

### 1. 用户权限管理
- **管理员 (admin)**: 最高权限，管理所有分销商和成员
- **A层分销商 (distributor_a)**: 佣金比例 6%
- **B层分销商 (distributor_b)**: 佣金比例 8%

### 2. 成员管理
- 新增/编辑/删除成员（删除需密码验证）
- 成员状态管理（在职/离职）
- 成员信息详情查看
- 成员数据导入导出

### 3. 金额管理
- 批量设置成员月度金额
- 支持0值输入
- 实时显示当前已设置金额

### 4. 金额参数设置
- 每个分销商可设置：
  - **佣金金额**: 每个成员的佣金
  - **保障金金额**: 保障金额度
  - **保险金额**: 保险费用
- 设置后可随时修改

### 5. 月度账单确认
- 查看当月所有账单
- 批量确认功能
- 单个确认（无弹窗）
- 账单统计数据展示

### 6. 账本管理
- 收支记录管理
- 数据统计和汇总
- 管理员可清空所有记录

### 7. 数据统计
- **我的数据**页面显示：
  - 我的成员数
  - 本月交付金额 = 月度金额 - 保障金 - 佣金
  - 我的佣金
- **月度账单**页面显示：
  - 账单总数
  - 已确认/待确认数量
  - 本月交付金额

## 💡 核心业务逻辑

### 数据流转链路
```
成员 (members)
  ↓ 设置金额
劳动任务 (labor_tasks) - 存储月度金额
  ↓ 自动生成
月度账单 (monthly_bills)
  ↓ 确认后
账本记录 (accounting_records)
```

### 本月交付金额计算
```javascript
本月交付金额 = 所有在职成员月度金额总和 - 保障金总额 - 佣金总额

其中:
- 保障金总额 = 保障金单价 × 在职成员数
- 佣金总额 = 佣金单价 × 在职成员数
```

## 🗄️ 数据库表结构

### 核心表
- **users**: 用户/分销商信息
- **members**: 成员信息
- **labor_tasks**: 劳动任务（存储月度金额）⭐
- **monthly_bills**: 月度账单 ⭐
- **accounting_records**: 账本记录

详细表结构请参考 [项目交接文档.md](./项目交接文档.md)

## ⚙️ 配置说明

### 端口配置
- 前端默认端口: 3000
- 后端默认端口: 5000
- 可在 `server/config/config.js` 和 `vite.config.js` 修改

### 数据库配置
- 数据库文件: `data/accounting.db`
- 自动创建表和初始化数据
- 支持自动迁移机制

## 🔧 开发指南

### 后端开发
1. 修改 controllers 中的业务逻辑
2. 在 routes 中定义路由
3. **重要**: 修改后端代码后必须重启服务

### 前端开发
1. 在 pages 中创建页面组件
2. 在 api/index.js 中定义API调用
3. Vite 支持热更新，无需重启

### 数据库迁移
在 `server/config/database.js` 的 `migrateDatabase()` 函数中添加迁移逻辑：
```javascript
await addColumn('ALTER TABLE table_name ADD COLUMN new_column TYPE DEFAULT value')
```

## 📝 常见问题

### Q: 修改后端代码后不生效？
A: 必须重启后端服务（Ctrl+C 然后重新运行 `npm run server`）

### Q: 数据显示为空？
A: 检查：
1. labor_tasks 表是否有对应成员记录
2. monthly_bills 表是否有当月数据
3. 成员状态是否为"在职"(active)

### Q: 金额设置保存失败？
A: 查看后端控制台日志，检查是否有错误信息

### Q: 如何清空测试数据？
A: 管理员登录后，在"账本管理"页面点击"清空所有记录"按钮

## 🚨 重要注意事项

1. **数据一致性**: 设置金额时必须同时更新 `labor_tasks` 和 `monthly_bills` 两张表
2. **密码安全**: 删除成员需要输入当前用户密码验证
3. **权限检查**: 分销商只能管理自己的成员
4. **金额输入**: 允许输入0值，支持小数

## 📄 更新日志

### v1.2.0 (2026-02-03)
- ✨ 新增本月交付金额计算和显示
- ✨ 月度账单批量确认功能
- 🐛 修复金额设置保存后数据消失问题
- 🐛 修复数据同步核心问题
- ♻️ 移除金额设置锁定机制
- 📝 添加详细的调试日志

### v1.1.0
- ✨ 成员删除密码验证
- ✨ 金额管理支持0值输入
- ✨ 账本管理清空功能
- 🐛 修复SQLite NOT NULL约束错误

### v1.0.0
- 🎉 初始版本发布
- ✨ 基础功能实现

## 📖 文档

- [项目交接文档.md](./项目交接文档.md) - 详细的技术实现文档
- [使用说明.md](./使用说明.md) - 用户操作手册

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License

## 👥 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

**开发建议**: 
- 优先保证数据正确性
- 分步骤解决问题
- 修改后端代码后记得重启服务
- 查看控制台日志进行调试
