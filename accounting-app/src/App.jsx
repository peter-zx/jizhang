import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import DistributorDashboard from './pages/DistributorDashboard'

function App() {
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    // 检查本地存储的用户信息
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setShowRegister(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            !user ? (
              showRegister ? (
                <Register onSwitch={() => setShowRegister(false)} />
              ) : (
                <Login 
                  onLogin={handleLogin} 
                  onSwitchToRegister={() => setShowRegister(true)} 
                />
              )
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/distributor" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/distributor/*" 
          element={
            user && (user.role === 'distributor_a' || user.role === 'distributor_b') ? (
              <DistributorDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
