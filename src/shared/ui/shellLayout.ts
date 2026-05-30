/** Ancho del sidebar en escritorio (px). */
export const SIDEBAR_WIDTH_EXPANDED = 245;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'bahaisongs:sidebar-collapsed';

/** Fixed bottom chrome — player + mobile nav share one bar on xs–sm. */
export const SHELL_LAYOUT_VARS = {
  chromeBottom: '12px',
  /** Combined player + nav row on mobile/tablet. */
  mobileChromeHeight: '156px',
  desktopPlayerHeight: '108px',
} as const;

export const MOBILE_CONTENT_PADDING_BOTTOM = `calc(${SHELL_LAYOUT_VARS.chromeBottom} + ${SHELL_LAYOUT_VARS.mobileChromeHeight} + 20px + env(safe-area-inset-bottom, 0px))`;

export const DESKTOP_CONTENT_PADDING_BOTTOM = `calc(16px + ${SHELL_LAYOUT_VARS.desktopPlayerHeight} + 24px)`;

export const MOBILE_WHATSAPP_BOTTOM = `calc(${SHELL_LAYOUT_VARS.chromeBottom} + ${SHELL_LAYOUT_VARS.mobileChromeHeight} + 12px + env(safe-area-inset-bottom, 0px))`;
