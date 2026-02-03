import { useState, useEffect } from 'react';
import { billingAPI } from '../api';

function MonthlyBilling({ user }) {
  const [bills, setBills] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedBills, setSelectedBills] = useState([]);

  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(month);
    setSelectedMonth(month);
    loadData(month);
    loadStats();
  }, []);

  const loadData = async (month) => {
    try {
      const response = await billingAPI.getMonthlyBills({ month });
      if (response.success) {
        setBills(response.data.bills);
      }
    } catch (error) {
      console.error('加载账单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await billingAPI.getCurrentMonthStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 单个确认（无弹窗）
  const handleConfirm = async (billId) => {
    try {
      await billingAPI.confirmBill(billId, { notes: '已确认' });
      loadData(selectedMonth);
      loadStats();
    } catch (error) {
      alert(error.message || '确认失败');
    }
  };

  // 批量确认
  const handleBatchConfirm = async () => {
    if (selectedBills.length === 0) {
      alert('请至少选择一个账单');
      return;
    }

    try {
      for (const billId of selectedBills) {
        await billingAPI.confirmBill(billId, { notes: '批量确认' });
      }
      alert(`成功确认 ${selectedBills.length} 个账单`);
      setSelectedBills([]);
      loadData(selectedMonth);
      loadStats();
    } catch (error) {
      alert('批量确认失败: ' + (error.message || '服务器错误'));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const unconfirmedIds = bills.filter(b => b.deposit_confirmed === 0).map(b => b.id);
      setSelectedBills(unconfirmedIds);
    } else {
      setSelectedBills([]);
    }
  };

  const handleSelectBill = (billId) => {
    if (selectedBills.includes(billId)) {
      setSelectedBills(selectedBills.filter(id => id !== billId));
    } else {
      setSelectedBills([...selectedBills, billId]);
    }
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    setSelectedBills([]);
    loadData(month);
  };

  if (loading) {
    return <div style={{ padding: '30px' }}>加载中...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>月度账单确认</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="form-control"
            style={{ width: 'auto' }}
          />
          {selectedBills.length > 0 && (
            <button 
              className="btn btn-primary"
              onClick={handleBatchConfirm}
            >
              批量确认 ({selectedBills.length})
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>账单总数</h3>
            <div className="value">{stats.total_bills || 0}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
            <h3>已确认</h3>
            <div className="value">{stats.confirmed_count || 0}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
            <h3>待确认</h3>
            <div className="value">{stats.pending_count || 0}</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
            <h3>总金额</h3>
            <div className="value">¥{(stats.total_amount || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">账单列表</h3>
        {bills.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox"
                      checked={bills.length > 0 && bills.filter(b => b.deposit_confirmed === 0).length > 0 && selectedBills.length === bills.filter(b => b.deposit_confirmed === 0).length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>成员姓名</th>
                  <th>账单月份</th>
                  <th>月度金额</th>
                  <th>合同签约</th>
                  <th>合同到期</th>
                  <th>状态</th>
                  <th>确认时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id}>
                    <td>
                      {bill.deposit_confirmed === 0 && (
                        <input 
                          type="checkbox"
                          checked={selectedBills.includes(bill.id)}
                          onChange={() => handleSelectBill(bill.id)}
                        />
                      )}
                    </td>
                    <td>{bill.member_name}</td>
                    <td>{bill.bill_month}</td>
                    <td style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      ¥{bill.monthly_amount.toLocaleString()}
                    </td>
                    <td>{bill.contract_sign_date || '-'}</td>
                    <td>{bill.contract_expire_date || '-'}</td>
                    <td>
                      {bill.deposit_confirmed ? (
                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✓ 已确认</span>
                      ) : (
                        <span style={{ color: '#f39c12', fontWeight: 'bold' }}>○ 待确认</span>
                      )}
                    </td>
                    <td>
                      {bill.confirmed_at ? new Date(bill.confirmed_at).toLocaleString() : '-'}
                    </td>
                    <td>
                      {!bill.deposit_confirmed && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleConfirm(bill.id)}
                        >
                          确认发放
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
            当月暂无账单
          </p>
        )}
      </div>
    </>
  );
}

export default MonthlyBilling;
