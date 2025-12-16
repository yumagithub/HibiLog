"use client";

import { useEffect, useState } from "react";
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
  height: "600px",
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

  // 絵文字をマーカーアイコンに変換
  const createEmojiIcon = (emoji: string) => {
    const g = typeof window !== "undefined" ? (window as any).google : null;

    if (!g?.maps) return undefined;

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
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={13}
      options={mapOptions}
    >
      {/* マーカーを表示 */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          onClick={() => setSelectedMarker(marker)}
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
  );
}
