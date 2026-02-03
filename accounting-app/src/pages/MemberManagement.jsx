import { useState } from 'react'

function MemberManagement({ user }) {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: '张三',
      idCard1: '320102199001011234',
      idCard1RegisterDate: '2025-01-15',
      idCard1ExpireDate: '2026-01-15',
      idCard2: 'A12345678',
      idCard2RegisterDate: '2025-02-01',
      idCard2ExpireDate: '2027-02-01',
      city: '北京',
      distributor: 'A层分销-李明',
      status: '正常'
    },
    {
      id: 2,
      name: '李四',
      idCard1: '310101198505051111',
      idCard1RegisterDate: '2025-03-10',
      idCard1ExpireDate: '2026-03-10',
      idCard2: 'B98765432',
      idCard2RegisterDate: '2025-03-15',
      idCard2ExpireDate: '2027-03-15',
      city: '上海',
      distributor: 'B层分销-王强',
      status: '正常'
    }
  ])
  
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'detail'
  const [formData, setFormData] = useState({
    name: '',
    idCard1: '',
    idCard1RegisterDate: '',
    idCard1ExpireDate: '',
    idCard2: '',
    idCard2RegisterDate: '',
    idCard2ExpireDate: '',
    city: '',
    distributor: '',
    status: '正常'
  })

  const handleAdd = () => {
    setEditingMember(null)
    setFormData({
      name: '',
      idCard1: '',
      idCard1RegisterDate: '',
      idCard1ExpireDate: '',
      idCard2: '',
      idCard2RegisterDate: '',
      idCard2ExpireDate: '',
      city: '',
      distributor: '',
      status: '正常'
    })
    setShowModal(true)
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData(member)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个成员吗？')) {
      setMembers(members.filter(m => m.id !== id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? { ...formData, id: m.id } : m))
    } else {
      setMembers([...members, { ...formData, id: Date.now() }])
    }
    setShowModal(false)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 检查证件是否即将过期（30天内）
  const checkExpiring = (expireDate) => {
    const today = new Date()
    const expire = new Date(expireDate)
    const diffDays = Math.ceil((expire - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (expireDate) => {
    return new Date(expireDate) < new Date()
  }

  return (
    <>
      <div className="page-header">
        <h2>成员管理</h2>
        <div>
          {user.role === 'admin' && (
            <button className="btn btn-success" onClick={handleAdd}>
              + 添加成员
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>证件一</th>
                <th>证件一注册时间</th>
                <th>证件一到期时间</th>
                <th>证件二</th>
                <th>证件二注册时间</th>
                <th>证件二到期时间</th>
                <th>城市</th>
                <th>所属分销</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.idCard1}</td>
                  <td>{member.idCard1RegisterDate}</td>
                  <td>
                    <span style={{ 
                      color: isExpired(member.idCard1ExpireDate) ? 'red' : 
                             checkExpiring(member.idCard1ExpireDate) ? 'orange' : 'inherit'
                    }}>
                      {member.idCard1ExpireDate}
                      {isExpired(member.idCard1ExpireDate) && ' ⚠️'}
                      {checkExpiring(member.idCard1ExpireDate) && !isExpired(member.idCard1ExpireDate) && ' ⏰'}
                    </span>
                  </td>
                  <td>{member.idCard2}</td>
                  <td>{member.idCard2RegisterDate}</td>
                  <td>
                    <span style={{ 
                      color: isExpired(member.idCard2ExpireDate) ? 'red' : 
                             checkExpiring(member.idCard2ExpireDate) ? 'orange' : 'inherit'
                    }}>
                      {member.idCard2ExpireDate}
                      {isExpired(member.idCard2ExpireDate) && ' ⚠️'}
                      {checkExpiring(member.idCard2ExpireDate) && !isExpired(member.idCard2ExpireDate) && ' ⏰'}
                    </span>
                  </td>
                  <td>{member.city}</td>
                  <td>{member.distributor}</td>
                  <td>{member.status}</td>
                  <td>
                    <div className="action-btns">
                      {(user.role === 'admin' || user.role.includes('distributor')) && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEdit(member)}>
                            编辑
                          </button>
                          {user.role === 'admin' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(member.id)}>
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
              <h3>{editingMember ? '编辑成员' : '添加成员'}</h3>
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
              
              <div className="form-row">
                <div className="form-group">
                  <label>证件一</label>
                  <input
                    type="text"
                    name="idCard1"
                    className="form-control"
                    value={formData.idCard1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>证件一注册时间</label>
                  <input
                    type="date"
                    name="idCard1RegisterDate"
                    className="form-control"
                    value={formData.idCard1RegisterDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>证件一到期时间</label>
                  <input
                    type="date"
                    name="idCard1ExpireDate"
                    className="form-control"
                    value={formData.idCard1ExpireDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>证件二</label>
                  <input
                    type="text"
                    name="idCard2"
                    className="form-control"
                    value={formData.idCard2}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>证件二注册时间</label>
                  <input
                    type="date"
                    name="idCard2RegisterDate"
                    className="form-control"
                    value={formData.idCard2RegisterDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>证件二到期时间</label>
                  <input
                    type="date"
                    name="idCard2ExpireDate"
                    className="form-control"
                    value={formData.idCard2ExpireDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>所属分销</label>
                  <input
                    type="text"
                    name="distributor"
                    className="form-control"
                    value={formData.distributor}
                    onChange={handleInputChange}
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

export default MemberManagement
