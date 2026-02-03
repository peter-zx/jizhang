module.exports = {
  jwtSecret: 'your-secret-key-change-in-production-' + Date.now(),
  jwtExpire: '7d',
  serverPort: 5000,
  corsOrigin: 'http://localhost:3000'
};
