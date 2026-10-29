import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  History, 
  Info, 
  PanelLeftClose, 
  PanelLeftOpen, 
  BrainCircuit,
  Cpu,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-analysis', label: 'New Analysis', icon: Search },
    { to: '/library', label: 'Document Library', icon: BookOpen },
    { to: '/history', label: 'Analysis History', icon: History },
    { to: '/about', label: 'About the Project', icon: Info },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35 }}
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div className="sidebar-brand-icon" title="Similarity Intelligence">
              <BrainCircuit size={22} />
            </div>

            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-title">Similarity Intelligence</span>
                <span className="sidebar-subtitle">RAG Document Workspace</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="btn btn-ghost"
            style={{ display: mobileOpen ? 'flex' : 'none', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={onCloseMobile}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px 0' : '10px 14px',
                }}
              >
                <Icon size={19} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info & Desktop Collapse Toggle */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                border: '1px solid var(--color-borders)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Cpu size={16} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>
                  all-MiniLM-L6-v2
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  Local Semantic Vectors (384d)
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: '8px 12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : (
              <>
                <PanelLeftClose size={18} />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

