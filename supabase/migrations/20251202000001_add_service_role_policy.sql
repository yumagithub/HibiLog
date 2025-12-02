-- Service Roleがpush_subscriptionsテーブルにアクセスできるようにする
create policy "Service role can access all subscriptions"
  on push_subscriptions
  for all
  to service_role
  using (true)
  with check (true);
