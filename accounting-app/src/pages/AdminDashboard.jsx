import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { billingAPI } from '../api'
import MemberManagement from './MemberManagement'
import AccountingBook from './AccountingBook'
import DistributorManagement from './DistributorManagement'
import MonthlyBilling from './MonthlyBilling'
import RentCollection from './RentCollection'
import InviteCodeManagement from './InviteCodeManagement'
import AdminDistributorFeatures from './AdminDistributorFeatures'
import ContractManagement from './ContractManagement'
import AmountManagement from './AmountManagement'

function AdminDashboard({ user, onLogout }) {
  const location = useLocation()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await billingAPI.getAdminSummary()
      if (response.success) {
        setSummary(response.data)
      } else {
        setError(response.message || '获取汇总数据失败')
      }
    } catch (error) {
      console.error('加载汇总数据失败:', error)
      setError('服务器连接失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>收支记账系统</h1>
        <nav>
          <Link 
            to="/admin/overview" 
            className={location.pathname === '/admin/overview' || location.pathname === '/admin' ? 'active' : ''}
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
            to="/admin/contracts" 
            className={location.pathname === '/admin/contracts' ? 'active' : ''}
          >
            📋 合同管理
          </Link>
          <Link 
            to="/admin/amounts" 
            className={location.pathname === '/admin/amounts' ? 'active' : ''}
          >
            💵 金额管理
          </Link>
          <Link 
            to="/admin/billing" 
            className={location.pathname === '/admin/billing' ? 'active' : ''}
          >
            💳 月度账单
          </Link>
          <Link 
            to="/admin/rent" 
            className={location.pathname === '/admin/rent' ? 'active' : ''}
          >
            💰 收租情况
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
          <Link 
            to="/admin/invites" 
            className={location.pathname === '/admin/invites' ? 'active' : ''}
          >
            🎫 邀请码管理
          </Link>
          <Link 
            to="/admin/my-members" 
            className={location.pathname.startsWith('/admin/my-members') ? 'active' : ''}
          >
            👤 我的成员
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
          <Route path="/" element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview summary={summary} loading={loading} error={error} onRefresh={loadSummary} />} />
          <Route path="members" element={<MemberManagement user={user} />} />
          <Route path="accounting" element={<AccountingBook user={user} />} />
          <Route path="distributors" element={<DistributorManagement user={user} />} />
          <Route path="billing" element={<MonthlyBilling user={user} />} />
          <Route path="rent" element={<RentCollection user={user} />} />
          <Route path="invites" element={<InviteCodeManagement user={user} />} />
          <Route path="contracts" element={<ContractManagement user={user} />} />
          <Route path="amounts" element={<AmountManagement user={user} />} />
          <Route path="my-members/*" element={<AdminDistributorFeatures user={user} />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminOverview({ summary, loading, error, onRefresh }) {
  if (loading) return <div style={{ padding: '30px', textAlign: 'center' }}><h3>加载中...</h3></div>
  
  if (error) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <h3 style={{ color: '#e74c3c' }}>错误: {error}</h3>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={onRefresh}>
          重试
        </button>
      </div>
    )
  }

  if (!summary) return <div style={{ padding: '30px', textAlign: 'center' }}><h3>暂无汇总数据</h3></div>

  const { overall, expected, distributors, currentMonth } = summary

  return (
    <>
      <div className="page-header">
        <h2>数据总览 ({currentMonth})</h2>
        <button className="btn btn-primary btn-sm" onClick={onRefresh}>刷新</button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>本月总任务金 (预计)</h3>
          <div className="value">¥{(expected?.expected_amount || 0).toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d' }}>涉及成员: {expected?.total_tasks || 0}人</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>实际到账 (总任务金)</h3>
          <div className="value">¥{(overall?.total_received || 0).toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d' }}>
            完成率: {expected?.expected_amount ? ((overall.total_received / expected.expected_amount) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>保障金/保险</h3>
          <div className="value">¥{((overall?.total_deposit || 0) + (overall?.total_insurance || 0)).toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d' }}>保障金: ¥{(overall?.total_deposit || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
          <h3>分销佣金支出</h3>
          <div className="value">¥{(overall?.total_commission || 0).toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d' }}>总佣金: ¥{(overall?.total_commission || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
          <h3>总净收入</h3>
          <div className="value">¥{(overall?.total_net_revenue || 0).toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d' }}>最终结算: ¥{(overall?.total_net_revenue || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">分销商（小队长）任务情况</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>层级</th>
                <th>管理人员</th>
                <th>预计营收</th>
                <th>实际到账</th>
                <th>完成率</th>
                <th>应付佣金</th>
              </tr>
            </thead>
            <tbody>
              {distributors && distributors.length > 0 ? distributors.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.role === 'distributor_a' ? 'A层' : 'B层'}</td>
                  <td>{d.active_members}人</td>
                  <td>¥{(d.expected_revenue || 0).toLocaleString()}</td>
                  <td>¥{(d.actual_received || 0).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '8px', 
                        background: '#eee', 
                        borderRadius: '4px',
                        marginRight: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${Math.min(100, (d.actual_received / (d.expected_revenue || 1)) * 100)}%`,
                          height: '100%',
                          background: '#27ae60'
                        }}></div>
                      </div>
                      {d.expected_revenue ? ((d.actual_received / d.expected_revenue) * 100).toFixed(0) : 0}%
                    </div>
                  </td>
                  <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>¥{(d.total_commission || 0).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>暂无分销商数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
