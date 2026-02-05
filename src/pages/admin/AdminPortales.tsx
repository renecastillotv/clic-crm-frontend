/**
 * AdminPortales - Gestión del Catálogo de Portales
 * Permite crear, editar y eliminar portales de inmobiliarias (MercadoLibre, EasyBroker, etc.)
 */

import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  getPortalesCatalogoAdmin,
  createPortalCatalogo,
  updatePortalCatalogoApi,
  deletePortalCatalogoApi,
  togglePortalCatalogoApi,
  getAllRoles,
  PortalCatalogo,
  CreatePortalCatalogoData,
} from '../../services/api';

interface Role {
  id: string;
  nombre: string;
  codigo: string;
  tipo: 'platform' | 'tenant';
  descripcion: string | null;
  activo?: boolean;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#333' : '#fff';
}

export default function AdminPortales() {
  const { getToken } = useAuth();
  const [portales, setPortales] = useState<PortalCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPortal, setEditingPortal] = useState<PortalCatalogo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadPortales();
  }, [filterActivo]);

  const loadPortales = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const filters: { activo?: boolean; search?: string } = {};
      if (filterActivo === 'active') filters.activo = true;
      if (filterActivo === 'inactive') filters.activo = false;

      const data = await getPortalesCatalogoAdmin(filters, token);
      setPortales(data);
      setLoadingError(null);
    } catch (err: any) {
      setLoadingError(err.message || 'Error al cargar portales');
      console.error('Error cargando portales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (portal: PortalCatalogo) => {
    setEditingPortal(portal);
    setShowCreateModal(true);
  };

  const handleDelete = async (portal: PortalCatalogo) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el portal "${portal.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      await deletePortalCatalogoApi(portal.id, token);
      await loadPortales();
    } catch (err: any) {
      const errorMessage = err.message || 'Error al eliminar portal';
      setError(errorMessage);
      console.error('Error eliminando portal:', err);
    }
  };

  const handleToggleActivo = async (portal: PortalCatalogo) => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      await togglePortalCatalogoApi(portal.id, !portal.activo, token);
      await loadPortales();
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cambiar estado del portal';
      setError(errorMessage);
      console.error('Error toggling portal:', err);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPortal(null);
  };

  const handleSaved = () => {
    handleCloseModal();
    loadPortales();
  };

  // Filtrar por búsqueda
  const filteredPortales = portales.filter(portal => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      portal.nombre.toLowerCase().includes(searchLower) ||
      portal.codigo.toLowerCase().includes(searchLower) ||
      (portal.descripcion && portal.descripcion.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="admin-portales-loading">
        <div className="loading-spinner"></div>
        <p>Cargando portales...</p>
        <style>{`
          .admin-portales-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
            color: #64748B;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #E2E8F0;
            border-top-color: #2563EB;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="admin-portales-error">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3>Error al cargar datos</h3>
        <p>{loadingError}</p>
        <button onClick={loadPortales} className="retry-btn">
          Reintentar
        </button>
        <style>{`
          .admin-portales-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
            text-align: center;
          }
          .error-icon {
            color: #EF4444;
          }
          .retry-btn {
            padding: 10px 24px;
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .retry-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-portales">
      <div className="page-header">
        <div>
          <h1>Catálogo de Portales</h1>
          <p className="page-subtitle">
            Administra los portales de inmobiliarias disponibles para conectar
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingPortal(null);
            setShowCreateModal(true);
          }}
        >
          <span className="btn-icon">+</span>
          Nuevo Portal
        </button>
      </div>

      {error && (
        <div className="action-error-banner">
          <div className="error-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64547 18.3024 1.55311 18.6453 1.552 19C1.55089 19.3547 1.64105 19.6983 1.81377 19.9999C1.98649 20.3015 2.23616 20.5498 2.53752 20.7183C2.83887 20.8868 3.18067 20.9693 3.53 20.96H20.47C20.8193 20.9693 21.1611 20.8868 21.4625 20.7183C21.7638 20.5498 22.0135 20.3015 22.1862 19.9999C22.359 19.6983 22.4491 19.3547 22.448 19C22.4469 18.6453 22.3545 18.3024 22.18 18L13.71 3.86C13.5319 3.56609 13.2808 3.32312 12.9813 3.15447C12.6818 2.98582 12.3437 2.89726 12 2.89726C11.6563 2.89726 11.3182 2.98582 11.0187 3.15447C10.7192 3.32312 10.4681 3.56609 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="error-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActivo === 'all' ? 'active' : ''}`}
            onClick={() => setFilterActivo('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filterActivo === 'active' ? 'active' : ''}`}
            onClick={() => setFilterActivo('active')}
          >
            Activos
          </button>
          <button
            className={`filter-btn ${filterActivo === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterActivo('inactive')}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Tabla de portales */}
      <div className="portales-table-container">
        <table className="portales-table">
          <thead>
            <tr>
              <th>Portal</th>
              <th>Código</th>
              <th>Roles Auto-Activo</th>
              <th>Orden</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPortales.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  <div className="empty-state">
                    {searchTerm ? (
                      <>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No se encontraron portales con "{searchTerm}"</p>
                      </>
                    ) : (
                      <>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No hay portales definidos</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredPortales.map((portal) => (
                <tr key={portal.id}>
                  <td>
                    <div className="portal-info">
                      <div
                        className="portal-badge"
                        style={{
                          backgroundColor: portal.color,
                          color: getContrastColor(portal.color)
                        }}
                      >
                        {portal.icono || portal.nombre.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="portal-details">
                        <div className="portal-name">{portal.nombre}</div>
                        {portal.descripcion && (
                          <div className="portal-description">{portal.descripcion}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="portal-code">{portal.codigo}</code>
                  </td>
                  <td>
                    <div className="roles-badges">
                      {portal.roles_auto_activo.length === 0 ? (
                        <span className="no-roles">Sin roles</span>
                      ) : (
                        portal.roles_auto_activo.map((roleCode) => (
                          <span key={roleCode} className="role-badge">
                            {roleCode}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="orden-badge">{portal.orden}</span>
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={portal.activo}
                        onChange={() => handleToggleActivo(portal)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => handleEdit(portal)}
                        title="Editar"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={() => handleDelete(portal)}
                        title="Eliminar"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <PortalModal
          portal={editingPortal}
          onClose={handleCloseModal}
          onSaved={handleSaved}
          getToken={getToken}
        />
      )}

      <style>{`
        .admin-portales {
          max-width: 1600px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 2.25rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          color: #64748B;
          font-size: 0.9375rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
        }

        .btn-icon {
          font-size: 1.25rem;
        }

        .action-error-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-left: 4px solid #DC2626;
          padding: 16px 20px;
          margin-bottom: 24px;
          border-radius: 10px;
          color: #DC2626;
        }

        .action-error-banner .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .action-error-banner .error-close {
          background: none;
          border: none;
          color: #DC2626;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .action-error-banner .error-close:hover {
          background: rgba(220, 38, 38, 0.1);
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding: 16px 20px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
        }

        .search-box {
          flex: 1;
          position: relative;
          max-width: 400px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
        }

        .search-box input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #2563EB;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #334155;
        }

        .filter-btn.active {
          background: #2563EB;
          border-color: #2563EB;
          color: white;
        }

        .portales-table-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
        }

        .portales-table {
          width: 100%;
          border-collapse: collapse;
        }

        .portales-table thead {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
        }

        .portales-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .portales-table td {
          padding: 16px 20px;
          border-top: 1px solid #F1F5F9;
          color: #334155;
          font-size: 0.9375rem;
        }

        .portales-table tbody tr {
          transition: background 0.2s;
        }

        .portales-table tbody tr:hover {
          background: #F8FAFC;
        }

        .portal-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .portal-badge {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .portal-details {
          flex: 1;
        }

        .portal-name {
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .portal-description {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .portal-code {
          font-family: 'Courier New', monospace;
          background: #F8FAFC;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        .roles-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .role-badge {
          padding: 4px 10px;
          background: #DBEAFE;
          color: #1E40AF;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #BFDBFE;
        }

        .no-roles {
          color: #94A3B8;
          font-size: 0.875rem;
          font-style: italic;
        }

        .orden-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-weight: 600;
          color: #475569;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          cursor: pointer;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #CBD5E1;
          border-radius: 24px;
          transition: 0.3s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #10B981;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #475569;
          padding: 0;
        }

        .action-btn:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }

        .action-btn-edit:hover {
          color: #2563EB;
          background: #EFF6FF;
          border-color: #BFDBFE;
        }

        .action-btn-delete:hover {
          color: #DC2626;
          background: #FEE2E2;
          border-color: #FECACA;
        }

        .empty-row {
          padding: 0 !important;
          border: none !important;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748B;
        }

        .empty-state svg {
          margin-bottom: 16px;
          color: #CBD5E1;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Modal para crear/editar portales
 */
function PortalModal({
  portal,
  onClose,
  onSaved,
  getToken,
}: {
  portal: PortalCatalogo | null;
  onClose: () => void;
  onSaved: () => void;
  getToken: () => Promise<string | null>;
}) {
  const [formData, setFormData] = useState<CreatePortalCatalogoData>({
    codigo: portal?.codigo || '',
    nombre: portal?.nombre || '',
    descripcion: portal?.descripcion || '',
    icono: portal?.icono || '',
    color: portal?.color || '#3b82f6',
    logo_url: portal?.logo_url || '',
    roles_auto_activo: portal?.roles_auto_activo || [],
    activo: portal?.activo !== undefined ? portal.activo : true,
    orden: portal?.orden || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const token = await getToken();
      const allRoles = await getAllRoles(token);
      // Filtrar solo roles de tipo tenant
      const tenantRoles = allRoles.filter((r: Role) => r.tipo === 'tenant');
      setRoles(tenantRoles);
    } catch (err: any) {
      console.error('Error cargando roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Validaciones
      if (!formData.codigo || !formData.nombre) {
        throw new Error('El código y nombre son requeridos');
      }

      if (formData.icono && formData.icono.length > 2) {
        throw new Error('El icono debe tener máximo 2 caracteres');
      }

      if (portal) {
        // Actualizar
        await updatePortalCatalogoApi(portal.id, formData, token);
      } else {
        // Crear
        await createPortalCatalogo(formData, token);
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al guardar portal');
      console.error('Error guardando portal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (roleCode: string) => {
    const current = formData.roles_auto_activo || [];
    const newRoles = current.includes(roleCode)
      ? current.filter(r => r !== roleCode)
      : [...current, roleCode];
    setFormData({ ...formData, roles_auto_activo: newRoles });
  };

  // Usar createPortal para renderizar el modal en document.body
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{portal ? 'Editar Portal' : 'Crear Nuevo Portal'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64547 18.3024 1.55311 18.6453 1.552 19C1.55089 19.3547 1.64105 19.6983 1.81377 19.9999C1.98649 20.3015 2.23616 20.5498 2.53752 20.7183C2.83887 20.8868 3.18067 20.9693 3.53 20.96H20.47C20.8193 20.9693 21.1611 20.8868 21.4625 20.7183C21.7638 20.5498 22.0135 20.3015 22.1862 19.9999C22.359 19.6983 22.4491 19.3547 22.448 19C22.4469 18.6453 22.3545 18.3024 22.18 18L13.71 3.86C13.5319 3.56609 13.2808 3.32312 12.9813 3.15447C12.6818 2.98582 12.3437 2.89726 12 2.89726C11.6563 2.89726 11.3182 2.98582 11.0187 3.15447C10.7192 3.32312 10.4681 3.56609 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>
                Código <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="Ej: mercadolibre"
                required
                disabled={!!portal}
              />
              {portal && <p className="form-hint">El código no se puede cambiar</p>}
            </div>

            <div className="form-group">
              <label>
                Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: MercadoLibre"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del portal..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Icono (2 letras máx.)</label>
              <input
                type="text"
                value={formData.icono || ''}
                onChange={(e) => setFormData({ ...formData, icono: e.target.value.substring(0, 2).toUpperCase() })}
                placeholder="Ej: ML"
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={formData.color || '#3b82f6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={formData.color || '#3b82f6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="color-text-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Orden</label>
              <input
                type="number"
                value={formData.orden || 0}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className="form-group">
            <label>URL del Logo</label>
            <input
              type="url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <div className="form-group">
            <label>Roles Auto-Activo</label>
            {loadingRoles ? (
              <p className="form-hint">Cargando roles...</p>
            ) : (
              <div className="roles-checkboxes">
                {roles.length === 0 ? (
                  <p className="form-hint">No hay roles de tenant disponibles</p>
                ) : (
                  roles.map((role) => (
                    <label key={role.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.roles_auto_activo?.includes(role.codigo) || false}
                        onChange={() => handleRoleToggle(role.codigo)}
                      />
                      <span>{role.nombre} ({role.codigo})</span>
                    </label>
                  ))
                )}
              </div>
            )}
            <p className="form-hint">
              Selecciona los roles que tendrán este portal activo automáticamente
            </p>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <span>Portal activo</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !formData.codigo || !formData.nombre}>
              {saving ? 'Guardando...' : portal ? 'Guardar Cambios' : 'Crear Portal'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
          }

          .modal-content {
            background: #FFFFFF;
            border-radius: 16px;
            width: 100%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #E2E8F0;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            color: #0F172A;
          }

          .modal-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #64748B;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
          }

          .modal-close:hover {
            background: #F1F5F9;
            color: #0F172A;
          }

          .error-message {
            background: #FEE2E2;
            border: 1px solid #FECACA;
            color: #DC2626;
            padding: 16px;
            margin: 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
          }

          .modal-form {
            padding: 24px;
          }

          .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
          }

          .required {
            color: #DC2626;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 12px 16px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            border-radius: 10px;
            color: #0F172A;
            font-size: 0.9375rem;
            transition: all 0.2s;
            box-sizing: border-box;
          }

          .form-group input:disabled,
          .form-group select:disabled {
            background: #F8FAFC;
            opacity: 0.7;
            cursor: not-allowed;
          }

          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #2563EB;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          .form-hint {
            margin-top: 6px;
            margin-bottom: 0;
            font-size: 0.75rem;
            color: #64748B;
          }

          .color-input-wrapper {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .color-input {
            width: 60px;
            height: 44px;
            padding: 4px;
            cursor: pointer;
          }

          .color-text-input {
            flex: 1;
          }

          .roles-checkboxes {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
            padding: 16px;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            max-height: 200px;
            overflow-y: auto;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-weight: 500;
            color: #334155;
            font-size: 0.875rem;
          }

          .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #2563EB;
            margin: 0;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #E2E8F0;
          }

          .btn-secondary {
            padding: 12px 24px;
            background: #FFFFFF;
            color: #475569;
            border: 1px solid #CBD5E1;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary:hover:not(:disabled) {
            background: #F8FAFC;
            border-color: #94A3B8;
          }

          .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-primary {
            padding: 12px 24px;
            background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
