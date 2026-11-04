alter table public.user_preferences
  add column if not exists font_family text not null default 'inter',
  add column if not exists radius_scale text not null default 'medium',
  add column if not exists contrast_mode text not null default 'normal',
  add column if not exists motion_mode text not null default 'full';

alter table public.user_preferences
  drop constraint if exists user_preferences_theme_check,
  drop constraint if exists user_preferences_accent_color_check,
  drop constraint if exists user_preferences_font_family_check,
  drop constraint if exists user_preferences_radius_scale_check,
  drop constraint if exists user_preferences_contrast_mode_check,
  drop constraint if exists user_preferences_motion_mode_check;

alter table public.user_preferences
  add constraint user_preferences_theme_check check (theme in ('dark', 'light', 'system')),
  add constraint user_preferences_accent_color_check check (accent_color in ('blue', 'violet', 'emerald', 'amber', 'rose')),
  add constraint user_preferences_font_family_check check (font_family in ('inter', 'manrope', 'ibm-plex-mono')),
  add constraint user_preferences_radius_scale_check check (radius_scale in ('small', 'medium', 'large')),
  add constraint user_preferences_contrast_mode_check check (contrast_mode in ('normal', 'high')),
  add constraint user_preferences_motion_mode_check check (motion_mode in ('full', 'reduced'));
