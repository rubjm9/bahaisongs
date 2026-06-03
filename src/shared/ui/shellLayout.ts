/** Ancho del sidebar en escritorio (px). */
export const SIDEBAR_WIDTH_EXPANDED = 245;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'bahaisongs:sidebar-collapsed';

/** Mobile bottom nav height (fixed, always visible on mobile). */
export const MOBILE_NAV_HEIGHT = '56px';

/** Mobile player bar height (floats above the nav bar when a track is playing). */
export const MOBILE_PLAYER_HEIGHT = '76px';

/** Fixed bottom chrome constants. */
export const SHELL_LAYOUT_VARS = {
  chromeBottom: '12px',
  /** Combined player + nav row on mobile/tablet. */
  mobileChromeHeight: '156px',
  desktopPlayerHeight: '108px',
} as const;

export const MOBILE_CONTENT_PADDING_BOTTOM = `calc(${MOBILE_NAV_HEIGHT} + ${MOBILE_PLAYER_HEIGHT} + 20px + env(safe-area-inset-bottom, 0px))`;

export const DESKTOP_CONTENT_PADDING_BOTTOM = `calc(16px + ${SHELL_LAYOUT_VARS.desktopPlayerHeight} + 24px)`;

export const MOBILE_WHATSAPP_BOTTOM = `calc(${MOBILE_NAV_HEIGHT} + ${MOBILE_PLAYER_HEIGHT} + 12px + env(safe-area-inset-bottom, 0px))`;
