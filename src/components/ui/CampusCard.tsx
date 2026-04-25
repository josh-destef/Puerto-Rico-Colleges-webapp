import { useState, useMemo } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { useInstitutions } from '../../hooks/useInstitutions';
import type { MajorsData } from '../../types';
import './CampusCard.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null, opts: Intl.NumberFormatOptions): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', opts).format(n);
}
function pct(n: number | null): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

const MAJOR_LABELS: Record<keyof MajorsData, string> = {
  nursing: 'Nursing',
  engineering: 'Engineering',
  humanities: 'Humanities',
  social_sciences: 'Social Sci.',
  bench_sciences: 'Sciences',
  business: 'Business',
  pre_law: 'Pre-Law',
  miscellaneous: 'Other',
  grad_programs: 'Graduate',
};

function detectSystem(name: string): { label: string; keywords: string[] } | null {
  const n = name.toLowerCase();
  if (n.includes('university of puerto rico') || /\bupr\b/.test(n))
    return { label: 'Sistema UPR', keywords: ['university of puerto rico', 'upr '] };
  if (n.includes('interamerican') || n.includes('inter american'))
    return { label: 'Sistema Inter', keywords: ['interamerican', 'inter american', 'inter '] };
  if (n.includes('uagm') || n.includes('ana g') || n.includes('turabo') || n.includes('del este'))
    return { label: 'Sistema UAGM', keywords: ['uagm', 'ana g. méndez', 'ana g mendez', 'universidad del este', 'turabo', 'metro'] };
  if (n.includes('pontificia') || n.includes('pontifical') || n.includes('pucpr'))
    return { label: 'Sistema PUCPR', keywords: ['pontificia', 'pontifical catholic'] };
  return null;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface CampusCardProps {
  /** If true, the card spans full width (explore mode). Default: offset by 340px (wizard/results). */
  fullWidth?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CampusCard({ fullWidth = false }: CampusCardProps) {
  const { selectedId, setSelectedId } = useFilterStore();
  const { data } = useInstitutions();
  const [accordionOpen, setAccordionOpen] = useState(false);

  const feature = useMemo(() => {
    if (!selectedId) return null;
    return data.features.find((f, i) => {
      const eid = f.properties.id !== null ? `inst-${f.properties.id}` : `inst-idx-${i}`;
      return eid === selectedId;
    }) ?? null;
  }, [selectedId, data]);

  if (!feature) return null;

  const p = feature.properties;
  const system = detectSystem(p.name);
  const subLine = [p.city, p.ownership, p.level, p.accreditor].filter(Boolean).join(' · ');

  // Branch campuses of this institution (only populated when this is a main campus)
  const branches = useMemo(() => {
    if (!feature) return [];
    return data.features.filter(
      (f) => f.properties.parent_id === feature.properties.id
        && f.properties.id !== feature.properties.id
    );
  }, [data, feature]);

  // Parent campus (only when this is a branch)
  const parentCampus = useMemo(() => {
    if (!feature || feature.properties.is_main_campus || feature.properties.parent_id === null) return null;
    return data.features.find((f) => f.properties.id === feature.properties.parent_id) ?? null;
  }, [data, feature]);

  const leftOffset = fullWidth ? 0 : 340;

  return (
    <div
      className="campus-card"
      style={{ left: leftOffset }}
    >
      <div className="campus-card-accent" />

      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          <div className="cc-badge-row">
            <span className={`cc-badge cc-badge--${p.active ? 'active' : 'closed'}`}>
              {p.active ? 'Active' : 'Closed'}
            </span>
            <span className={`cc-badge cc-badge--${p.is_main_campus ? 'main' : 'branch'}`}>
              {p.is_main_campus ? 'Main Campus' : 'Branch'}
            </span>
          </div>
          <div className="cc-name">{p.name}</div>
          <div className="cc-subline">{subLine}</div>
        </div>
        <div className="cc-header-right">
          {p.website && (
            <a href={p.website} target="_blank" rel="noreferrer" className="cc-website">
              ↗ website
            </a>
          )}
          <button className="cc-close" onClick={() => setSelectedId(null)} aria-label="Close">×</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="cc-stats">
        <div className="cc-stat-cell">
          <span className="cc-stat-label">Enrollment</span>
          <span className="cc-stat-value">
            {p.enrollment !== null ? p.enrollment.toLocaleString() : '—'}
          </span>
        </div>
        <div className="cc-stat-cell">
          <span className="cc-stat-label">Completion Rate</span>
          <span className="cc-stat-value">{pct(p.completion_rate)}</span>
        </div>
        <div className="cc-stat-cell">
          <span className="cc-stat-label">Avg Net Price</span>
          <span className="cc-stat-value">
            {fmt(p.avg_net_price, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="cc-stat-cell">
          <span className="cc-stat-label">Median Earnings (10yr)</span>
          <span className="cc-stat-value">
            {fmt(p.median_earnings_10yr, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Programs accordion */}
      <div className="cc-accordion">
        <button
          className="cc-accordion-trigger"
          onClick={() => setAccordionOpen(v => !v)}
          aria-expanded={accordionOpen}
        >
          <span className="cc-accordion-title">Academic Programs</span>
          <span className="cc-accordion-toggle">{accordionOpen ? 'collapse ↑' : 'expand ↓'}</span>
        </button>
        <div className={`cc-accordion-body ${accordionOpen ? 'open' : ''}`}>
          {(Object.keys(MAJOR_LABELS) as Array<keyof MajorsData>).map(key => {
            const text = p.majors?.[key];
            return (
              <div key={key} className="cc-prog-row">
                <span className="cc-prog-field">{MAJOR_LABELS[key]}</span>
                <span className={`cc-prog-value ${text ? '' : 'empty'}`}>
                  {text ? text.trim() : '—'}
                </span>
              </div>
            );
          })}
          <div className="cc-secondary-label">Additional Data</div>
          <div className="cc-secondary-row">
            <div className="cc-sec-cell">
              <span className="cc-sec-label">Admission Rate</span>
              <span className="cc-sec-value">{pct(p.admission_rate)}</span>
            </div>
            <div className="cc-sec-cell">
              <span className="cc-sec-label">In-State Tuition</span>
              <span className="cc-sec-value">
                {fmt(p.tuition_in_state, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="cc-sec-cell">
              <span className="cc-sec-label">Median Debt</span>
              <span className="cc-sec-value">
                {fmt(p.median_debt, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back-to-main-campus link (branch view only) */}
      {parentCampus && (
        <button
          className="dc-branch-btn"
          style={{ margin: '10px 16px 0', width: 'calc(100% - 32px)' }}
          onClick={() => {
            const parentEntityId = `inst-${parentCampus.properties.id}`;
            setSelectedId(parentEntityId);
            const [pLon, pLat] = parentCampus.geometry.coordinates;
            window.dispatchEvent(
              new CustomEvent('fly-to-campus', { detail: { coordinates: [pLon, pLat] } })
            );
          }}
        >
          <span className="dc-branch-dot" style={{ background: '#00205B' }} />
          <span className="dc-branch-name">← Main campus: {parentCampus.properties.city}</span>
          <span className="dc-branch-arrow">→</span>
        </button>
      )}

      {/* System footer */}
      <div className="cc-system-footer">
        {system ? (
          <>
            <span className="cc-system-label">Part of {system.label}</span>
            <button
              className="cc-system-link"
              onClick={() => window.dispatchEvent(new CustomEvent('fly-to-system', { detail: { keywords: system.keywords } }))}
            >
              ↗ View all {system.label.replace('Sistema ', '')} campuses
            </button>
          </>
        ) : (
          <span className="cc-system-label">Independent institution</span>
        )}
      </div>

      {/* Branch campuses (main campus view only) */}
      {branches.length > 0 && (
        <div className="dc-branches">
          <div className="dc-branches-label">Branch campuses ({branches.length})</div>
          <div className="dc-branches-list">
            {branches.map((branch) => (
              <button
                key={branch.properties.id ?? branch.properties.name}
                className="dc-branch-btn"
                onClick={() => {
                  const branchEntityId = branch.properties.id !== null
                    ? `inst-${branch.properties.id}`
                    : null;
                  if (branchEntityId) setSelectedId(branchEntityId);
                  const [bLon, bLat] = branch.geometry.coordinates;
                  window.dispatchEvent(
                    new CustomEvent('fly-to-campus', { detail: { coordinates: [bLon, bLat] } })
                  );
                }}
              >
                <span className="dc-branch-dot" />
                <span className="dc-branch-name">{branch.properties.name}</span>
                <span className="dc-branch-city">{branch.properties.city}</span>
                <span className="dc-branch-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
