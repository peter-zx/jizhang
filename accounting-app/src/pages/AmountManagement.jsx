import { useState, useEffect } from 'react'
import { memberAPI } from '../api'

function AmountManagement({ user }) {
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [monthlyAmount, setMonthlyAmount] = useState(5000)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const response = await memberAPI.getMembers({ status: 'active' })
      if (response.success) {
        setMembers(response.data.members)
      }
    } catch (error) {
      console.error('加载成员失败:', error)
      alert('加载成员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (e) => {
    const filtered = getFilteredMembers()
    if (e.target.checked) {
      setSelectedMembers([...new Set([...selectedMembers, ...filtered.map(m => m.id)])])
    } else {
      const filteredIds = filtered.map(m => m.id)
      setSelectedMembers(selectedMembers.filter(id => !filteredIds.includes(id)))
    }
  }

  const handleSelectMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedMembers.length === 0) {
      alert('请至少选择一个成员')
      return
    }

    if (!monthlyAmount || monthlyAmount <= 0) {
      alert('请输入有效的金额')
      return
    }

    try {
      const response = await memberAPI.bulkSetAmount({
        memberIds: selectedMembers,
        monthlyAmount: parseFloat(monthlyAmount)
      })

      if (response.success) {
        alert(`成功为 ${selectedMembers.length} 位成员设置月度金额`)
        setSelectedMembers([])
        loadMembers()
      }
    } catch (error) {
      console.error('设置金额失败:', error)
      alert('设置金额失败: ' + (error.response?.data?.message || error.message))
    }
  }

  const getFilteredMembers = () => {
    if (!searchTerm) return members
    return members.filter(m => 
      m.name.includes(searchTerm) || 
      m.phone?.includes(searchTerm) ||
      m.city?.includes(searchTerm)
    )
  }

  const filteredMembers = getFilteredMembers()
  const totalAmount = selectedMembers.length * monthlyAmount

  if (loading) {
    return <div style={{ padding: '30px' }}>加载中...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div className="page-header">
        <h2>金额管理</h2>
        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
          已选择: {selectedMembers.length} 人 | 总金额: ¥{totalAmount.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* 左侧：成员列表 */}
        <div className="card" style={{ height: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>成员列表</h3>
            <input 
              type="text"
              placeholder="搜索姓名/电话/城市"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                width: '250px'
              }}
            />
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      checked={
                        filteredMembers.length > 0 && 
                        filteredMembers.every(m => selectedMembers.includes(m.id))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>姓名</th>
                  <th>电话</th>
                  <th>城市</th>
                  <th>所属分销商</th>
                  <th>当前金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                      />
                    </td>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.city}</td>
                    <td>{member.distributor_name}</td>
                    <td>
                      {member.current_monthly_amount ? (
                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          ¥{parseFloat(member.current_monthly_amount).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>未设置</span>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        color: '#27ae60',
                        fontWeight: 'bold'
                      }}>
                        在职
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：金额设置表单 */}
        <div className="card" style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
          <h3 className="card-title">批量设置月度金额</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>月度金额 (元) *</label>
              <input 
                type="number"
                className="form-control"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                min="0"
                step="0.01"
                required
                placeholder="请输入金额"
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              />
              <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                可自由输入任意金额,支持小数
              </p>
            </div>

            <div style={{ 
              background: '#3498db', 
              color: 'white',
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', marginBottom: '5px' }}>预计总支出</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                ¥{totalAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                {selectedMembers.length} 人 × ¥{parseFloat(monthlyAmount).toLocaleString()} / 月
              </div>
            </div>

            <div style={{ 
              background: '#ecf0f1', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>选中成员预览</h4>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {selectedMembers.length === 0 ? (
                  <p style={{ color: '#7f8c8d', fontSize: '13px' }}>未选择任何成员</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {members
                      .filter(m => selectedMembers.includes(m.id))
                      .map(m => (
                        <li key={m.id} style={{ fontSize: '13px', marginBottom: '5px' }}>
                          {m.name} - {m.city}
                        </li>
                      ))
                    }
                  </ul>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                className="btn btn-warning"
                onClick={() => setSelectedMembers([])}
                style={{ flex: 1 }}
              >
                清空选择
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={selectedMembers.length === 0}
              >
                确认设置 ({selectedMembers.length}人)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AmountManagement
