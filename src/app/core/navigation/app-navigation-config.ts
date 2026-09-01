/**
 * Application navigation configuration.
 * Defines all main navigation menu items.
 */

export interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export const APP_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Riepilogo',
    icon: '📊',
    exact: true,
  },
  {
    path: '/sales',
    label: 'Vendite',
    icon: '💰',
  },
  {
    path: '/works',
    label: 'Lavori',
    icon: '✓',
  },
  {
    path: '/deadlines',
    label: 'Scadenze',
    icon: '⏰',
  },
  {
    path: '/clients',
    label: 'Clienti',
    icon: '👥',
  },
  {
    path: '/catalog',
    label: 'Catalogo',
    icon: '📦',
  },
  {
    path: '/purchases',
    label: 'Acquisti',
    icon: '＋',
  },
  {
    path: '/suppliers',
    label: 'Fornitori',
    icon: '▣',
  },
  {
    path: '/events',
    label: 'Eventi',
    icon: '📅',
  },
  {
    path: '/payment-methods',
    label: 'Pagamenti',
    icon: '▤',
  },
  {
    path: '/settings',
    label: 'Impostazioni',
    icon: '⚙',
  },
  {
    path: '/trash',
    label: 'Cestino',
    icon: '🗑',
  },
];
