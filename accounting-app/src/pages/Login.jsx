import { useState } from 'react'
import { authAPI } from '../api'

function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login({ username, password })
      if (response.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        onLogin(response.data.user)
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>收支记账管理系统</h2>
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
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span style={{ color: '#7f8c8d' }}>还没有账号？</span>
          <button 
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              marginLeft: '5px',
              textDecoration: 'underline'
            }}
          >
            立即注册
          </button>
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#7f8c8d' }}>
          <p>默认管理员账号：</p>
          <p>admin / admin</p>
        </div>
      </div>
    </div>
  )
}

export default Login
