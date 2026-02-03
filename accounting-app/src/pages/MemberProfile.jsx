import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberAPI } from '../api';

function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const loadMemberData = async () => {
    try {
      const response = await memberAPI.getMemberById(id);
      if (response.success) {
        setMember(response.data.member);
        setRecords(response.data.records);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('加载成员数据失败:', error);
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiring = (expireDate) => {
    if (!expireDate) return false;
    const today = new Date();
    const expire = new Date(expireDate);
    const diffDays = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expireDate) => {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>加载中...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>成员不存在</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <h2>成员画像 - {member.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← 返回
        </button>
      </div>

      {/* 基本信息卡片 */}
      <div className="card">
        <h3 className="card-title">基本信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <p><strong>姓名：</strong>{member.name}</p>
            <p><strong>性别：</strong>{member.gender || '未填写'}</p>
            <p><strong>年龄：</strong>{member.age || '未填写'}</p>
          </div>
          <div>
            <p><strong>电话：</strong>{member.phone || '未填写'}</p>
            <p><strong>城市：</strong>{member.city || '未填写'}</p>
            <p><strong>状态：</strong>
              <span style={{ 
                color: member.status === 'active' ? '#27ae60' : '#e74c3c',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
                {member.status === 'active' ? '正常' : '暂停'}
              </span>
            </p>
          </div>
          <div>
            <p><strong>住址：</strong>{member.address || '未填写'}</p>
            <p><strong>紧急联系人：</strong>{member.emergency_contact_name || '未填写'}</p>
            <p><strong>紧急联系电话：</strong>{member.emergency_contact_phone || '未填写'}</p>
          </div>
        </div>
      </div>

      {/* 证件信息卡片 */}
      <div className="card">
        <h3 className="card-title">证件信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: isExpired(member.id_card_1_expire_date) ? '2px solid #e74c3c' : 
                   checkExpiring(member.id_card_1_expire_date) ? '2px solid #f39c12' : 'none'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>证件一</h4>
            <p><strong>证件号：</strong>{member.id_card_1 || '未填写'}</p>
            <p><strong>注册日期：</strong>{member.id_card_1_register_date || '未填写'}</p>
            <p>
              <strong>到期日期：</strong>
              <span style={{ 
                color: isExpired(member.id_card_1_expire_date) ? 'red' : 
                       checkExpiring(member.id_card_1_expire_date) ? 'orange' : 'inherit',
                marginLeft: '5px'
              }}>
                {member.id_card_1_expire_date || '未填写'}
                {isExpired(member.id_card_1_expire_date) && ' ⚠️ 已过期'}
                {checkExpiring(member.id_card_1_expire_date) && !isExpired(member.id_card_1_expire_date) && ' ⏰ 即将过期'}
              </span>
            </p>
          </div>

          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: isExpired(member.id_card_2_expire_date) ? '2px solid #e74c3c' : 
                   checkExpiring(member.id_card_2_expire_date) ? '2px solid #f39c12' : 'none'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>证件二</h4>
            <p><strong>证件号：</strong>{member.id_card_2 || '未填写'}</p>
            <p><strong>注册日期：</strong>{member.id_card_2_register_date || '未填写'}</p>
            <p>
              <strong>到期日期：</strong>
              <span style={{ 
                color: isExpired(member.id_card_2_expire_date) ? 'red' : 
                       checkExpiring(member.id_card_2_expire_date) ? 'orange' : 'inherit',
                marginLeft: '5px'
              }}>
                {member.id_card_2_expire_date || '未填写'}
                {isExpired(member.id_card_2_expire_date) && ' ⚠️ 已过期'}
                {checkExpiring(member.id_card_2_expire_date) && !isExpired(member.id_card_2_expire_date) && ' ⏰ 即将过期'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 数据统计卡片 */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>记录数</h3>
            <div className="value">{stats.recordCount}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
            <h3>总到账</h3>
            <div className="value">¥{stats.totalReceived.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
            <h3>总保障金</h3>
            <div className="value">¥{stats.totalDeposit.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#9b59b6' }}>
            <h3>总保险</h3>
            <div className="value">¥{stats.totalInsurance.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
            <h3>总佣金</h3>
            <div className="value">¥{stats.totalCommission.toLocaleString()}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
            <h3>净收入</h3>
            <div className="value">¥{stats.totalNetRevenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* 账本记录 */}
      <div className="card">
        <h3 className="card-title">账本记录</h3>
        {records.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>到账</th>
                  <th>保障金</th>
                  <th>保险</th>
                  <th>佣金</th>
                  <th>净收入</th>
                  <th>城市</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{record.record_date}</td>
                    <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                      ¥{record.received_amount.toLocaleString()}
                    </td>
                    <td>¥{record.deposit.toLocaleString()}</td>
                    <td>¥{record.insurance.toLocaleString()}</td>
                    <td style={{ color: '#f39c12' }}>¥{record.commission.toLocaleString()}</td>
                    <td style={{ color: '#3498db', fontWeight: 'bold' }}>
                      ¥{record.net_revenue.toLocaleString()}
                    </td>
                    <td>{record.city}</td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
            暂无账本记录
          </p>
        )}
      </div>

      {/* 所属信息 */}
      <div className="card">
        <h3 className="card-title">所属信息</h3>
        <p><strong>所属分销商：</strong>{member.distributor_name}</p>
        <p><strong>分销层级：</strong>
          {member.distributor_role === 'distributor_a' ? 'A层分销' : 'B层分销'}
        </p>
        <p><strong>创建时间：</strong>{new Date(member.created_at).toLocaleString()}</p>
        <p><strong>更新时间：</strong>{new Date(member.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default MemberProfile;
