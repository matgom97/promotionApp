import { Routes } from '@angular/router';

export const routes: Routes = [

  // =========================
  // LANDING
  // =========================
  {
    path: '',
    loadComponent: () =>
      import('./layouts/landing-layout/landing-layout.component')
        .then(m => m.LandingLayoutComponent),

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/landing/pages/home/home.component')
            .then(m => m.HomeComponent)
      },

      {
        path: 'restaurantes',
        loadComponent: () =>
          import('./features/landing/pages/restaurants/restaurants.component')
            .then(m => m.RestaurantsComponent)
      },

      {
        path: 'promociones',
        loadComponent: () =>
          import('./features/landing/pages/promotions/promotions.component')
            .then(m => m.PromotionsComponent)
      },

      {
        path: 'about',
        loadComponent: () =>
          import('./features/landing/pages/about/about.component')
            .then(m => m.AboutComponent)
      }
    ]
  },

  // =========================
  // AUTH
  // =========================
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component')
            .then(m => m.LoginComponent)
      },

      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component')
            .then(m => m.RegisterComponent)
      },

      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component')
            .then(m => m.ForgotPasswordComponent)
      },

      {
        path: 'subscription',
        loadComponent: () =>
          import('./features/auth/pages/subscription/subscription.component')
            .then(m => m.SubscriptionComponent)
      }
    ]
  },

  // =========================
  // APP INTERNA
  // =========================
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component')
        .then(m => m.AppLayoutComponent),

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      }
    ]
  },

  // =========================
  // FALLBACK
  // =========================
  {
    path: '**',
    redirectTo: ''
  }

];