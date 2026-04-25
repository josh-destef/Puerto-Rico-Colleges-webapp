import { useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { useFilterStore } from '../../store/filterStore';
import { useInstitutions } from '../../hooks/useInstitutions';
import './Sidebar.css';

const SYSTEMS: { key: string; label: string; keywords: string[] }[] = [
  { key: 'UPR', label: 'Sistema UPR', keywords: ['university of puerto rico', 'upr '] },
  { key: 'Inter', label: 'Sistema Inter', keywords: ['interamerican', 'inter american', 'inter '] },
  { key: 'UAGM', label: 'Sistema UAGM / Ana G. Méndez', keywords: ['uagm', 'ana g. méndez', 'ana g mendez', 'universidad del este', 'turabo', 'metro'] },
  { key: 'PUCPR', label: 'Sistema PUCPR', keywords: ['pontificia', 'pontifical catholic'] },
];

const PROGRAM_PILLS = [
  { key: 'filterNursing',     label: 'Nursing',        color: '#c07a8a', bg: 'rgba(192,122,138,0.12)', border: 'rgba(192,122,138,0.3)' },
  { key: 'filterEngineering', label: 'Engineering',    color: '#6a90b8', bg: 'rgba(106,144,184,0.12)', border: 'rgba(106,144,184,0.3)' },
  { key: 'filterHumanities',  label: 'Humanities',     color: '#b89456', bg: 'rgba(184,148,86,0.12)',  border: 'rgba(184,148,86,0.3)'  },
  { key: 'filterBusiness',    label: 'Business',       color: '#5a9070', bg: 'rgba(90,144,112,0.12)',  border: 'rgba(90,144,112,0.3)'  },
  { key: 'filterGrad',        label: 'Grad Programs',  color: '#8070a8', bg: 'rgba(128,112,168,0.12)', border: 'rgba(128,112,168,0.3)' },
];

interface SidebarProps {
  viewer: Cesium.Viewer | null;
}

export function Sidebar({ viewer }: SidebarProps) {
  const {
    showPublic, showPrivateNonProfit, showPrivateForProfit,
    filterNursing, filterEngineering, filterHumanities, filterBusiness, filterGrad,
    activeOnly, mainCampusOnly,
    setFilter, resetFilters,
  } = useFilterStore();

  const { data, filtered } = useInstitutions();
  const [searchQuery, setSearchQuery] = useState('');

  const filterValues: Record<string, boolean> = {
    filterNursing, filterEngineering, filterHumanities, filterBusiness, filterGrad,
  };

  const flyToSystem = useCallback((keywords: string[]) => {
    if (!viewer || !data) return;
    const matches = data.features.filter((f) =>
      keywords.some((kw) => f.properties.name.toLowerCase().includes(kw))
    );
    if (matches.length === 0) return;
    const positions = matches.map((f) =>
      Cesium.Cartesian3.fromDegrees(f.geometry.coordinates[0], f.geometry.coordinates[1], 0)
    );
    const sphere = Cesium.BoundingSphere.fromPoints(positions);
    sphere.radius = Math.max(sphere.radius * 1.4, 25000);
    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 2,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-35), 0),
    });
  }, [viewer, data]);

  // Counts per ownership type (from all data, not filtered)
  const ownershipCounts = {
    Public: data?.features.filter(f => f.properties.ownership === 'Public').length ?? 0,
    'Private Non-Profit': data?.features.filter(f => f.properties.ownership === 'Private Non-Profit').length ?? 0,
    'Private For-Profit': data?.features.filter(f => f.properties.ownership === 'Private For-Profit').length ?? 0,
  };

  const activeCount = filtered.filter((f) => f.properties.active).length;

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h1 className="sidebar-title">Puerto Rico</h1>
        <p className="sidebar-subtitle">Higher Education Map</p>
        <div className="sidebar-count-line">
          <span className="sidebar-count-num">{activeCount}</span>
          <span className="sidebar-count-label">&nbsp;active institutions</span>
        </div>
        {/* Search */}
        <input
          className="sidebar-search"
          type="text"
          placeholder="Search campuses…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Ownership */}
      <div className="sidebar-section">
        <div className="section-label">Ownership</div>
        <div className="ownership-rows">
          <div
            className={`ownership-row ${showPublic ? 'active' : 'dimmed'}`}
            onClick={() => setFilter('showPublic', !showPublic)}
          >
            <span className="ownership-dot" style={{ background: '#4a7fd4' }} />
            <span className="ownership-name">Public</span>
            <span className="ownership-count">{ownershipCounts.Public}</span>
          </div>
          <div
            className={`ownership-row ${showPrivateNonProfit ? 'active' : 'dimmed'}`}
            onClick={() => setFilter('showPrivateNonProfit', !showPrivateNonProfit)}
          >
            <span className="ownership-dot" style={{ background: '#2aa87e' }} />
            <span className="ownership-name">Private Non-Profit</span>
            <span className="ownership-count">{ownershipCounts['Private Non-Profit']}</span>
          </div>
          <div
            className={`ownership-row ${showPrivateForProfit ? 'active' : 'dimmed'}`}
            onClick={() => setFilter('showPrivateForProfit', !showPrivateForProfit)}
          >
            <span className="ownership-dot" style={{ background: '#c4882a' }} />
            <span className="ownership-name">Private For-Profit</span>
            <span className="ownership-count">{ownershipCounts['Private For-Profit']}</span>
          </div>
        </div>
      </div>

      {/* Programs */}
      <div className="sidebar-section">
        <div className="section-label">Programs</div>
        <div className="pill-group">
          {PROGRAM_PILLS.map(({ key, label, color, bg, border }) => {
            const active = filterValues[key];
            return (
              <button
                key={key}
                className={`program-pill ${active ? 'pill-active' : 'pill-inactive'}`}
                style={{
                  color,
                  background: active ? bg : 'transparent',
                  borderColor: active ? border : 'rgba(255,255,255,0.1)',
                  opacity: active ? 1 : 0.4,
                }}
                onClick={() => setFilter(key as Parameters<typeof setFilter>[0], !filterValues[key])}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Logic */}
      <div className="sidebar-section">
        <div className="section-label">Display</div>
        <div className="logic-rows">
          <div className="toggle-row">
            <span className="toggle-label">Active Only</span>
            <div
              className={`toggle-switch ${activeOnly ? 'on' : ''}`}
              onClick={() => setFilter('activeOnly', !activeOnly)}
            >
              <div className="toggle-thumb" />
            </div>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Main Campuses Only</span>
            <div
              className={`toggle-switch ${mainCampusOnly ? 'on' : ''}`}
              onClick={() => setFilter('mainCampusOnly', !mainCampusOnly)}
            >
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>
      </div>

      {/* System Navigator */}
      <div className="sidebar-section sidebar-section--grow">
        <div className="section-label">System Navigator</div>
        <div className="systems-list">
          {SYSTEMS.map(({ key, label, keywords }) => {
            const count = data?.features.filter((f) =>
              keywords.some((kw) => f.properties.name.toLowerCase().includes(kw))
            ).length ?? 0;
            return (
              <button
                key={key}
                className="system-btn"
                onClick={() => flyToSystem(keywords)}
              >
                <span className="system-name">{label}</span>
                <span className="system-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="reset-link" onClick={resetFilters}>Reset Filters</button>
      </div>
    </aside>
  );
}
