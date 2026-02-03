import { useState } from 'react'

function AccountingBook({ user }) {
  const [records, setRecords] = useState([
    {
      id: 1,
      memberName: '张三',
      receivedAmount: 8000,
      deposit: 1000,
      insurance: 500,
      commission: 600,
      city: '北京',
      distributor: 'A层分销-李明',
      date: '2026-02-01',
      netRevenue: 5900
    },
    {
      id: 2,
      memberName: '李四',
      receivedAmount: 10000,
      deposit: 1200,
      insurance: 600,
      commission: 800,
      city: '上海',
      distributor: 'B层分销-王强',
      date: '2026-02-02',
      netRevenue: 7400
    }
  ])
  
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [formData, setFormData] = useState({
    memberName: '',
    receivedAmount: '',
    deposit: '',
    insurance: '',
    city: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleAdd = () => {
    setEditingRecord(null)
    setFormData({
      memberName: '',
      receivedAmount: '',
      deposit: '',
      insurance: '',
      city: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setFormData({
      memberName: record.memberName,
      receivedAmount: record.receivedAmount,
      deposit: record.deposit,
      insurance: record.insurance,
      city: record.city,
      date: record.date
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      setRecords(records.filter(r => r.id !== id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // 计算佣金（假设A层6%，B层8%）
    const commission = formData.receivedAmount * 0.07
    
    // 计算净收入
    const netRevenue = formData.receivedAmount - formData.deposit - formData.insurance - commission
    
    const newRecord = {
      ...formData,
      receivedAmount: parseFloat(formData.receivedAmount),
      deposit: parseFloat(formData.deposit),
      insurance: parseFloat(formData.insurance),
      commission: commission,
      netRevenue: netRevenue,
      distributor: user.name
    }

    if (editingRecord) {
      setRecords(records.map(r => r.id === editingRecord.id ? { ...newRecord, id: r.id } : r))
    } else {
      setRecords([...records, { ...newRecord, id: Date.now() }])
    }
    setShowModal(false)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 计算统计数据
  const totalReceived = records.reduce((sum, r) => sum + r.receivedAmount, 0)
  const totalDeposit = records.reduce((sum, r) => sum + r.deposit, 0)
  const totalInsurance = records.reduce((sum, r) => sum + r.insurance, 0)
  const totalCommission = records.reduce((sum, r) => sum + r.commission, 0)
  const totalNetRevenue = records.reduce((sum, r) => sum + r.netRevenue, 0)

  return (
    <>
      <div className="page-header">
        <h2>账本管理</h2>
        <div>
          {(user.role === 'admin' || user.role.includes('distributor')) && (
            <button className="btn btn-success" onClick={handleAdd}>
              + 添加记录
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>总到账</h3>
          <div className="value">¥{totalReceived.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
          <h3>总保障金</h3>
          <div className="value">¥{totalDeposit.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#9b59b6' }}>
          <h3>总保险金额</h3>
          <div className="value">¥{totalInsurance.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>总佣金</h3>
          <div className="value">¥{totalCommission.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>净收入</h3>
          <div className="value">¥{totalNetRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">收支记录</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>成员姓名</th>
                <th>到账</th>
                <th>保障金</th>
                <th>保险金额</th>
                <th>佣金</th>
                <th>净收入</th>
                <th>城市</th>
                <th>分销商</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.memberName}</td>
                  <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                    ¥{record.receivedAmount.toLocaleString()}
                  </td>
                  <td>¥{record.deposit.toLocaleString()}</td>
                  <td>¥{record.insurance.toLocaleString()}</td>
                  <td style={{ color: '#f39c12' }}>¥{record.commission.toLocaleString()}</td>
                  <td style={{ color: '#3498db', fontWeight: 'bold' }}>
                    ¥{record.netRevenue.toLocaleString()}
                  </td>
                  <td>{record.city}</td>
                  <td>{record.distributor}</td>
                  <td>
                    <div className="action-btns">
                      {(user.role === 'admin' || user.role.includes('distributor')) && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEdit(record)}>
                            编辑
                          </button>
                          {user.role === 'admin' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record.id)}>
                              删除
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRecord ? '编辑记录' : '添加记录'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>成员姓名 *</label>
                  <input
                    type="text"
                    name="memberName"
                    className="form-control"
                    value={formData.memberName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>日期 *</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>到账金额 *</label>
                  <input
                    type="number"
                    name="receivedAmount"
                    className="form-control"
                    value={formData.receivedAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>保障金 *</label>
                  <input
                    type="number"
                    name="deposit"
                    className="form-control"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>保险金额 *</label>
                  <input
                    type="number"
                    name="insurance"
                    className="form-control"
                    value={formData.insurance}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>城市</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                  佣金将自动计算（7%）
                </p>
                <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  净收入 = 到账 - 保障金 - 保险金额 - 佣金
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AccountingBook
