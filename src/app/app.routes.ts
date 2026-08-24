import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'dashboard',
		data: { title: 'Dashboard' },
		loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
	},
	{
		path: 'clients',
		data: { title: 'Clienti' },
		loadComponent: () => import('./features/clients/clients-page').then((m) => m.ClientsPage),
	},
	{
		path: 'works',
		data: { title: 'Lavori' },
		loadComponent: () => import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
	},
	{
		path: 'events',
		data: { title: 'Eventi' },
		loadComponent: () => import('./features/fairs/fairs-page').then((m) => m.FairsPage),
	},
	{
		path: 'sales',
		data: { title: 'Vendite' },
		loadComponent: () => import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
	},
	{
		path: 'catalog',
		data: { title: 'Catalogo' },
		loadComponent: () => import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
	},
	{
		path: 'finance',
		data: { title: 'Finanza' },
		loadComponent: () => import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
	},
	{
		path: 'deadlines',
		data: { title: 'Scadenze' },
		loadComponent: () => import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
	},
	{
		path: 'settings',
		data: { title: 'Impostazioni' },
		loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
	},
	{
		path: '404',
		loadComponent: () => import('./features/error/error-pages').then((m) => m.NotFoundPage),
	},
	{
		path: 'error',
		loadComponent: () => import('./features/error/error-pages').then((m) => m.ErrorPage),
	},
	{
		path: '**',
		redirectTo: '404',
	},
];
