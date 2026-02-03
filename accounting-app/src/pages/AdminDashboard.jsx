import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MemberManagement from './MemberManagement'
import AccountingBook from './AccountingBook'
import DistributorManagement from './DistributorManagement'

function AdminDashboard({ user, onLogout }) {
  const location = useLocation()
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalRevenue: 0,
    totalCommission: 0,
    expectedRevenue: 0
  })

  // 模拟数据加载
  useEffect(() => {
    // 这里之后会从后端API获取数据
    setStats({
      totalMembers: 156,
      totalRevenue: 1250000,
      totalCommission: 87500,
      expectedRevenue: 1162500
    })
  }, [])

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>收支记账系统</h1>
        <nav>
          <Link 
            to="/admin/overview" 
            className={location.pathname === '/admin/overview' ? 'active' : ''}
          >
            📊 数据总览
          </Link>
          <Link 
            to="/admin/members" 
            className={location.pathname === '/admin/members' ? 'active' : ''}
          >
            👥 成员管理
          </Link>
          <Link 
            to="/admin/accounting" 
            className={location.pathname === '/admin/accounting' ? 'active' : ''}
          >
            📖 账本管理
          </Link>
          <Link 
            to="/admin/distributors" 
            className={location.pathname === '/admin/distributors' ? 'active' : ''}
          >
            🏢 分销管理
          </Link>
        </nav>
        <div className="user-info">
          <p><strong>{user.name}</strong></p>
          <p>角色：{user.role === 'admin' ? '总管理员' : '分销商'}</p>
          <button className="logout-btn" onClick={onLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AdminOverview stats={stats} />} />
          <Route path="/overview" element={<AdminOverview stats={stats} />} />
          <Route path="/members" element={<MemberManagement user={user} />} />
          <Route path="/accounting" element={<AccountingBook user={user} />} />
          <Route path="/distributors" element={<DistributorManagement user={user} />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminOverview({ stats }) {
  return (
    <>
      <div className="page-header">
        <h2>数据总览</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>总成员数</h3>
          <div className="value">{stats.totalMembers}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>总到账金额</h3>
          <div className="value">¥{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>总佣金支出</h3>
          <div className="value">¥{stats.totalCommission.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
          <h3>应收账款</h3>
          <div className="value">¥{stats.expectedRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">最近动态</h3>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作类型</th>
              <th>操作人</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-02-03 14:30</td>
              <td>新增成员</td>
              <td>A层分销-张三</td>
              <td>新增成员：李四</td>
            </tr>
            <tr>
              <td>2026-02-03 13:15</td>
              <td>账本记录</td>
              <td>B层分销-王五</td>
              <td>成员赵六到账¥8000</td>
            </tr>
            <tr>
              <td>2026-02-03 11:00</td>
              <td>佣金结算</td>
              <td>系统自动</td>
              <td>A层分销佣金结算¥5600</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminDashboard
