"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/client";
import type { MemoryMarker } from "@/lib/types";
import Image from "next/image";

const mapContainerStyle = {
  width: "100%",
  height: "70vh",
};

const defaultCenter = {
  lat: 35.6762, // 東京（デフォルト）
  lng: 139.6503,
};

// Google Mapsのカスタムスタイル
const mapOptions = {
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }], // 興味地点のラベルを非表示
    },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

interface MemoryMapProps {
  userId: string;
}

export function MemoryMap({ userId }: MemoryMapProps) {
  const [markers, setMarkers] = useState<MemoryMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MemoryMarker | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    fetchMemoriesWithLocation();
  }, [userId]);

  const fetchMemoriesWithLocation = async () => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", userId)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("memory_date", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const memoryMarkers: MemoryMarker[] = data.map((memory) => ({
          id: memory.id,
          position: {
            lat: memory.latitude!,
            lng: memory.longitude!,
          },
          title: memory.location_name || "思い出",
          imageUrl: memory.media_url,
          date: memory.memory_date,
          moodEmoji: memory.mood_emoji,
          textContent: memory.text_content,
        }));

        setMarkers(memoryMarkers);

        // 最初のマーカーを中心に設定
        setMapCenter(memoryMarkers[0].position);
      }
    } catch (error) {
      console.error("思い出の取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 絵文字もしくはPNGパスをマーカーアイコンに変換
  const createEmojiIcon = (emoji: string) => {
    const g = typeof window !== "undefined" ? (window as any).google : null;

    if (!g?.maps) return undefined;

    // /like.png のようなパスが来た場合は画像アイコンとして扱う
    if (emoji.startsWith("/")) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      return {
        url: `${origin}${emoji}`,
        scaledSize: new g.maps.Size(40, 40),
        anchor: new g.maps.Point(20, 20),
      };
    }

    // 通常の絵文字はSVGでレンダリング
    return {
      url: `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="white" stroke="#4B5563" stroke-width="2"/>
          <text x="20" y="28" font-size="20" text-anchor="middle">${emoji}</text>
        </svg>`
      )}`,
      scaledSize: new g.maps.Size(40, 40),
      anchor: new g.maps.Point(20, 20),
    };
  };

  const fitToMarkers = () => {
    if (!mapRef.current || markers.length === 0) return;
    const g = (window as any).google;
    if (!g?.maps) return;
    const bounds = new g.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend(m.position));
    mapRef.current.fitBounds(bounds, 80);
  };

  const resetToDefault = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo(mapCenter || defaultCenter);
    mapRef.current.setZoom(13);
  };

  const goToCurrentLocation = () => {
    if (!navigator.geolocation || !mapRef.current) {
      alert("現在地取得が利用できません");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current!.panTo(center);
        mapRef.current!.setZoom(15);
      },
      (error) => {
        console.error("現在地取得エラー:", error);
        alert(
          "現在地を取得できませんでした。HTTPSや位置情報の権限を確認してください。"
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isLoaded && mapRef.current && markers.length) {
      fitToMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, markers.length]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">マップを読み込み中...</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Googleマップを初期化しています...</p>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-linear-to-b from-blue-50 to-purple-50 rounded-lg">
        <p className="text-xl mb-2">🗺️</p>
        <p className="text-gray-600">位置情報付きの思い出がまだありません</p>
        <p className="text-sm text-gray-500 mt-1">
          カメラで撮影して思い出を記録しましょう！
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={13}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
          if (markers.length) {
            fitToMarkers();
          }
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
      >
        {/* マーカーを表示 */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => {
              setSelectedMarker(marker);
              if (mapRef.current) {
                mapRef.current.panTo(marker.position);
              }
            }}
            icon={
              marker.moodEmoji && isLoaded
                ? createEmojiIcon(marker.moodEmoji)
                : undefined
            }
            title={marker.title}
          />
        ))}

        {/* 情報ウィンドウ */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              {/* 画像 */}
              {selectedMarker.imageUrl && (
                <div className="relative w-full h-40 mb-2">
                  <Image
                    src={selectedMarker.imageUrl}
                    alt={selectedMarker.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}

              {/* タイトル */}
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {selectedMarker.moodEmoji && (
                  <span className="text-2xl">{selectedMarker.moodEmoji}</span>
                )}
                {selectedMarker.title}
              </h3>

              {/* 日付 */}
              <p className="text-sm text-gray-600 mt-1">
                📅 {new Date(selectedMarker.date).toLocaleDateString("ja-JP")}
              </p>

              {/* テキスト */}
              {selectedMarker.textContent && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                  {selectedMarker.textContent}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* オーバーレイUI */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="flex justify-between items-start p-3 gap-3">
          <div className="pointer-events-auto bg-white/85 backdrop-blur shadow-md rounded-lg px-3 py-2 text-sm text-gray-700 flex flex-col gap-1">
            <div className="font-semibold text-gray-900">思い出マップ</div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>📍 {markers.length} 件</span>
              {markers[0]?.date && (
                <span>
                  最終: {new Date(markers[0].date).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={goToCurrentLocation}
              className="rounded-md bg-white/85 backdrop-blur px-3 py-2 text-xs font-semibold text-gray-800 shadow hover:bg-white"
              title="現在地にジャンプ"
            >
              📍 現在地へ
            </button>
            <button
              onClick={fitToMarkers}
              className="rounded-md bg-white/85 backdrop-blur px-3 py-2 text-xs font-semibold text-gray-800 shadow hover:bg-white"
            >
              全件表示
            </button>
            <button
              onClick={resetToDefault}
              className="rounded-md bg-white/85 backdrop-blur px-3 py-2 text-xs font-semibold text-gray-800 shadow hover:bg-white"
            >
              中心リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
