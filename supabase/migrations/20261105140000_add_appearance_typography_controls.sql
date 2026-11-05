alter table public.user_preferences
  add column if not exists font_size_base integer not null default 16,
  add column if not exists heading_scale numeric(3,2) not null default 1,
  add column if not exists font_weight integer not null default 400,
  add column if not exists line_height numeric(3,2) not null default 1.5,
  add column if not exists letter_spacing numeric(4,2) not null default 0,
  add column if not exists button_radius numeric(4,2) not null default 0.65,
  add column if not exists card_radius numeric(4,2) not null default 0.75,
  add column if not exists shadow_strength integer not null default 20,
  add column if not exists focus_color text not null default '#6485ff';

alter table public.user_preferences
  add constraint user_preferences_font_size_base_check check (font_size_base between 12 and 20),
  add constraint user_preferences_heading_scale_check check (heading_scale between 0.85 and 1.25),
  add constraint user_preferences_font_weight_check check (font_weight in (400,500,600,700)),
  add constraint user_preferences_line_height_check check (line_height between 1.1 and 2.0),
  add constraint user_preferences_letter_spacing_check check (letter_spacing between -0.05 and 0.2),
  add constraint user_preferences_button_radius_check check (button_radius between 0 and 2),
  add constraint user_preferences_card_radius_check check (card_radius between 0 and 2),
  add constraint user_preferences_shadow_strength_check check (shadow_strength between 0 and 60),
  add constraint user_preferences_focus_color_check check (focus_color ~ '^#[0-9A-Fa-f]{6}$');
