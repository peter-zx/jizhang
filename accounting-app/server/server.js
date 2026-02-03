const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const db = require('./config/database');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const userRoutes = require('./routes/userRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

// 中间件
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../dist')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// SPA路由处理 - 开发阶段暂时注释，生产环境再启用
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await db.connect();
    console.log('数据库初始化完成');

    // 启动服务器
    app.listen(config.serverPort, () => {
      console.log(`\n========================================`);
      console.log(`🚀 服务器运行在 http://localhost:${config.serverPort}`);
      console.log(`📊 API 地址: http://localhost:${config.serverPort}/api`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await db.close();
  process.exit(0);
});

startServer();

module.exports = app;
