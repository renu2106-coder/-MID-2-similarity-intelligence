import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Menu, 
  Search, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = async () => {
    setIsRefreshing(true);
    try {
      await api.checkHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Dashboard',
          subtitle: 'Workspace overview, document indexing metrics, and recent queries',
        };
      case '/new-analysis':
        return {
          title: 'New Analysis',
          subtitle: 'Run semantic vector search against indexed documents with exact attribution',
        };
      case '/library':
        return {
          title: 'Document Library',
          subtitle: 'Manage uploaded corpora, inspect chunks, and control indexing lifecycle',
        };
      case '/history':
        return {
          title: 'Analysis History',
          subtitle: 'Review historical semantic similarity searches and inspect past matches',
        };
      case '/about':
        return {
          title: 'About the Project',
          subtitle: 'RAG architecture, vector mathematics, source-locator mechanics, and methodology',
        };
      default:
        return {
          title: 'Similarity Intelligence',
          subtitle: 'RAG Document Workspace',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          className="btn btn-ghost"
          style={{ padding: '8px', display: 'none' }}
          onClick={onToggleMobileMenu}
          id="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
            {title}
          </h1>
          <p className="supporting-text" style={{ display: 'none' }} id="header-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="top-header-right">
        {/* Backend Status Indicator */}
        <div
          className="status-pill"
          title={`Backend status: ${backendStatus}`}
          onClick={checkConnection}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <span className={`status-dot ${backendStatus}`} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {backendStatus === 'online'
              ? 'Backend Online'
              : backendStatus === 'offline'
              ? 'Backend Offline'
              : 'Checking...'}
          </span>
          <RefreshCw
            size={12}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{ color: '#94A3B8', marginLeft: '2px' }}
          />
        </div>

        {/* Quick Action Button */}
        {location.pathname !== '/new-analysis' && (
          <button
            onClick={() => navigate('/new-analysis')}
            className="btn btn-primary btn-sm"
          >
            <Search size={14} />
            <span>New Analysis</span>
          </button>
        )}
      </div>
    </header>
  );
};

