import { useState, useEffect } from 'react'
import { memberAPI } from '../api'

function ContractManagement({ user }) {
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [contractData, setContractData] = useState({
    signDate: new Date().toISOString().split('T')[0],
    years: 2
  })
  const [contractFiles, setContractFiles] = useState([])

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
    if (e.target.checked) {
      setSelectedMembers(members.map(m => m.id))
    } else {
      setSelectedMembers([])
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

    try {
      const response = await memberAPI.bulkSetContract({
        memberIds: selectedMembers,
        signDate: contractData.signDate,
        years: parseInt(contractData.years)
      })

      if (response.success) {
        alert(`成功为 ${selectedMembers.length} 位成员设置合同`)
        setSelectedMembers([])
        setContractData({
          signDate: new Date().toISOString().split('T')[0],
          years: 2
        })
      }
    } catch (error) {
      console.error('设置合同失败:', error)
      alert('设置合同失败: ' + (error.response?.data?.message || error.message))
    }
  }

  const calculateExpireDate = () => {
    if (!contractData.signDate || !contractData.years) return ''
    const date = new Date(contractData.signDate)
    date.setFullYear(date.getFullYear() + parseInt(contractData.years))
    return date.toISOString().split('T')[0]
  }

  if (loading) {
    return <div style={{ padding: '30px' }}>加载中...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div className="page-header">
        <h2>合同管理</h2>
        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
          已选择: {selectedMembers.length} / {members.length} 人
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* 左侧：成员列表 */}
        <div className="card" style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <h3 className="card-title">成员列表</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>姓名</th>
                <th>电话</th>
                <th>城市</th>
                <th>所属分销商</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
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

        {/* 右侧：合同设置表单 */}
        <div className="card" style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
          <h3 className="card-title">批量设置合同</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>合同签订日期 *</label>
              <input 
                type="date"
                className="form-control"
                value={contractData.signDate}
                onChange={(e) => setContractData({ ...contractData, signDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>合同年限 *</label>
              <select 
                className="form-control"
                value={contractData.years}
                onChange={(e) => setContractData({ ...contractData, years: e.target.value })}
                required
              >
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="5">5年</option>
              </select>
            </div>

            <div className="form-group">
              <label>合同到期日期</label>
              <input 
                type="text"
                className="form-control"
                value={calculateExpireDate()}
                disabled
                style={{ background: '#ecf0f1', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>合同文件上传（可选）</label>
              <input 
                type="file"
                className="form-control"
                multiple
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setContractFiles([...e.target.files])}
              />
              <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                支持 PNG、JPG、PDF 格式，可多选
              </p>
            </div>

            <div style={{ 
              background: '#ecf0f1', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>选中成员预览</h4>
              <div style={{ maxHeight: '150px', overflow: 'auto' }}>
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

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={selectedMembers.length === 0}
            >
              批量设置合同 ({selectedMembers.length}人)
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContractManagement
