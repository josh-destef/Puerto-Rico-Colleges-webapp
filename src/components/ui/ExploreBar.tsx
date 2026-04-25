import { useFilterStore } from '../../store/filterStore';
import './ExploreBar.css';

export function ExploreBar() {
  const { setAppMode, setSearchQuery } = useFilterStore();

  return (
    <div className="explore-bar">
      {/* Wordmark */}
      <div className="eb-wordmark">
        <span className="eb-wordmark-primary">Puerto Rico</span>
        <span className="eb-wordmark-sub">Higher Education</span>
      </div>

      {/* Search */}
      <input
        className="eb-search"
        type="text"
        placeholder="Search campuses…"
        spellCheck={false}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Action buttons */}
      <div className="eb-actions">
        <button className="eb-btn" onClick={() => setAppMode('wizard')}>
          Filters
        </button>
        <button className="eb-btn eb-btn--tour" onClick={() => setAppMode('results')}>
          Tour mode
        </button>
      </div>
    </div>
  );
}
