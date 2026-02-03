import { useState } from 'react'

function DistributorManagement({ user }) {
  const [distributors, setDistributors] = useState([
    {
      id: 1,
      name: '李明',
      level: 'A',
      commissionRate: 6,
      totalMembers: 45,
      totalRevenue: 450000,
      totalCommission: 27000,
      phone: '13800138001',
      email: 'liming@example.com',
      status: '正常'
    },
    {
      id: 2,
      name: '王强',
      level: 'A',
      commissionRate: 6,
      totalMembers: 38,
      totalRevenue: 380000,
      totalCommission: 22800,
      phone: '13800138002',
      email: 'wangqiang@example.com',
      status: '正常'
    },
    {
      id: 3,
      name: '赵敏',
      level: 'B',
      commissionRate: 8,
      totalMembers: 52,
      totalRevenue: 520000,
      totalCommission: 41600,
      phone: '13800138003',
      email: 'zhaomin@example.com',
      status: '正常'
    },
    {
      id: 4,
      name: '孙悟空',
      level: 'B',
      commissionRate: 8,
      totalMembers: 21,
      totalRevenue: 210000,
      totalCommission: 16800,
      phone: '13800138004',
      email: 'sunwukong@example.com',
      status: '正常'
    }
  ])
  
  const [showModal, setShowModal] = useState(false)
  const [editingDistributor, setEditingDistributor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    level: 'A',
    commissionRate: 6,
    phone: '',
    email: '',
    status: '正常'
  })

  const handleAdd = () => {
    setEditingDistributor(null)
    setFormData({
      name: '',
      level: 'A',
      commissionRate: 6,
      phone: '',
      email: '',
      status: '正常'
    })
    setShowModal(true)
  }

  const handleEdit = (distributor) => {
    setEditingDistributor(distributor)
    setFormData({
      name: distributor.name,
      level: distributor.level,
      commissionRate: distributor.commissionRate,
      phone: distributor.phone,
      email: distributor.email,
      status: distributor.status
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个分销商吗？')) {
      setDistributors(distributors.filter(d => d.id !== id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newDistributor = {
      ...formData,
      commissionRate: parseFloat(formData.commissionRate),
      totalMembers: 0,
      totalRevenue: 0,
      totalCommission: 0
    }

    if (editingDistributor) {
      setDistributors(distributors.map(d => 
        d.id === editingDistributor.id 
          ? { ...d, ...newDistributor } 
          : d
      ))
    } else {
      setDistributors([...distributors, { ...newDistributor, id: Date.now() }])
    }
    setShowModal(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // 当改变层级时，自动更新佣金比例
    if (name === 'level') {
      setFormData({
        ...formData,
        level: value,
        commissionRate: value === 'A' ? 6 : 8
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  // 计算统计数据
  const totalDistributors = distributors.length
  const totalMembers = distributors.reduce((sum, d) => sum + d.totalMembers, 0)
  const totalCommission = distributors.reduce((sum, d) => sum + d.totalCommission, 0)

  return (
    <>
      <div className="page-header">
        <h2>分销管理</h2>
        <div>
          {user.role === 'admin' && (
            <button className="btn btn-success" onClick={handleAdd}>
              + 添加分销商
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>分销商总数</h3>
          <div className="value">{totalDistributors}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#9b59b6' }}>
          <h3>管理成员总数</h3>
          <div className="value">{totalMembers}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>总佣金支出</h3>
          <div className="value">¥{totalCommission.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">分销商列表</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>层级</th>
                <th>佣金比例</th>
                <th>管理成员数</th>
                <th>总营收</th>
                <th>总佣金</th>
                <th>联系电话</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map(distributor => (
                <tr key={distributor.id}>
                  <td>{distributor.name}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: distributor.level === 'A' ? '#3498db' : '#9b59b6',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {distributor.level}层
                    </span>
                  </td>
                  <td>{distributor.commissionRate}%</td>
                  <td>{distributor.totalMembers}</td>
                  <td>¥{distributor.totalRevenue.toLocaleString()}</td>
                  <td style={{ color: '#f39c12', fontWeight: 'bold' }}>
                    ¥{distributor.totalCommission.toLocaleString()}
                  </td>
                  <td>{distributor.phone}</td>
                  <td>{distributor.email}</td>
                  <td>
                    <span style={{ 
                      color: distributor.status === '正常' ? '#27ae60' : '#e74c3c',
                      fontWeight: 'bold'
                    }}>
                      {distributor.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      {user.role === 'admin' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEdit(distributor)}>
                            编辑
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(distributor.id)}>
                            删除
                          </button>
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
              <h3>{editingDistributor ? '编辑分销商' : '添加分销商'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>分销层级 *</label>
                  <select
                    name="level"
                    className="form-control"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="A">A层分销</option>
                    <option value="B">B层分销</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>佣金比例 (%) *</label>
                  <input
                    type="number"
                    name="commissionRate"
                    className="form-control"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="正常">正常</option>
                    <option value="暂停">暂停</option>
                    <option value="注销">注销</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>联系电话</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ background: '#e8f4f8', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '5px' }}>
                  <strong>说明：</strong>
                </p>
                <p style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  • A层分销默认佣金比例为6%<br/>
                  • B层分销默认佣金比例为8%<br/>
                  • 可根据实际情况调整佣金比例
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

export default DistributorManagement
