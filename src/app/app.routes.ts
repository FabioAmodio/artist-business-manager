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
		path: 'suppliers',
		data: { title: 'Fornitori' },
		loadComponent: () => import('./features/suppliers/suppliers-page').then((m) => m.SuppliersPage),
	},
	{
		path: 'purchases',
		data: { title: 'Acquisti' },
		loadComponent: () => import('./features/purchases/purchases-page').then((m) => m.PurchasesPage),
	},
	{
		path: 'lots',
		data: { title: 'Lotti' },
		loadComponent: () => import('./features/lots/lots-page').then((m) => m.LotsPage),
	},
	{
		path: 'works',
		data: { title: 'Lavori' },
		loadComponent: () => import('./features/operations/operations-page').then((m) => m.OperationsPage),
	},
	{
		path: 'events',
		data: { title: 'Eventi' },
		loadComponent: () => import('./features/fairs/fairs-page').then((m) => m.FairsPage),
	},
	{
		path: 'sales',
		data: { title: 'Vendite' },
		loadComponent: () => import('./features/operations/operations-page').then((m) => m.OperationsPage),
	},
	{
		path: 'catalog',
		data: { title: 'Prodotti' },
		loadComponent: () => import('./features/products/products-page').then((m) => m.ProductsPage),
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
