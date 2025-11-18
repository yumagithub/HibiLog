-- プッシュ通知購読情報テーブルを作成
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- RLS (Row Level Security) を有効化
alter table push_subscriptions enable row level security;

-- ユーザーは自分の購読情報のみ参照可能
create policy "Users can view their own subscriptions"
  on push_subscriptions
  for select
  using (auth.uid() = user_id);

-- ユーザーは自分の購読情報を作成可能
create policy "Users can create their own subscriptions"
  on push_subscriptions
  for insert
  with check (auth.uid() = user_id);

-- ユーザーは自分の購読情報を更新可能
create policy "Users can update their own subscriptions"
  on push_subscriptions
  for update
  using (auth.uid() = user_id);

-- ユーザーは自分の購読情報を削除可能
create policy "Users can delete their own subscriptions"
  on push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- インデックスを作成（パフォーマンス向上）
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- updated_at自動更新のトリガー
create or replace function update_push_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_push_subscriptions_updated_at
  before update on push_subscriptions
  for each row
  execute function update_push_subscriptions_updated_at();
