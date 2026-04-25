import { useState, useEffect } from 'react';
import * as Cesium from 'cesium';
import { GlobeViewer } from './components/globe/GlobeViewer';
import { Sidebar } from './components/ui/Sidebar';
import { BottomBar } from './components/ui/BottomBar';
import { InfoPanel } from './components/ui/InfoPanel';
import { useInstitutions } from './hooks/useInstitutions';
import './App.css';

function App() {
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const { data } = useInstitutions();

  // Listen for fly-to-system events dispatched from InfoPanel
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

  return (
    <div className="app-root">
      <GlobeViewer onReady={setViewer} />
      <Sidebar viewer={viewer} />
      <InfoPanel />
      <BottomBar />
    </div>
  );
}

export default App;
