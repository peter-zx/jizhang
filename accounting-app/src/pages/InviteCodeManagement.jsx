import { useState, useEffect } from 'react';
import { authAPI } from '../api';

function InviteCodeManagement({ user }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    role: 'distributor_a',
    count: 1
  });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const response = await authAPI.getInviteCodes();
      if (response.success) {
        setCodes(response.data.codes);
      }
    } catch (error) {
      console.error('加载邀请码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await authAPI.generateInviteCode({
        role: formData.role,
        count: parseInt(formData.count)
      });
      alert('生成成功');
      setShowModal(false);
      loadCodes();
    } catch (error) {
      alert(error.message || '生成失败');
    }
  };

  const getStats = () => {
    const total = codes.length;
    const used = codes.filter(c => c.status === 'used').length;
    const unused = codes.filter(c => c.status === 'unused').length;
    const aLevel = codes.filter(c => c.role === 'distributor_a').length;
    const bLevel = codes.filter(c => c.role === 'distributor_b').length;

    return { total, used, unused, aLevel, bLevel };
  };

  const stats = getStats();

  if (loading) {
    return <div style={{ padding: '30px' }}>加载中...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>邀请码管理</h2>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          + 生成邀请码
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>邀请码总数</h3>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>已使用</h3>
          <div className="value">{stats.used}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>未使用</h3>
          <div className="value">{stats.unused}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
          <h3>A层 / B层</h3>
          <div className="value">{stats.aLevel} / {stats.bLevel}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">邀请码列表</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>邀请码</th>
                <th>层级</th>
                <th>状态</th>
                <th>创建人</th>
                <th>使用人</th>
                <th>创建时间</th>
                <th>使用时间</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(code => (
                <tr key={code.id}>
                  <td>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      background: '#f0f0f0',
                      borderRadius: '4px'
                    }}>
                      {code.code}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: code.role === 'distributor_a' ? '#3498db' : '#9b59b6',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {code.role === 'distributor_a' ? 'A层' : 'B层'}
                    </span>
                  </td>
                  <td>
                    {code.status === 'used' ? (
                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✓ 已使用</span>
                    ) : (
                      <span style={{ color: '#f39c12', fontWeight: 'bold' }}>○ 未使用</span>
                    )}
                  </td>
                  <td>{code.creator_name}</td>
                  <td>{code.used_by_name || '-'}</td>
                  <td>{new Date(code.created_at).toLocaleString()}</td>
                  <td>{code.used_at ? new Date(code.used_at).toLocaleString() : '-'}</td>
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
              <h3>生成邀请码</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>分销层级 *</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="distributor_a">A层分销（佣金6%）</option>
                  <option value="distributor_b">B层分销（佣金8%）</option>
                </select>
              </div>
              <div className="form-group">
                <label>生成数量 *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  min="1"
                  max="10"
                  required
                />
                <small style={{ color: '#7f8c8d' }}>一次最多生成10个</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  生成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default InviteCodeManagement;
