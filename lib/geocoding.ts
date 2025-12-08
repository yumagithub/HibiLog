import type { ReverseGeocodeResult } from "./types";

/**
 * Google Maps Geocoding APIを使用した逆ジオコーディング
 * 緯度経度から住所と場所名を取得
 */
export async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API キーが設定されていません");
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=ja`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];

      // 場所名を取得（最も具体的な地名）
      const locationName =
        result.address_components.find(
          (component: any) =>
            component.types.includes("sublocality_level_1") ||
            component.types.includes("locality") ||
            component.types.includes("administrative_area_level_2")
        )?.long_name ||
        result.address_components[0]?.long_name ||
        "不明な場所";

      return {
        locationName,
        address: result.formatted_address,
      };
    }

    if (data.status === "ZERO_RESULTS") {
      console.warn("該当する住所が見つかりませんでした");
      return {
        locationName: "不明な場所",
        address: `緯度: ${latitude.toFixed(6)}, 経度: ${longitude.toFixed(6)}`,
      };
    }

    console.error("逆ジオコーディングエラー:", data.status);
    return null;
  } catch (error) {
    console.error("逆ジオコーディングエラー:", error);
    return null;
  }
}

/**
 * OpenStreetMap Nominatim APIを使用した逆ジオコーディング（無料）
 * Google Maps APIの代替として使用可能
 */
export async function reverseGeocodeOSM(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja`,
      {
        headers: {
          "User-Agent": "HibiLog-App", // Nominatim APIはUser-Agentが必須
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.display_name) {
      // 場所名を取得
      const locationName =
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        "不明な場所";

      return {
        locationName,
        address: data.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("逆ジオコーディングエラー (OSM):", error);
    return null;
  }
}

/**
 * 逆ジオコーディングのメイン関数
 * Google Maps APIを優先的に使用し、失敗時はOSMにフォールバック
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  // まずGoogle Maps APIを試す
  const googleResult = await reverseGeocodeGoogle(latitude, longitude);
  if (googleResult) {
    return googleResult;
  }

  // Google Maps APIが失敗した場合、OSMにフォールバック
  console.log("Google Maps APIが失敗、OpenStreetMapにフォールバック");
  return await reverseGeocodeOSM(latitude, longitude);
}