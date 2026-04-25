import { useFilterStore } from '../../store/filterStore';
import './IntroScreen.css';

export function IntroScreen() {
  const { setAppMode } = useFilterStore();

  return (
    <div className="intro-overlay">
      <div className="intro-card">
        {/* Left panel */}
        <div className="intro-left">
          <div>
            <div className="intro-flag-stripes">
              <div className="intro-stripe-red" />
              <div className="intro-stripe-white" />
              <div className="intro-stripe-blue" />
            </div>
            <p className="intro-eyebrow">Higher Education Map</p>
            <h1 className="intro-title">
              Puerto<br />
              <span className="intro-title-blue">Rico</span>
            </h1>
            <p className="intro-description">
              Every college and university across the island — explore by program, system, and campus type.
            </p>
          </div>

          <div className="intro-stats">
            <div className="intro-stat-row">
              <span className="intro-stat-num">43</span>
              <div className="intro-stat-divider" />
              <span className="intro-stat-label">institutions across<br />the island</span>
            </div>
            <div className="intro-stat-row">
              <span className="intro-stat-num">124k</span>
              <div className="intro-stat-divider" />
              <span className="intro-stat-label">total enrolled<br />students</span>
            </div>
            <div className="intro-stat-row">
              <span className="intro-stat-num">4</span>
              <div className="intro-stat-divider" />
              <span className="intro-stat-label">major university<br />systems</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="intro-right">
          <p className="intro-right-heading">How would you like to explore?</p>
          <p className="intro-right-sub">Choose a mode to get started.</p>

          <div className="intro-option" onClick={() => setAppMode('wizard')}>
            <div className="intro-option-icon intro-option-icon--tour" />
            <div className="intro-option-text">
              <span className="intro-option-label">Guided tour</span>
              <span className="intro-option-sublabel">Filter by program, then fly to each campus</span>
            </div>
            <span className="intro-option-arrow">→</span>
          </div>

          <div className="intro-option" onClick={() => setAppMode('explore')}>
            <div className="intro-option-icon intro-option-icon--explore" />
            <div className="intro-option-text">
              <span className="intro-option-label">Explore the map</span>
              <span className="intro-option-sublabel">Browse freely, click any campus to learn more</span>
            </div>
            <span className="intro-option-arrow">→</span>
          </div>

          <p className="intro-attribution">Data: IPEDS · College Scorecard · NCES EDGE</p>
        </div>
      </div>
    </div>
  );
}
