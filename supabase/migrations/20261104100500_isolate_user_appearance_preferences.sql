drop policy if exists user_preferences_authenticated_all on public.user_preferences;
create policy user_preferences_select_own on public.user_preferences for select using (auth.uid() = user_id);
create policy user_preferences_insert_own on public.user_preferences for insert with check (auth.uid() = user_id);
create policy user_preferences_update_own on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_preferences_delete_own on public.user_preferences for delete using (auth.uid() = user_id);
