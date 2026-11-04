alter table public.user_preferences
  add column if not exists background_color text not null default '#090b10',
  add column if not exists surface_color text not null default '#11161e',
  add column if not exists sidebar_color text not null default '#0d1118',
  add column if not exists header_color text not null default '#090b10',
  add column if not exists text_color text not null default '#f8fafc',
  add column if not exists muted_text_color text not null default '#94a3b8',
  add column if not exists border_color text not null default '#253044';

alter table public.user_preferences
  add constraint user_preferences_background_color_check check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_surface_color_check check (surface_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_sidebar_color_check check (sidebar_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_header_color_check check (header_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_text_color_check check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_muted_text_color_check check (muted_text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_border_color_check check (border_color ~ '^#[0-9A-Fa-f]{6}$');
