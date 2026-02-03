import { useState, useEffect } from 'react';
import { billingAPI } from '../api';

function RentCollection({ user }) {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startM = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    
    setStartMonth(startM);
    setEndMonth(currentMonth);
    loadData(startM, currentMonth);
  }, []);

  const loadData = async (start, end) => {
    try {
      const response = await billingAPI.getMonthlyRentCollection({
        startMonth: start,
        endMonth: end
      });
      if (response.success) {
        setCollection(response.data.collection);
      }
    } catch (error) {
      console.error('加载收租情况失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(startMonth, endMonth);
  };

  const getCompletionRate = (confirmed, total) => {
    if (total === 0) return 0;
    return ((confirmed / total) * 100).toFixed(1);
  };

  if (loading) {
    return <div style={{ padding: '30px' }}>加载中...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h2>收租情况统计</h2>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <div className="form-group">
            <label>开始月份</label>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>结束月份</label>
            <input
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn btn-primary" onClick={handleSearch}>
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">月度收租明细</h3>
        {collection.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>月份</th>
                  {user.role === 'admin' && <th>分销商</th>}
                  <th>成员总数</th>
                  <th>已确认数</th>
                  <th>完成率</th>
                  <th>总金额</th>
                  <th>已确认金额</th>
                  <th>未确认金额</th>
                </tr>
              </thead>
              <tbody>
                {collection.map((item, index) => {
                  const rate = getCompletionRate(item.confirmed_count, item.total_members);
                  const uncollected = item.total_amount - item.confirmed_amount;
                  
                  return (
                    <tr key={index}>
                      <td><strong>{item.bill_month}</strong></td>
                      {user.role === 'admin' && <td>{item.distributor_name}</td>}
                      <td>{item.total_members}</td>
                      <td>{item.confirmed_count}</td>
                      <td>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: rate >= 100 ? '#27ae60' : rate >= 80 ? '#f39c12' : '#e74c3c',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {rate}%
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>
                        ¥{item.total_amount.toLocaleString()}
                      </td>
                      <td style={{ color: '#27ae60', fontWeight: 'bold' }}>
                        ¥{item.confirmed_amount.toLocaleString()}
                      </td>
                      <td style={{ color: uncollected > 0 ? '#e74c3c' : 'inherit' }}>
                        ¥{uncollected.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
            暂无数据
          </p>
        )}
      </div>

      {collection.length > 0 && (
        <div className="card">
          <h3 className="card-title">汇总统计</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>总金额</h3>
              <div className="value">
                ¥{collection.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
              <h3>已收金额</h3>
              <div className="value">
                ¥{collection.reduce((sum, item) => sum + item.confirmed_amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#e74c3c' }}>
              <h3>未收金额</h3>
              <div className="value">
                ¥{collection.reduce((sum, item) => sum + (item.total_amount - item.confirmed_amount), 0).toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
              <h3>平均完成率</h3>
              <div className="value">
                {(collection.reduce((sum, item) => {
                  return sum + parseFloat(getCompletionRate(item.confirmed_count, item.total_members));
                }, 0) / collection.length).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RentCollection;
