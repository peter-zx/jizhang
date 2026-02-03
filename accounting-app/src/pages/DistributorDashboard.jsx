import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MemberManagement from './MemberManagement'
import AccountingBook from './AccountingBook'

function DistributorDashboard({ user, onLogout }) {
  const location = useLocation()
  const [stats, setStats] = useState({
    myMembers: 0,
    myRevenue: 0,
    myCommission: 0
  })

  useEffect(() => {
    // 模拟数据加载
    setStats({
      myMembers: 45,
      myRevenue: 450000,
      myCommission: 27000
    })
  }, [])

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>收支记账系统</h1>
        <nav>
          <Link 
            to="/distributor/overview" 
            className={location.pathname === '/distributor/overview' ? 'active' : ''}
          >
            📊 我的数据
          </Link>
          <Link 
            to="/distributor/members" 
            className={location.pathname === '/distributor/members' ? 'active' : ''}
          >
            👥 成员管理
          </Link>
          <Link 
            to="/distributor/accounting" 
            className={location.pathname === '/distributor/accounting' ? 'active' : ''}
          >
            📖 账本管理
          </Link>
        </nav>
        <div className="user-info">
          <p><strong>{user.name}</strong></p>
          <p>角色：{user.role === 'distributor_a' ? 'A层分销' : 'B层分销'}</p>
          <button className="logout-btn" onClick={onLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DistributorOverview stats={stats} user={user} />} />
          <Route path="/overview" element={<DistributorOverview stats={stats} user={user} />} />
          <Route path="/members" element={<MemberManagement user={user} />} />
          <Route path="/accounting" element={<AccountingBook user={user} />} />
        </Routes>
      </main>
    </div>
  )
}

function DistributorOverview({ stats, user }) {
  return (
    <>
      <div className="page-header">
        <h2>我的数据</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>我的成员数</h3>
          <div className="value">{stats.myMembers}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>总营收</h3>
          <div className="value">¥{stats.myRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>我的佣金</h3>
          <div className="value">¥{stats.myCommission.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#9b59b6' }}>
          <h3>佣金比例</h3>
          <div className="value">{user.role === 'distributor_a' ? '6' : '8'}%</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">本月业绩排行</h3>
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>成员姓名</th>
              <th>到账金额</th>
              <th>城市</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🥇 1</td>
              <td>张三</td>
              <td style={{ color: '#27ae60', fontWeight: 'bold' }}>¥15,000</td>
              <td>北京</td>
            </tr>
            <tr>
              <td>🥈 2</td>
              <td>李四</td>
              <td style={{ color: '#27ae60', fontWeight: 'bold' }}>¥12,500</td>
              <td>上海</td>
            </tr>
            <tr>
              <td>🥉 3</td>
              <td>王五</td>
              <td style={{ color: '#27ae60', fontWeight: 'bold' }}>¥11,200</td>
              <td>广州</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="card-title">最近操作记录</h3>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作类型</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-02-03 14:30</td>
              <td>新增成员</td>
              <td>新增成员：李四</td>
            </tr>
            <tr>
              <td>2026-02-03 13:15</td>
              <td>账本记录</td>
              <td>成员赵六到账¥8000</td>
            </tr>
            <tr>
              <td>2026-02-03 11:00</td>
              <td>编辑成员</td>
              <td>更新成员：张三的证件信息</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default DistributorDashboard
