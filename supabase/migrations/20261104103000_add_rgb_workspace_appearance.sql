alter table public.user_preferences
  add column if not exists primary_color text not null default '#6485ff',
  add column if not exists secondary_color text not null default '#9b7cff',
  add column if not exists tertiary_color text not null default '#42c995',
  add column if not exists appearance_palette text not null default 'codexa-original';

alter table public.user_preferences
  add constraint user_preferences_primary_color_check check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_secondary_color_check check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint user_preferences_tertiary_color_check check (tertiary_color ~ '^#[0-9A-Fa-f]{6}$');
