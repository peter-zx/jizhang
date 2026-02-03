import { useState } from 'react';
import { authAPI } from '../api';

function Register({ onSwitch }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: '',
    inviteCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        inviteCode: formData.inviteCode
      });
      alert('注册成功！请登录');
      onSwitch();
    } catch (err) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '500px' }}>
        <h2>注册新账户</h2>
        {error && (
          <div style={{ 
            padding: '10px', 
            background: '#fee', 
            color: '#c33', 
            borderRadius: '5px', 
            marginBottom: '15px' 
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>用户名 *</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div className="form-group">
              <label>姓名 *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入真实姓名"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>密码 *</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="至少6位"
                required
              />
            </div>
            <div className="form-group">
              <label>确认密码 *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次输入密码"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>手机号</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                placeholder="请输入手机号"
              />
            </div>
            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入邮箱"
              />
            </div>
          </div>

          <div className="form-group">
            <label>邀请码 *</label>
            <input
              type="text"
              name="inviteCode"
              className="form-control"
              value={formData.inviteCode}
              onChange={handleChange}
              placeholder="请输入管理员提供的邀请码"
              required
            />
          </div>

          <div style={{ 
            background: '#e8f4f8', 
            padding: '12px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            fontSize: '13px',
            color: '#2c3e50'
          }}>
            <strong>注意：</strong>
            <p style={{ margin: '5px 0 0 0' }}>
              • 注册需要管理员提供的邀请码<br/>
              • 邀请码决定您的分销层级和佣金比例<br/>
              • 请妥善保管您的账号密码
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <span style={{ color: '#7f8c8d' }}>已有账号？</span>
            <button 
              type="button"
              onClick={onSwitch}
              style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                cursor: 'pointer',
                marginLeft: '5px',
                textDecoration: 'underline'
              }}
            >
              立即登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
