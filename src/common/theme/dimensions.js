// TrackLink GPS Design System — Layout dimensions
// Spacing is on an 8pt baseline. Use theme.spacing() in components.

const dimensions = {
  // Spacing scale (6pt baseline - compact)
  spacing: {
    xxs: 2, //   2px
    xs: 3, //    3px
    sm: 6, //    6px
    md: 10, // 10px
    lg: 14, // 14px
    xl: 18, // 18px
    xxl: 24, // 24px
    xxxl: 32, // 32px
  },

  // Border radius — clean compact feel
  radius: {
    none: 0,
    xs: 3,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    pill: 999,
  },

  // Shadow / elevation — subtle
  shadow: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    md: '0 2px 4px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
    lg: '0 4px 8px -2px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 8px 12px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
    xxl: '0 12px 20px -5px rgba(0, 0, 0, 0.08)',
    focus: '0 0 0 2px rgba(0, 119, 255, 0.2)',
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    drawer: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
    notification: 1700,
  },

  // Layout dimensions
  sidebarWidth: '260px',
  sidebarWidthTablet: '64px',
  drawerWidthDesktop: '380px',
  drawerWidthTablet: '320px',
  drawerHeightPhone: '240px',
  filterFormWidth: '160px',
  eventsDrawerWidth: '320px',
  headerHeight: 56,
  bottomBarHeight: 52,
  contentMaxWidth: '100%', /* ✅ Full width layout expansion */
  popupMapOffset: 260,
  popupMaxWidth: 280,
  popupImageHeight: 140,
  cardContentMaxHeight: '40vh',
  qrCodeSize: 160,
};

export default dimensions;