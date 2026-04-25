import { useInstitutions } from '../../hooks/useInstitutions';
import './BottomBar.css';

function fmt(n: number | null, opts: Intl.NumberFormatOptions): string {
  if (n === null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', opts).format(n);
}

export function BottomBar() {
  const { aggregates, filtered } = useInstitutions();
  const { totalEnrollment, avgNetPrice, avgEarnings } = aggregates;
  const totalVisible = filtered.length;

  return (
    <div className="bottom-bar">
      <div className="bs">
        <span className="bs-label">Institutions Shown</span>
        <span className="bs-value">{totalVisible}</span>
      </div>
      <div className="bs-divider" />
      <div className="bs">
        <span className="bs-label">Total Enrollment</span>
        <span className="bs-value">
          {fmt(totalEnrollment, { notation: 'compact', compactDisplay: 'short' })}
        </span>
      </div>
      <div className="bs-divider" />
      <div className="bs">
        <span className="bs-label">Avg Net Price</span>
        <span className="bs-value">
          {fmt(avgNetPrice, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="bs-divider" />
      <div className="bs">
        <span className="bs-label">Avg Earnings (10yr)</span>
        <span className="bs-value">
          {fmt(avgEarnings, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
