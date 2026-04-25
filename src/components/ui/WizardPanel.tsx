import { useCallback } from 'react';
import * as Cesium from 'cesium';
import { useFilterStore } from '../../store/filterStore';
import { useInstitutions } from '../../hooks/useInstitutions';
import './WizardPanel.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function ownershipColor(o: string): string {
  if (o === 'Public') return '#00205B';
  if (o === 'Private Non-Profit') return '#41B6E6';
  return '#8B634B';
}

const PROGRAMS = [
  { key: 'filterNursing',     label: 'Nursing' },
  { key: 'filterEngineering', label: 'Engineering' },
  { key: 'filterHumanities',  label: 'Humanities' },
  { key: 'filterBusiness',    label: 'Business' },
  { key: 'filterGrad',        label: 'Grad Programs' },
  { key: '__sciences__',      label: 'Sciences' },   // display-only placeholder
] as const;

type ProgramKey = typeof PROGRAMS[number]['key'];

interface WizardPanelProps {
  viewer: Cesium.Viewer | null;
}

// ── Shared sub-component: CampusRow ──────────────────────────────────────────
function dispatchFlyToCampus(lon: number, lat: number) {
  window.dispatchEvent(new CustomEvent('fly-to-campus', { detail: { coordinates: [lon, lat] } }));
}

// ── WizardPanel ──────────────────────────────────────────────────────────────
export function WizardPanel({ viewer }: WizardPanelProps) {
  const {
    appMode, setAppMode,
    showPublic, showPrivateNonProfit, showPrivateForProfit,
    filterNursing, filterEngineering, filterHumanities, filterBusiness, filterGrad,
    activeOnly, mainCampusOnly,
    selectedId, setSelectedId,
    tourIndex, setTourIndex,
    setFilter,
  } = useFilterStore();

  const { data, filtered } = useInstitutions();

  const filterValues: Record<string, boolean> = {
    filterNursing, filterEngineering, filterHumanities, filterBusiness, filterGrad,
  };

  // Count by ownership from all data
  const ownershipCounts = {
    Public: data.features.filter(f => f.properties.ownership === 'Public').length,
    'Private Non-Profit': data.features.filter(f => f.properties.ownership === 'Private Non-Profit').length,
    'Private For-Profit': data.features.filter(f => f.properties.ownership === 'Private For-Profit').length,
  };

  // Active filter tag names
  const activeFilterLabels: { label: string; remove: () => void }[] = [];
  if (filterNursing)     activeFilterLabels.push({ label: 'Nursing',      remove: () => setFilter('filterNursing',     false) });
  if (filterEngineering) activeFilterLabels.push({ label: 'Engineering',  remove: () => setFilter('filterEngineering', false) });
  if (filterHumanities)  activeFilterLabels.push({ label: 'Humanities',   remove: () => setFilter('filterHumanities',  false) });
  if (filterBusiness)    activeFilterLabels.push({ label: 'Business',     remove: () => setFilter('filterBusiness',    false) });
  if (filterGrad)        activeFilterLabels.push({ label: 'Grad',         remove: () => setFilter('filterGrad',        false) });
  if (!showPublic)       activeFilterLabels.push({ label: 'No Public',    remove: () => setFilter('showPublic',        true)  });
  if (!showPrivateNonProfit) activeFilterLabels.push({ label: 'No Non-Profit', remove: () => setFilter('showPrivateNonProfit', true) });
  if (!showPrivateForProfit) activeFilterLabels.push({ label: 'No For-Profit', remove: () => setFilter('showPrivateForProfit', true) });
  if (mainCampusOnly)    activeFilterLabels.push({ label: 'Main only',    remove: () => setFilter('mainCampusOnly',   false) });
  if (activeOnly)        activeFilterLabels.push({ label: 'Active only',  remove: () => setFilter('activeOnly',       false) });

  // Fly-to helpers
  const flyToSystem = useCallback((keywords: string[]) => {
    if (!viewer) return;
    const matches = data.features.filter(f =>
      keywords.some(kw => f.properties.name.toLowerCase().includes(kw))
    );
    if (matches.length === 0) return;
    const positions = matches.map(f =>
      Cesium.Cartesian3.fromDegrees(f.geometry.coordinates[0], f.geometry.coordinates[1], 0)
    );
    const sphere = Cesium.BoundingSphere.fromPoints(positions);
    sphere.radius = Math.max(sphere.radius * 1.4, 25000);
    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 2,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-35), 0),
    });
  }, [viewer, data]);

  // Keep reference to suppress unused warning
  void flyToSystem;

  const selectByIndex = useCallback((idx: number) => {
    const inst = filtered[idx];
    if (!inst) return;
    const eid = inst.properties.id !== null
      ? `inst-${inst.properties.id}`
      : `inst-idx-${data.features.indexOf(inst)}`;
    setTourIndex(idx);
    setSelectedId(eid);
    const [lon, lat] = inst.geometry.coordinates;
    dispatchFlyToCampus(lon, lat);
  }, [filtered, data, setTourIndex, setSelectedId]);

  // ── WIZARD mode ─────────────────────────────────────────────────────────────
  if (appMode === 'wizard') {
    return (
      <div className="wizard-panel">
        {/* Header */}
        <div className="wiz-header">
          <div className="wiz-steps">
            <div className="wiz-step-bar wiz-step-bar--done" />
            <div className="wiz-step-bar wiz-step-bar--current" />
            <div className="wiz-step-bar wiz-step-bar--future" />
          </div>
          <p className="wiz-step-label">Step 2 of 3 — Programs</p>
          <h2 className="wiz-title">What are you looking for?</h2>
          <span className="wiz-match-count">{filtered.length} matching</span>
        </div>

        {/* Body */}
        <div className="wiz-body">
          {/* Ownership */}
          <p className="wiz-section-label">Ownership</p>
          <div className="wiz-ownership-grid">
            {/* Public */}
            <div
              className={`wiz-own-card ${showPublic ? 'selected' : ''}`}
              onClick={() => setFilter('showPublic', !showPublic)}
            >
              <div className="wiz-own-dot" style={{ background: '#00205B' }} />
              <span className="wiz-own-name">Public</span>
              <span className="wiz-own-count">{ownershipCounts.Public}</span>
            </div>
            {/* Private Non-Profit */}
            <div
              className={`wiz-own-card ${showPrivateNonProfit ? 'selected' : ''}`}
              onClick={() => setFilter('showPrivateNonProfit', !showPrivateNonProfit)}
            >
              <div className="wiz-own-dot" style={{ background: '#41B6E6' }} />
              <span className="wiz-own-name">Non-Profit</span>
              <span className="wiz-own-count">{ownershipCounts['Private Non-Profit']}</span>
            </div>
            {/* Private For-Profit */}
            <div
              className={`wiz-own-card ${showPrivateForProfit ? 'selected' : ''}`}
              onClick={() => setFilter('showPrivateForProfit', !showPrivateForProfit)}
            >
              <div className="wiz-own-dot" style={{ background: '#8B634B' }} />
              <span className="wiz-own-name">For-Profit</span>
              <span className="wiz-own-count">{ownershipCounts['Private For-Profit']}</span>
            </div>
          </div>

          {/* Programs */}
          <p className="wiz-section-label">Programs</p>
          <div className="wiz-programs-grid">
            {PROGRAMS.map(({ key, label }) => {
              const isPlaceholder = key === '__sciences__';
              const active = isPlaceholder ? false : filterValues[key] ?? false;
              return (
                <div
                  key={key}
                  className={`wiz-prog-card ${active ? 'selected' : ''}`}
                  onClick={() => {
                    if (!isPlaceholder) {
                      setFilter(key as Parameters<typeof setFilter>[0], !filterValues[key]);
                    }
                  }}
                  style={isPlaceholder ? { opacity: 0.45, cursor: 'default' } : undefined}
                >
                  <div
                    className="wiz-prog-dot"
                    style={{ background: active ? '#C8102E' : '#d8dce8' }}
                  />
                  <span className="wiz-prog-name">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Display options */}
          <p className="wiz-section-label">Display</p>
          <div className="wiz-toggle-rows">
            <div className="wiz-toggle-row">
              <span className="wiz-toggle-label">Main campuses only</span>
              <div
                className={`wiz-switch ${mainCampusOnly ? 'on' : 'off'}`}
                onClick={() => setFilter('mainCampusOnly', !mainCampusOnly)}
              >
                <div className="wiz-switch-thumb" />
              </div>
            </div>
            <div className="wiz-toggle-row">
              <span className="wiz-toggle-label">Active institutions only</span>
              <div
                className={`wiz-switch ${activeOnly ? 'on' : 'off'}`}
                onClick={() => setFilter('activeOnly', !activeOnly)}
              >
                <div className="wiz-switch-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="wiz-footer">
          <button className="wiz-back-btn" onClick={() => setAppMode('intro')}>← Back</button>
          <button
            className="wiz-primary-btn"
            onClick={() => { setAppMode('results'); setTourIndex(0); if (filtered.length > 0) selectByIndex(0); }}
          >
            See {filtered.length} matching campuses →
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS mode ─────────────────────────────────────────────────────────────
  const currentInst = filtered[tourIndex];
  const activeProgramNames = [
    filterNursing && 'Nursing',
    filterEngineering && 'Engineering',
    filterHumanities && 'Humanities',
    filterBusiness && 'Business',
    filterGrad && 'Grad',
  ].filter(Boolean) as string[];
  const resultsTitle = activeProgramNames.length > 0 ? activeProgramNames.join(' · ') : 'All Programs';

  return (
    <div className="wizard-panel">
      {/* Results header */}
      <div className="res-header">
        <button className="res-back-btn" onClick={() => setAppMode('wizard')}>← Filters</button>
        <span className="res-title">{resultsTitle}</span>
        <span className="res-count-badge">{filtered.length}</span>
      </div>

      {/* Active filter tags */}
      {activeFilterLabels.length > 0 && (
        <div className="res-tags">
          {activeFilterLabels.map(({ label, remove }) => (
            <div key={label} className="res-tag">
              {label}
              <button className="res-tag-x" onClick={remove}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Institution list */}
      <div className="res-list">
        {filtered.map((inst, idx) => {
          const eid = inst.properties.id !== null
            ? `inst-${inst.properties.id}`
            : `inst-idx-${data.features.indexOf(inst)}`;
          const isActive = idx === tourIndex && eid === selectedId;
          return (
            <div
              key={eid}
              className={`res-inst-row ${isActive ? 'active' : ''}`}
              onClick={() => selectByIndex(idx)}
            >
              <span
                className="res-inst-dot"
                style={{ background: ownershipColor(inst.properties.ownership) }}
              />
              <span className="res-inst-name">{inst.properties.name}</span>
              <div className="res-inst-meta">
                <span className="res-inst-city">{inst.properties.city}</span>
                {inst.properties.enrollment && (
                  <span className="res-inst-enroll">{inst.properties.enrollment.toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tour nav bar */}
      <div className="res-tour-nav">
        <div className="res-tour-top">
          <div className="res-tour-info">
            <span className="res-tour-label">
              Now viewing — {tourIndex + 1} of {filtered.length}
            </span>
            <span className="res-tour-name">
              {currentInst?.properties.name ?? '—'}
            </span>
          </div>
          <div className="res-tour-btns">
            <button
              className="res-nav-btn res-nav-btn--prev"
              disabled={tourIndex === 0}
              onClick={() => selectByIndex(tourIndex - 1)}
            >
              ← Prev
            </button>
            <button
              className="res-nav-btn res-nav-btn--next"
              disabled={tourIndex >= filtered.length - 1}
              onClick={() => selectByIndex(tourIndex + 1)}
            >
              Next →
            </button>
          </div>
        </div>
        <div className="res-tour-progress-track">
          <div
            className="res-tour-progress-fill"
            style={{ width: `${filtered.length > 0 ? ((tourIndex + 1) / filtered.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Suppress unused import warning for ProgramKey
type _PK = ProgramKey;
void (null as unknown as _PK);
