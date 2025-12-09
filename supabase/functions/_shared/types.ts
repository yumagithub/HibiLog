export interface BakuProfile {
  user_id: string;
  hunger_level: number;
  last_fed_at: string;
  // 他のプロフィール情報...
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}
