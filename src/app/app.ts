import { Component, effect } from '@angular/core';
import { RouterLink, RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { ResponsiveNavComponent } from './core/navigation/responsive-nav.component';
import { MobileActionBarComponent } from './core/navigation/mobile-action-bar.component';

@Component({
  imports: [RouterLink, RouterOutlet, ResponsiveNavComponent, MobileActionBarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    // Handle GitHub Pages SPA redirect from 404.html
    effect(() => {
      const queryParams = this.route.snapshot.queryParams;
      if (queryParams['redirect']) {
        const redirectPath = queryParams['redirect'];
        // Remove redirect param and navigate to the requested path
        this.router.navigateByUrl(redirectPath);
      }
    });
  }
}

