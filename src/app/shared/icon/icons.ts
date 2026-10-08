/**
 * Nombres de icono disponibles en el subconjunto de Material Symbols Rounded.
 *
 * Cada entrada DEBE existir como ligature en
 * src/assets/fonts/MaterialSymbolsRounded-subset.woff2.
 * Para agregar uno: validar el nombre en
 * https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<nombre>/default/24px.svg
 * y regenerar la fuente (ver README).
 */
export const ICONS = {

  /* Navegación */
  menu: 'menu',
  close: 'close',

  /* Flechas y acción */
  arrow_forward: 'arrow_forward',
  trending_up: 'trending_up',
  timer: 'timer',

  /* Promociones */
  sell: 'sell',
  verified: 'verified',
  qr_code_2: 'qr_code_2',
  monitoring: 'monitoring',
  groups: 'groups',
  settings: 'settings',

  /* Restaurantes */
  restaurant: 'restaurant',
  local_fire_department: 'local_fire_department',
  cake: 'cake',

  /* Estados */
  check: 'check',
  add: 'add',
  remove: 'remove',

  /* Marca */
  auto_awesome: 'auto_awesome'

} as const;

export type IconName = keyof typeof ICONS;

export type IconWeight =
  | 100 | 200 | 300 | 400 | 500 | 600 | 700;

export type IconFill = 0 | 1;