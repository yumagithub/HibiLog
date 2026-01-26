import type { Memory } from "@/app/memories/page";

/**
 * 地球上の2点間距離（m）を計算（Haversine）
 */
export function calcDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球半径(m)
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * 近い場所の思い出を抽出
 */
export function findNearbyMemories(
  current: {
    id?: string;
    latitude: number;
    longitude: number;
  },
  memories: Memory[],
  radiusMeters = 50 // ← ここで「近い」の定義
): Memory[] {
  return memories.filter((m) => {
    if (m.latitude == null || m.longitude == null || (current.id && m.id === current.id)) return false;

    const distance = calcDistanceMeters(
      current.latitude,
      current.longitude,
      m.latitude,
      m.longitude
    );

    return distance <= radiusMeters;
  });
}
