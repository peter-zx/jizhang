import { useState, useEffect } from 'react'
import { memberAPI, userAPI, laborAPI } from '../api'

function MemberManagement({ user }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [distributors, setDistributors] = useState([])
  const [modalStep, setModalStep] = useState(1) // 1: 个人信息, 2: 金额数据, 3: 合同数据
  const [newMemberId, setNewMemberId] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '男',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idCard1: '',
    idCard1RegisterDate: '',
    idCard1ExpireDate: '',
    idCard2: '',
    idCard2RegisterDate: '',
    idCard2ExpireDate: '',
    city: '',
    distributorId: user.role === 'admin' ? '' : user.id,
    status: 'active'
  })

  const [taskData, setTaskData] = useState({
    monthlyAmount: '',
    contractSignDate: new Date().toISOString().split('T')[0],
    contractYears: 1
  })

  useEffect(() => {
    loadMembers()
    if (user.role === 'admin') {
      loadDistributors()
    }
  }, [])

  const loadMembers = async () => {
    try {
      const response = await memberAPI.getMembers()
      if (response.success) {
        setMembers(response.data.members)
      }
    } catch (error) {
      console.error('加载成员失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDistributors = async () => {
    try {
      const response = await userAPI.getDistributors()
      if (response.success) {
        setDistributors(response.data.distributors)
      }
    } catch (error) {
      console.error('加载分销商失败:', error)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    setModalStep(1)
    setNewMemberId(null)
    setFormData({
      name: '',
      age: '',
      gender: '男',
      phone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      idCard1: '',
      idCard1RegisterDate: '',
      idCard1ExpireDate: '',
      idCard2: '',
      idCard2RegisterDate: '',
      idCard2ExpireDate: '',
      city: '',
      distributorId: user.role === 'admin' ? '' : user.id,
      status: 'active'
    })
    setTaskData({
      monthlyAmount: '',
      contractSignDate: new Date().toISOString().split('T')[0],
      contractYears: 1
    })
    setShowModal(true)
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setModalStep(1)
    setFormData({
      ...member,
      distributorId: member.distributor_id,
      emergencyContactName: member.emergency_contact_name,
      emergencyContactPhone: member.emergency_contact_phone,
      idCard1RegisterDate: member.id_card_1_register_date,
      idCard1ExpireDate: member.id_card_1_expire_date,
      idCard2RegisterDate: member.id_card_2_register_date,
      idCard2ExpireDate: member.id_card_2_expire_date
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个成员吗？')) {
      try {
        await memberAPI.deleteMember(id)
        loadMembers()
      } catch (error) {
        alert(error.message || '删除失败')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (modalStep === 1) {
        if (editingMember) {
          await memberAPI.updateMember(editingMember.id, formData)
          setShowModal(false)
          loadMembers()
        } else {
          const response = await memberAPI.createMember(formData)
          if (response.success) {
            setNewMemberId(response.data.memberId)
            setModalStep(2) // 进入下一步：设置金额
          }
        }
      } else if (modalStep === 2) {
        setModalStep(3) // 进入下一步：设置合同
      } else if (modalStep === 3) {
        await laborAPI.startTask({
          memberId: newMemberId,
          ...taskData
        })
        setShowModal(false)
        loadMembers()
      }
    } catch (error) {
      alert(error.message || '保存失败')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (modalStep === 1) {
      setFormData({
        ...formData,
        [name]: value
      })
    } else {
      setTaskData({
        ...taskData,
        [name]: value
      })
    }
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
          {(user.role === 'admin' || user.role.includes('distributor')) && (
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
                  <td>{member.distributor_name}</td>
                  <td>
                    <span style={{ 
                      color: member.status === 'active' ? '#27ae60' : '#e74c3c',
                      fontWeight: 'bold'
                    }}>
                      {member.status === 'active' ? '正常' : '暂停'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button 
                        className="btn btn-info btn-sm" 
                        onClick={() => window.location.href = `/member/${member.id}`}
                      >
                        详情
                      </button>
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
              <h3>
                {editingMember ? '编辑成员' : (
                  modalStep === 1 ? '第一步：录入个人信息' : 
                  modalStep === 2 ? '第二步：设置金额数据' : '第三步：设置劳动合同'
                )}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {modalStep === 1 && (
                <>
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
                      <label>年龄</label>
                      <input
                        type="number"
                        name="age"
                        className="form-control"
                        value={formData.age}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>性别</label>
                      <select
                        name="gender"
                        className="form-control"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="男">男</option>
                        <option value="女">女</option>
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

                  <div className="form-group">
                    <label>住址</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>紧急联系人</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        className="form-control"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>紧急联系人电话</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        className="form-control"
                        value={formData.emergencyContactPhone}
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
                      <label>所属分销 *</label>
                      {user.role === 'admin' ? (
                        <select
                          name="distributorId"
                          className="form-control"
                          value={formData.distributorId}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">请选择分销商</option>
                          {distributors.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.role === 'distributor_a' ? 'A层' : 'B层'})</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          value={user.name}
                          disabled
                        />
                      )}
                    </div>
                    <div className="form-group">
                      <label>状态</label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">正常</option>
                        <option value="inactive">暂停</option>
                        <option value="closed">注销</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {modalStep === 2 && (
                <div style={{ padding: '20px 0' }}>
                  <div className="form-group">
                    <label>月度总任务金 (成员领取) *</label>
                    <input
                      type="number"
                      name="monthlyAmount"
                      className="form-control"
                      value={taskData.monthlyAmount}
                      onChange={handleInputChange}
                      placeholder="请输入金额"
                      required
                    />
                    <small style={{ color: '#7f8c8d' }}>这是该成员每月领取的总任务金，分销层扣除保障金和保险后为实际所得。</small>
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div style={{ padding: '20px 0' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>合同签约日期 *</label>
                      <input
                        type="date"
                        name="contractSignDate"
                        className="form-control"
                        value={taskData.contractSignDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>合同年限 (年) *</label>
                      <input
                        type="number"
                        name="contractYears"
                        className="form-control"
                        value={taskData.contractYears}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                    <p><strong>合同到期日期：</strong> 
                      {(() => {
                        const d = new Date(taskData.contractSignDate);
                        d.setFullYear(d.getFullYear() + parseInt(taskData.contractYears || 0));
                        return d.toISOString().split('T')[0];
                      })()}
                    </p>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalStep === 3 || editingMember ? '保存' : '下一步'}
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
