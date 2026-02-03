import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import MemberManagement from './MemberManagement';
import AccountingBook from './AccountingBook';
import MonthlyBilling from './MonthlyBilling';
import RentCollection from './RentCollection';

function AdminDistributorFeatures({ user }) {
  const location = useLocation();
  
  // 将管理员模拟为分销商，使其拥有分销商功能
  const distributorUser = {
    ...user,
    role: 'distributor_a', // 管理员在分销功能中使用A层分销的角色
    name: user.name
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>收支记账系统</h1>
        <nav>
          <Link 
            to="/admin/my-members/overview" 
            className={location.pathname === '/admin/my-members/overview' ? 'active' : ''}
          >
            📊 我的数据
          </Link>
          <Link 
            to="/admin/my-members/members" 
            className={location.pathname === '/admin/my-members/members' ? 'active' : ''}
          >
            👥 我的成员
          </Link>
          <Link 
            to="/admin/my-members/accounting" 
            className={location.pathname === '/admin/my-members/accounting' ? 'active' : ''}
          >
            📖 我的账本
          </Link>
          <Link 
            to="/admin/my-members/billing" 
            className={location.pathname === '/admin/my-members/billing' ? 'active' : ''}
          >
            💳 月度账单
          </Link>
          <Link 
            to="/admin/my-members/rent" 
            className={location.pathname === '/admin/my-members/rent' ? 'active' : ''}
          >
            💰 收租情况
          </Link>
        </nav>
        <div className="user-info">
          <p><strong>{user.name}</strong></p>
          <p>角色：{user.role === 'admin' ? '总管理员（分销模式）' : user.role}</p>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<AdminOverview stats={{}} />} />
          <Route path="/overview" element={<AdminOverview stats={{}} />} />
          <Route path="/members" element={<MemberManagement user={distributorUser} />} />
          <Route path="/accounting" element={<AccountingBook user={distributorUser} />} />
          <Route path="/billing" element={<MonthlyBilling user={distributorUser} />} />
          <Route path="/rent" element={<RentCollection user={distributorUser} />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminOverview({ stats }) {
  return (
    <>
      <div className="page-header">
        <h2>管理员分销功能</h2>
      </div>
      
      <div className="card">
        <h3 className="card-title">功能说明</h3>
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '15px' }}>
            <strong>欢迎使用管理员分销功能！</strong>
          </p>
          <p style={{ marginBottom: '15px' }}>
            您作为管理员，可以使用分销商的所有功能，包括：
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
            <li>管理自己的成员</li>
            <li>录入账本记录</li>
            <li>确认月度账单</li>
            <li>查看收租情况</li>
          </ul>
          <p>
            请使用左侧菜单导航到相应功能页面。
          </p>
        </div>
      </div>
    </>
  );
}

export default AdminDistributorFeatures;
