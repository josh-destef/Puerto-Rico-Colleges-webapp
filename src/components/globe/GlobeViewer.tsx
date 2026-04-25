import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useFilterStore } from '../../store/filterStore';
import { useInstitutions } from '../../hooks/useInstitutions';
import type { InstitutionFeature } from '../../types';
import { cameraOriginForTarget } from '../../utils/cesium';

// Set Ion token from env
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN as string;

function getOwnershipColor(feature: InstitutionFeature): Cesium.Color {
  const { active, ownership } = feature.properties;
  if (!active) return Cesium.Color.fromCssColorString('#8892aa').withAlpha(0.5);
  switch (ownership) {
    case 'Public': return Cesium.Color.fromCssColorString('#00205B');
    case 'Private Non-Profit': return Cesium.Color.fromCssColorString('#41B6E6');
    case 'Private For-Profit': return Cesium.Color.fromCssColorString('#8B634B');
    default: return Cesium.Color.WHITE;
  }
}

function getMarkerSize(enrollment: number | null): number {
  if (!enrollment) return 14;
  if (enrollment < 1000) return 14;
  if (enrollment < 3000) return 20;
  if (enrollment < 7000) return 28;
  if (enrollment < 15000) return 36;
  return 44;
}

function makeEntityId(feature: InstitutionFeature, index: number): string {
  return feature.properties.id !== null
    ? `inst-${feature.properties.id}`
    : `inst-idx-${index}`;
}

interface GlobeViewerProps {
  onReady?: (viewer: Cesium.Viewer) => void;
}

export function GlobeViewer({ onReady }: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const polylinesRef = useRef<Cesium.Entity[]>([]);
  const { data, filtered } = useInstitutions();
  const { selectedId, setSelectedId } = useFilterStore();

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      // Use Cesium Ion world imagery as the base (not Google Maps API)
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.IonImageryProvider.fromAssetId(2)
      ),
    });

    // Enable globe lighting and atmosphere
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.atmosphereLightIntensity = 20.0;
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
    }
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0002;

    // Pin clock to midday over Puerto Rico (UTC-4, so 16:00 UTC = noon local)
    // This keeps the sun high regardless of the user's local wall-clock time.
    const middayJulian = Cesium.JulianDate.fromIso8601('2025-06-21T16:00:00Z');
    viewer.clock.currentTime = middayJulian.clone();
    viewer.clock.shouldAnimate = false; // freeze time — sun stays put

    // Load Cesium Ion photorealistic 3D Tiles (asset ID 2275207 = Google Photorealistic via Ion)
    (async () => {
      try {
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
        viewer.scene.primitives.add(tileset);
        // Remove default globe surface to avoid z-fighting with tiles
        viewer.scene.globe.show = false;
      } catch (err) {
        console.warn('Photorealistic 3D Tiles not available, falling back to globe:', err);
        viewer.scene.globe.show = true;
      }
    })();

    // Birds-eye view of Puerto Rico for intro screen
    // pitch -90 = straight down, no forward tilt
    // Altitude ~180km fits the full island in frame
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-66.5, 18.22, 180000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 0,  // instant — no fly animation on first load
    });

    // Click handler — select + fly to campus
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position);
      if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
        const entity = picked.id as Cesium.Entity;
        const id = entity.id as string;
        if (id.startsWith('inst-')) {
          setSelectedId(id);

          // Fly to the campus at a close street-level view
          const pos = entity.position?.getValue(viewer.clock.currentTime);
          if (pos) {
            const carto = Cesium.Cartographic.fromCartesian(pos);
            const ALTITUDE = 800;
            const PITCH_DEG = -30;
            const targetLon = Cesium.Math.toDegrees(carto.longitude);
            const targetLat = Cesium.Math.toDegrees(carto.latitude);
            const [camLon, camLat] = cameraOriginForTarget(targetLon, targetLat, ALTITUDE, PITCH_DEG);
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(camLon, camLat, ALTITUDE),
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(PITCH_DEG),
                roll: 0,
              },
              duration: 1.8,
              easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
            });
          }
        }
      } else {
        setSelectedId(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    onReady?.(viewer);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add all entities when data loads
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !data) return;

    // Clear existing
    viewer.entities.removeAll();
    entitiesRef.current.clear();
    polylinesRef.current = [];

    // Build a map of id -> position for polylines
    const positionById = new Map<number, Cesium.Cartesian3>();
    data.features.forEach((f) => {
      if (f.properties.id !== null) {
        const [lon, lat] = f.geometry.coordinates;
        positionById.set(f.properties.id, Cesium.Cartesian3.fromDegrees(lon, lat, 50));
      }
    });

    data.features.forEach((feature, index) => {
      const [lon, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      const entityId = makeEntityId(feature, index);
      const color = getOwnershipColor(feature);
      const size = getMarkerSize(props.enrollment);
      const isBranch = props.flags.is_branch;

      const entity = viewer.entities.add({
        id: entityId,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 50),
        point: {
          pixelSize: size,
          color: color,
          outlineColor: isBranch
            ? Cesium.Color.WHITE.withAlpha(0.9)
            : Cesium.Color.WHITE.withAlpha(0.3),
          outlineWidth: isBranch ? 2.5 : 1,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.5, 1e6, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: props.name,
          font: '12px Inter, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -(size / 2 + 10)),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 80000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false,
        },
        // Store reference data
        properties: new Cesium.PropertyBag({ featureIndex: index }),
      });

      entitiesRef.current.set(entityId, entity);

      // Polyline for branch campuses
      if (isBranch && props.parent_id !== null) {
        const parentPos = positionById.get(props.parent_id);
        if (parentPos) {
          const branchPos = Cesium.Cartesian3.fromDegrees(lon, lat, 50);
          const lineEntity = viewer.entities.add({
            id: `line-${entityId}`,
            polyline: {
              positions: [branchPos, parentPos],
              width: 1.5,
              material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.3)),
              clampToGround: false,
            },
          });
          polylinesRef.current.push(lineEntity);
        }
      }
    });
  }, [data]);

  // Update entity visibility based on filtered set
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !data) return;

    const filteredIds = new Set(
      filtered.map((f) => makeEntityId(f, data.features.indexOf(f)))
    );

    entitiesRef.current.forEach((entity, entityId) => {
      entity.show = filteredIds.has(entityId);
    });

    // Show/hide polylines based on branch visibility
    polylinesRef.current.forEach((lineEntity) => {
      const lineId = lineEntity.id as string;
      // line-inst-xxx → check inst-xxx
      const branchId = lineId.replace('line-', '');
      lineEntity.show = filteredIds.has(branchId);
    });
  }, [filtered, data]);

  // Highlight selected entity
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    entitiesRef.current.forEach((entity, entityId) => {
      if (!entity.point) return;
      if (entityId === selectedId) {
        entity.point.outlineColor = new Cesium.ConstantProperty(Cesium.Color.YELLOW);
        entity.point.outlineWidth = new Cesium.ConstantProperty(3);
        if (entity.label) entity.label.show = new Cesium.ConstantProperty(true);
      } else {
        const feature = data?.features.find((f, i) => makeEntityId(f, i) === entityId);
        const isBranch = feature?.properties.flags.is_branch ?? false;
        entity.point.outlineColor = new Cesium.ConstantProperty(
          isBranch ? Cesium.Color.WHITE.withAlpha(0.9) : Cesium.Color.WHITE.withAlpha(0.3)
        );
        entity.point.outlineWidth = new Cesium.ConstantProperty(isBranch ? 2.5 : 1);
        if (entity.label) entity.label.show = new Cesium.ConstantProperty(false);
      }
    });
  }, [selectedId, data]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    />
  );
}

// Export a helper for the system navigator flyTo
export function useFlyToSystem(viewer: Cesium.Viewer | null) {
  return useCallback((systemName: string, allFeatures: InstitutionFeature[]) => {
    if (!viewer) return;
    const systemMap: Record<string, string[]> = {
      UPR: ['upr', 'university of puerto rico'],
      Inter: ['interamerican', 'inter american', 'inter '],
      UAGM: ['uagm', 'universidad ana g. méndez', 'ana g mendez'],
      PUCPR: ['pontificia', 'pucpr', 'pontifical catholic'],
    };

    const keywords = systemMap[systemName] ?? [];
    const matches = allFeatures.filter((f) =>
      keywords.some((kw) => f.properties.name.toLowerCase().includes(kw))
    );

    if (matches.length === 0) return;

    const positions = matches.map((f) =>
      Cesium.Cartesian3.fromDegrees(f.geometry.coordinates[0], f.geometry.coordinates[1], 0)
    );

    const sphere = Cesium.BoundingSphere.fromPoints(positions);
    // Expand sphere to give padding
    sphere.radius = Math.max(sphere.radius * 1.4, 20000);

    viewer.camera.flyToBoundingSphere(sphere, {
      duration: 2,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-35), 0),
    });
  }, [viewer]);
}
