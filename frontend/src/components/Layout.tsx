import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleMobileMenu={() => setMobileOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

