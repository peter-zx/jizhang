import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import DistributorOverview from './DistributorOverview'
import MemberManagement from './MemberManagement'
import AccountingBook from './AccountingBook'
import MonthlyBilling from './MonthlyBilling'
import RentCollection from './RentCollection'
import ContractManagement from './ContractManagement'
import AmountManagement from './AmountManagement'

function DistributorDashboard({ user, onLogout }) {
  const location = useLocation()

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>收支记账系统</h1>
        <nav>
          <Link 
            to="/distributor/overview" 
            className={location.pathname === '/distributor/overview' || location.pathname === '/distributor' || location.pathname === '/distributor/' ? 'active' : ''}
          >
            📊 我的数据
          </Link>
          <Link 
            to="/distributor/members" 
            className={location.pathname === '/distributor/members' ? 'active' : ''}
          >
            👥 成员管理
          </Link>
          <Link 
            to="/distributor/contracts" 
            className={location.pathname === '/distributor/contracts' ? 'active' : ''}
          >
            📋 合同管理
          </Link>
          <Link 
            to="/distributor/amounts" 
            className={location.pathname === '/distributor/amounts' ? 'active' : ''}
          >
            💵 金额管理
          </Link>
          <Link 
            to="/distributor/billing" 
            className={location.pathname === '/distributor/billing' ? 'active' : ''}
          >
            💳 月度账单
          </Link>
          <Link 
            to="/distributor/rent" 
            className={location.pathname === '/distributor/rent' ? 'active' : ''}
          >
            💰 收租情况
          </Link>
          <Link 
            to="/distributor/accounting" 
            className={location.pathname === '/distributor/accounting' ? 'active' : ''}
          >
            📖 账本管理
          </Link>
        </nav>
        <div className="user-info">
          <p><strong>{user.name}</strong></p>
          <p>角色：{user.role === 'distributor_a' ? 'A层分销' : 'B层分销'}</p>
          <button className="logout-btn" onClick={onLogout}>退出登录</button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DistributorOverview user={user} />} />
          <Route path="/overview" element={<DistributorOverview user={user} />} />
          <Route path="/members" element={<MemberManagement user={user} />} />
          <Route path="/accounting" element={<AccountingBook user={user} />} />
          <Route path="/billing" element={<MonthlyBilling user={user} />} />
          <Route path="/rent" element={<RentCollection user={user} />} />
          <Route path="/contracts" element={<ContractManagement user={user} />} />
          <Route path="/amounts" element={<AmountManagement user={user} />} />
        </Routes>
      </main>
    </div>
  )
}

export default DistributorDashboard
