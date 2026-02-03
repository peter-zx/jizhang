import { useState, useEffect } from 'react'
import { authAPI, memberAPI } from '../api'

function DistributorOverview({ user }) {
  const [showSettings, setShowSettings] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [stats, setStats] = useState({
    myMembers: 0,
    totalMonths: 0,
    totalRevenue: 0,
    myCommission: 0
  })
  const [settings, setSettings] = useState({
    commissionAmount: 0,
    depositAmount: 0,
    insuranceAmount: 0
  })

  useEffect(() => {
    loadUserInfo()
  }, [])

  useEffect(() => {
    if (userInfo) {
      loadStats()
    }
  }, [userInfo])

  const loadUserInfo = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.success) {
        const info = response.data.user
        setUserInfo(info)
        setSettings({
          commissionAmount: info.commission_amount || 0,
          depositAmount: info.deposit_amount || 0,
          insuranceAmount: info.insurance_amount || 0
        })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const loadStats = async () => {
    try {
      // 加载成员数和金额信息
      const membersResponse = await memberAPI.getMembers({ status: 'active' })
      if (membersResponse.success) {
        const members = membersResponse.data.members
        const memberCount = members.length
        
        // 获取当前用户的金额设置
        const commissionPerPerson = userInfo?.commission_amount || 0
        const depositPerPerson = userInfo?.deposit_amount || 0
        
        // 计算我的佣金
        const calculatedCommission = commissionPerPerson * memberCount
        
        // 计算本月交付金额 = 当月在职人员月度金额 - 保障金 - 佣金金额
        let totalMonthlyAmount = 0
        members.forEach(member => {
          totalMonthlyAmount += (member.current_monthly_amount || 0)
        })
        
        const totalDeposit = depositPerPerson * memberCount
        const totalCommission = calculatedCommission
        const deliveryAmount = totalMonthlyAmount - totalDeposit - totalCommission
        
        setStats({
          myMembers: memberCount,
          totalMonths: memberCount,
          totalRevenue: deliveryAmount, // 本月交付金额
          myCommission: calculatedCommission
        })
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      const response = await authAPI.updateSettings(settings)
      if (response.success) {
        alert('设置保存成功')
        setShowSettings(false)
        // 重新加载用户信息和统计数据
        await loadUserInfo()
        await loadStats()
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message
      alert('保存失败: ' + message)
    }
  }

  // 计算佣金
  const calculatedCommission = (settings.commissionAmount || 0) * stats.myMembers
  // 计算总营收
  const calculatedRevenue = (settings.commissionAmount || 0) * stats.totalMonths

  return (
    <>
      <div className="page-header">
        <h2>我的数据</h2>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => setShowSettings(true)}
        >
          ⚙️ 金额设置
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>我的成员数</h3>
          <div className="value">{stats.myMembers}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>在职成员总数</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>本月交付金额</h3>
          <div className="value">¥{stats.totalRevenue.toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
            月度金额 - 保障金 - 佣金
          </p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>我的佣金</h3>
          <div className="value">¥{calculatedCommission.toLocaleString()}</div>
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
            ¥{settings.commissionAmount} × {stats.myMembers}人
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">金额配置</h3>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ color: '#7f8c8d', marginBottom: '5px' }}>佣金金额</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>¥{settings.commissionAmount}</p>
            </div>
            <div>
              <p style={{ color: '#7f8c8d', marginBottom: '5px' }}>保障金</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>¥{settings.depositAmount}</p>
            </div>
            <div>
              <p style={{ color: '#7f8c8d', marginBottom: '5px' }}>保险金</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>¥{settings.insuranceAmount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">最近操作记录</h3>
        <p style={{ padding: '20px', color: '#7f8c8d', textAlign: 'center' }}>
          暂无操作记录
        </p>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>金额设置</h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>佣金金额 (元/人) *</label>
                <input 
                  type="number"
                  className="form-control"
                  value={settings.commissionAmount}
                  onChange={(e) => setSettings({ ...settings, commissionAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  required
                  placeholder="每个成员的佣金金额"
                  style={{ 
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'textfield'
                  }}
                />
              </div>
              <div className="form-group">
                <label>保障金金额 (元) *</label>
                <input 
                  type="number"
                  className="form-control"
                  value={settings.depositAmount}
                  onChange={(e) => setSettings({ ...settings, depositAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  required
                  placeholder="保障金金额"
                  style={{ 
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'textfield'
                  }}
                />
              </div>
              <div className="form-group">
                <label>保险金额 (元) *</label>
                <input 
                  type="number"
                  className="form-control"
                  value={settings.insuranceAmount}
                  onChange={(e) => setSettings({ ...settings, insuranceAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  required
                  placeholder="保险金额"
                  style={{ 
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'textfield'
                  }}
                />
              </div>
              <div style={{ 
                background: '#e8f5e9', 
                padding: '15px', 
                borderRadius: '5px',
                marginBottom: '20px',
                border: '1px solid #4caf50'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32' }}>
                  💡 提示：您可以随时修改金额设置
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowSettings(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存设置</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default DistributorOverview
