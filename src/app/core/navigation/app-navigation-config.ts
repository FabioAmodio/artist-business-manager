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
    label: 'Dashboard',
    icon: '📊',
    exact: true,
  },
  {
    path: '/works',
    label: 'Lavori',
    icon: '✓',
  },
  {
    path: '/clients',
    label: 'Clienti',
    icon: '👥',
  },
  {
    path: '/suppliers',
    label: 'Fornitori',
    icon: '▣',
  },
  {
    path: '/purchases',
    label: 'Acquisti',
    icon: '＋',
  },
  {
    path: '/payment-methods',
    label: 'Pagamenti',
    icon: '▤',
  },
  {
    path: '/services',
    label: 'Servizi',
    icon: '✦',
  },
  {
    path: '/events',
    label: 'Eventi',
    icon: '📅',
  },
  {
    path: '/sales',
    label: 'Vendite',
    icon: '💰',
  },
  {
    path: '/catalog',
    label: 'Prodotti',
    icon: '📦',
  },
  {
    path: '/deadlines',
    label: 'Scadenze',
    icon: '⏰',
  },
  {
    path: '/settings',
    label: 'Impostazioni',
    icon: '⚙',
  },
];
