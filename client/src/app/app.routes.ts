import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

// Functional router guards
const authGuard: CanActivateFn = () => {
	const token = localStorage.getItem('token');
	if (token) return true;
	const router = inject(Router);
	return router.createUrlTree(['/login']);
};

const loggedOutGuard: CanActivateFn = () => {
	const token = localStorage.getItem('token');
	if (!token) return true;
	const router = inject(Router);
	return router.createUrlTree(['/']);
};

export const routes: Routes = [
	{
		path: '',
			loadComponent: () => import('./board/board').then(m => m.BoardComponent)
	},
	{
		path: 'login',
			loadComponent: () => import('./login/login').then(m => m.LoginComponent),
			canActivate: [loggedOutGuard]
	},
	{
		path: 'signup',
			loadComponent: () => import('./signup/signup').then(m => m.SignUpComponent),
			canActivate: [loggedOutGuard]
	},
	{ path: '**', redirectTo: '' }
];
