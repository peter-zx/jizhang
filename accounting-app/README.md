# 本地离线收支记账管理系统

## 项目概述

这是一个基于React + Node.js + SQLite的本地离线应用，支持四层权限体系（总管理员-A层分销-B层分销-成员层），实现收支记账、团队信息统计和数据导出功能。

## 功能特性

### 1. 用户权限体系
- **总管理员**: 最高权限，查看所有数据，管理分销商和成员
- **A层分销/B层分销**: 管理自己的成员，录入账本数据
- **邀请码注册**: 需管理员邀请码才能注册

### 2. 成员管理
- ✅ 完整个人信息（姓名、年龄、性别、电话、住址、紧急联系人）
- ✅ 双证件管理（证件一、证件二，包含注册和到期时间）
- ✅ 证件到期预警（30天内黄色提示，已过期红色提示）
- ✅ 成员画像详情页

### 3. 合同与任务管理
- ✅ 合同签约时间、年限、到期时间
- ✅ 人员海（人员池）管理
- ✅ 劳动任务管理
- ✅ 支持手动退出劳动任务
- ✅ 退出后可新建任务，保留历史记录

### 4. 账本管理
- ✅ 收支记录（到账、保障金、保险金额）
- ✅ 自动计算佣金和净收入
- ✅ 佣金支持比例/固定金额切换
- ✅ 数据统计汇总

### 5. 月度账单与收租
- ✅ 分销层为数据源，总管理员汇总查看
- ✅ 月度账单确认功能（确认发放保障金）
- ✅ 自动提醒统计数据
- ✅ 收租情况统计（按月度、完成率等）

### 6. 数据导出
- ✅ Excel格式导出成员列表
- ✅ Excel格式导出账本记录
- ✅ 完整报表导出（仅管理员）

### 7. 邀请码管理
- ✅ 管理员可生成A层/B层分销邀请码
- ✅ 统计邀请码使用情况
- ✅ 关联注册人数和分销层信息

### 8. 权限增强
- ✅ 管理员拥有分销层全部功能
- ✅ 可新增人员、录入账本、确认账单等
- ✅ 每月记账提醒功能

## 技术栈

### 前端
- **框架**: React 19 + Vite
- **路由**: React Router
- **HTTP客户端**: Axios
- **状态管理**: Zustand
- **样式**: CSS Modules

### 后端
- **运行时**: Node.js
- **框架**: Express
- **数据库**: SQLite3
- **认证**: JWT
- **密码加密**: bcryptjs
- **Excel导出**: xlsx

### 项目结构
```
accounting-app/
├── server/                 # 后端代码
│   ├── config/            # 配置文件
│   │   ├── database.js    # 数据库配置
│   │   └── config.js      # 服务器配置
│   ├── controllers/       # 控制器
│   │   ├── authController.js
│   │   ├── memberController.js
│   │   ├── accountingController.js
│   │   ├── userController.js
│   │   ├── exportController.js
│   │   ├── laborController.js
│   │   └── billingController.js
│   ├── middleware/        # 中间件
│   │   └── auth.js        # 认证中间件
│   ├── routes/            # 路由
│   │   ├── authRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── accountingRoutes.js
│   │   ├── userRoutes.js
│   │   ├── exportRoutes.js
│   │   ├── laborRoutes.js
│   │   └── billingRoutes.js
│   └── server.js          # 服务器入口
├── src/                   # 前端代码
│   ├── api/               # API接口
│   │   ├── client.js      # Axios配置
│   │   └── index.js       # API模块
│   ├── pages/             # 页面组件
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── DistributorDashboard.jsx
│   │   ├── MemberManagement.jsx
│   │   ├── MemberProfile.jsx
│   │   ├── AccountingBook.jsx
│   │   ├── MonthlyBilling.jsx
│   │   ├── RentCollection.jsx
│   │   ├── InviteCodeManagement.jsx
│   │   └── AdminDistributorFeatures.jsx
│   ├── styles/            # 样式文件
│   │   └── App.css
│   ├── App.jsx            # 应用入口
│   └── main.jsx           # React入口
├── data/                  # 数据库文件目录
│   └── accounting.db      # SQLite数据库
└── package.json
```

## 快速开始

### 开发模式运行

1. **启动后端服务器**
```bash
cd accounting-app
npm run server
```
后端运行在 http://localhost:5000

2. **启动前端开发服务器** (新终端)
```bash
npm run dev
```
前端运行在 http://localhost:3000

### 默认管理员账号
- 用户名: `admin`
- 密码: `admin`
- 邀请码: 启动后端服务器时会在控制台显示

### 注册新用户
1. 点击登录页的"立即注册"
2. 输入个人信息和管理员提供的邀请码
3. 注册成功后即可登录

## API接口文档

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/invite-codes` - 生成邀请码（管理员）
- `GET /api/auth/invite-codes` - 获取邀请码列表（管理员）

### 成员管理
- `GET /api/members` - 获取成员列表
- `GET /api/members/:id` - 获取成员详情
- `POST /api/members` - 创建成员
- `PUT /api/members/:id` - 更新成员
- `DELETE /api/members/:id` - 删除成员
- `GET /api/members/expiring` - 获取证件即将过期的成员

### 账本管理
- `GET /api/accounting` - 获取账本记录
- `GET /api/accounting/statistics` - 获取统计数据
- `POST /api/accounting` - 创建账本记录
- `PUT /api/accounting/:id` - 更新账本记录
- `DELETE /api/accounting/:id` - 删除账本记录

### 人员池与任务管理
- `GET /api/labor/pool` - 获取人员池
- `POST /api/labor/pool` - 添加到人员池
- `GET /api/labor/tasks` - 获取劳动任务
- `POST /api/labor/tasks` - 创建劳动任务
- `POST /api/labor/tasks/:id/exit` - 退出劳动任务

### 月度账单
- `GET /api/billing/bills` - 获取月度账单
- `POST /api/billing/bills/:id/confirm` - 确认账单
- `GET /api/billing/stats/current` - 获取当月统计
- `GET /api/billing/rent-collection` - 获取收租情况
- `GET /api/billing/reminders` - 获取提醒列表
- `POST /api/billing/reminders/generate` - 生成月度提醒（管理员）

### 用户管理
- `GET /api/users/distributors` - 获取分销商列表（管理员）
- `GET /api/users/distributors/:id` - 获取分销商详情（管理员）
- `PUT /api/users/distributors/:id` - 更新分销商信息（管理员）
- `GET /api/users/logs` - 获取操作日志

### 数据导出
- `GET /api/export/members` - 导出成员列表（Excel）
- `GET /api/export/records` - 导出账本记录（Excel）
- `GET /api/export/full-report` - 导出完整报表（Excel，管理员）

## 数据流说明

### 分销层为数据源
- **分销商**负责新增、编辑、删除成员
- **分销商**负责录入成员的账本数据
- **总管理员**可查看所有分销商的数据汇总
- **总管理员**拥有最高权限，可编辑所有数据

### 佣金计算
- A层分销默认佣金比例: 6%
- B层分销默认佣金比例: 8%
- 支持固定金额输入
- 净收入 = 到账 - 保障金 - 保险金额 - 佣金
- 应收账 = (到账 - 保障金 - 保险金额 - 佣金) × 人员数

## 开发历程总结

### 初始需求
- 收支记账功能
- 四层权限体系（总管理员-A层分销-B层分销-成员层）
- 证件管理（注册时间、到期时间）
- 保障金、保险金额等财务字段

### 第一轮迭代
- 实现基本的前后端分离架构
- 用户登录/注册功能
- 成员管理功能
- 账本管理功能
- 响应式界面设计

### 第二轮迭代
- 数据流调整：分销层为数据源，总管理员汇总查看
- 完善成员信息字段（个人信息、紧急联系人等）
- 成员画像详情页
- 数据导出Excel功能
- 邀请码注册机制

### 第三轮迭代
- 合同管理功能（签约时间、年限、到期时间）
- 月度账单确认功能
- 收租情况统计
- 人员海和任务管理
- 自动提醒功能

### 第四轮迭代
- 邀请码管理功能
- 佣金金额/比例切换
- 管理员拥有分销层全部功能
- 数据库结构优化

## 注意事项

1. **数据安全**: 数据库存储在 `data/accounting.db`，请定期备份
2. **邀请码管理**: 邀请码一次性使用，用完需重新生成
3. **证件到期**: 系统会自动标记30天内到期和已过期的证件
4. **权限控制**: 分销商只能操作自己名下的成员和数据
5. **数据完整性**: 删除成员前需确保没有关联的账本记录

## 打包部署

### 构建前端
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 开发者信息

- 开发时间: 2026-02-03
- 版本: 1.0.0
- 许可证: ISC
