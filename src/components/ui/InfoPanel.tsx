import { useMemo, useState, useCallback } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { useInstitutions } from '../../hooks/useInstitutions';
import type { InstitutionFeature, MajorsData } from '../../types';
import './InfoPanel.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// Detect which university system a feature belongs to
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

// ── Component ─────────────────────────────────────────────────────────────────
interface InfoPanelProps {}

export function InfoPanel(_props: InfoPanelProps) {
  const { selectedId, setSelectedId } = useFilterStore();
  const { data } = useInstitutions();
  const [accordionOpen, setAccordionOpen] = useState(false);

  const feature: InstitutionFeature | null = useMemo(() => {
    if (!selectedId || !data) return null;
    return data.features.find((f, i) => {
      const eid = f.properties.id !== null ? `inst-${f.properties.id}` : `inst-idx-${i}`;
      return eid === selectedId;
    }) ?? null;
  }, [selectedId, data]);

  // Reset accordion when selection changes
  useMemo(() => { setAccordionOpen(false); }, [selectedId]);

  // System fly-to (viewer not directly available here — we use a custom event approach)
  // We keep this as a no-op display only; the actual fly-to is wired in App if needed.
  // For now the link triggers a custom DOM event the Sidebar can listen to.
  const flyToSystem = useCallback((keywords: string[]) => {
    window.dispatchEvent(new CustomEvent('fly-to-system', { detail: { keywords } }));
  }, []);

  if (!feature) return null;

  const p = feature.properties;
  const system = detectSystem(p.name);

  const subLine = [p.city, p.ownership, p.level, p.accreditor].filter(Boolean).join(' · ');

  return (
    <div className="info-panel">
      <button className="info-close" onClick={() => setSelectedId(null)} aria-label="Close">✕</button>

      {/* ── Header ── */}
      <div className="ip-header">
        <div className="ip-badge-row">
          <span className={`ip-badge ip-badge--${p.active ? 'active' : 'closed'}`}>
            {p.active ? 'Active' : 'Closed'}
          </span>
          <span className={`ip-badge ip-badge--${p.is_main_campus ? 'main' : 'branch'}`}>
            {p.is_main_campus ? 'Main Campus' : 'Branch'}
          </span>
        </div>

        <h2 className="ip-name">{p.name}</h2>

        <p className="ip-subline">{subLine}</p>

        {p.website && (
          <a href={p.website} target="_blank" rel="noreferrer" className="ip-website">
            ↗ {new URL(p.website).hostname.replace('www.', '')}
          </a>
        )}
      </div>

      {/* ── Stats 2×2 Grid ── */}
      <div className="ip-stats-grid">
        <div className="ip-stat-cell">
          <span className="ip-stat-label">Enrollment</span>
          <span className="ip-stat-value">{p.enrollment !== null ? p.enrollment.toLocaleString() : '—'}</span>
        </div>
        <div className="ip-stat-cell">
          <span className="ip-stat-label">Completion Rate</span>
          <span className="ip-stat-value">{pct(p.completion_rate)}</span>
        </div>
        <div className="ip-stat-cell">
          <span className="ip-stat-label">Avg Net Price</span>
          <span className="ip-stat-value">{fmt(p.avg_net_price, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
        </div>
        <div className="ip-stat-cell">
          <span className="ip-stat-label">Median Earnings (10yr)</span>
          <span className="ip-stat-value">{fmt(p.median_earnings_10yr, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* ── Academic Programs Accordion ── */}
      <div className="ip-accordion">
        <button
          className="ip-accordion-trigger"
          onClick={() => setAccordionOpen((v) => !v)}
          aria-expanded={accordionOpen}
        >
          <span className="ip-accordion-label">Academic Programs</span>
          <span className="ip-accordion-toggle">{accordionOpen ? '↑' : '↓'}</span>
        </button>

        <div className={`ip-accordion-body ${accordionOpen ? 'open' : ''}`}>
          {/* Program rows */}
          {(Object.keys(MAJOR_LABELS) as Array<keyof MajorsData>).map((key) => {
            const text = p.majors?.[key];
            return (
              <div key={key} className="ip-program-row">
                <span className="ip-program-field">{MAJOR_LABELS[key]}</span>
                <span className="ip-program-text">{text ? text.trim() : '—'}</span>
              </div>
            );
          })}

          {/* Secondary stats inside accordion */}
          <div className="ip-secondary-stats-header">Additional Data</div>
          <div className="ip-secondary-stats">
            <div className="ip-sec-stat">
              <span className="ip-sec-label">Admission Rate</span>
              <span className="ip-sec-value">{pct(p.admission_rate)}</span>
            </div>
            <div className="ip-sec-stat">
              <span className="ip-sec-label">In-State Tuition</span>
              <span className="ip-sec-value">{fmt(p.tuition_in_state, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
            </div>
            <div className="ip-sec-stat">
              <span className="ip-sec-label">Median Debt</span>
              <span className="ip-sec-value">{fmt(p.median_debt, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Footer ── */}
      <div className="ip-system-footer">
        {system ? (
          <>
            <span className="ip-system-label">Part of {system.label}</span>
            <button
              className="ip-system-link"
              onClick={() => flyToSystem(system.keywords)}
            >
              ↗ View all {system.key ?? system.label.replace('Sistema ', '')} campuses
            </button>
          </>
        ) : (
          <span className="ip-system-label">Independent institution</span>
        )}
      </div>

      {/* ── Attribution ── */}
      <div className="ip-attribution">
        Data: IPEDS / College Scorecard · Coordinates: NCES EDGE
      </div>
    </div>
  );
}
