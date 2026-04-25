import * as Cesium from 'cesium';

/**
 * Returns the camera origin [lon, lat] such that looking forward at pitchDeg
 * from altMeters altitude places the target point at screen center.
 *
 * When pitch = -30°, the camera looks 30° below horizontal. The ground
 * intercept is at horizontal distance = alt / tan(|pitch|) ahead of the
 * camera. So place the camera that distance south of the target.
 *
 * Multiply by 0.9 to account for terrain elevation (~50-200m in PR)
 * which shortens the effective altitude and intercept distance slightly.
 */
export function cameraOriginForTarget(
  targetLon: number,
  targetLat: number,
  altMeters: number,
  pitchDeg: number
): [number, number] {
  const pitchRad = Math.abs(Cesium.Math.toRadians(pitchDeg));
  const groundDistMeters = (altMeters / Math.tan(pitchRad)) * 0.9;
  const latOffsetDeg = groundDistMeters / 111320;
  return [targetLon, targetLat - latOffsetDeg];
}
