import { useState, useEffect } from 'react';
import * as Cesium from 'cesium';
import { GlobeViewer } from './components/globe/GlobeViewer';
import { cameraOriginForTarget } from './utils/cesium';
import { IntroScreen } from './components/ui/IntroScreen';
import { WizardPanel } from './components/ui/WizardPanel';
import { CampusCard } from './components/ui/CampusCard';
import { ExploreBar } from './components/ui/ExploreBar';
import { useFilterStore } from './store/filterStore';
import { useInstitutions } from './hooks/useInstitutions';
import './App.css';

function App() {
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const { appMode, selectedId } = useFilterStore();
  const { data } = useInstitutions();

  // Fly-to-campus event (dispatched from WizardPanel tour nav)
  useEffect(() => {
    if (!viewer) return;
    const handler = (e: Event) => {
      const { coordinates } = (e as CustomEvent<{ coordinates: [number, number] }>).detail;
      const [lon, lat] = coordinates;
      const ALTITUDE = 1200;
      const PITCH_DEG = -30;
      const [camLon, camLat] = cameraOriginForTarget(lon, lat, ALTITUDE, PITCH_DEG);
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(camLon, camLat, ALTITUDE),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(PITCH_DEG),
          roll: 0,
        },
        duration: 1.8,
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
      });
    };
    window.addEventListener('fly-to-campus', handler);
    return () => window.removeEventListener('fly-to-campus', handler);
  }, [viewer]);

  // Fly-to-system event (dispatched from CampusCard system footer)
  useEffect(() => {
    if (!viewer || !data) return;
    const handler = (e: Event) => {
      const { keywords } = (e as CustomEvent<{ keywords: string[] }>).detail;
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
    };
    window.addEventListener('fly-to-system', handler);
    return () => window.removeEventListener('fly-to-system', handler);
  }, [viewer, data]);

  // Return to birds-eye view when navigating back to intro
  useEffect(() => {
    if (!viewer || appMode !== 'intro') return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-66.5, 18.22, 180000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.5,
    });
  }, [viewer, appMode]);

  return (
    <div className="app-root">
      <GlobeViewer onReady={setViewer} />
      {appMode === 'intro' && <IntroScreen />}
      {(appMode === 'wizard' || appMode === 'results') && <WizardPanel viewer={viewer} />}
      {appMode === 'results' && selectedId && <CampusCard />}
      {appMode === 'explore' && <ExploreBar />}
      {appMode === 'explore' && selectedId && <CampusCard fullWidth />}
    </div>
  );
}

export default App;
