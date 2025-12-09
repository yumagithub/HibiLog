export type Memory = {
id: string;
user_id: string;
memory_date: string;
text_content: string | null;
media_url: string | null;
media_type: "photo" | "video" | null;
mood_emoji: string | null;
mood_category: string | null;
created_at: string;
updated_at: string;
// 位置情報関連（新規追加）
latitude: number | null;
longitude: number | null;
location_name: string | null;
address: string | null;
};
// 位置情報のみの型
export type Location = {
latitude: number;
longitude: number;
location_name?: string;
address?: string;
};
// ブラウザGeolocation APIのレスポンス型
export type GeolocationData = {
latitude: number;
longitude: number;
accuracy: number;
altitude: number | null;
altitudeAccuracy: number | null;
heading: number | null;
speed: number | null;
} | null;
// Google Maps⽤のマーカー型
export type MemoryMarker = {
id: string;
position: {
lat: number;
lng: number;
};
title: string;
imageUrl: string | null;
date: string;
moodEmoji: string | null;
textContent: string | null;
};
// 逆ジオコーディングのレスポンス型
export type ReverseGeocodeResult = {
locationName: string;
address: string;
} | null;