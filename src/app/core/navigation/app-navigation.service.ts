import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Application navigation service for programmatic routing and navigation history.
 */
@Injectable({
  providedIn: 'root',
})
export class AppNavigationService {
  private navigationStack: string[] = [];

  constructor(private readonly router: Router) {}

  /**
   * Navigate to a given path
   */
  navigate(path: string | string[], queryParams?: Record<string, any>): Promise<boolean> {
    this.navigationStack.push(this.router.url);
    return this.router.navigate([path], { queryParams });
  }

  /**
   * Navigate back to previous route if available
   */
  back(): void {
    if (this.navigationStack.length > 0) {
      const previousPath = this.navigationStack.pop();
      if (previousPath) {
        this.router.navigateByUrl(previousPath);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Navigate to error page
   */
  navigateToError(): Promise<boolean> {
    return this.router.navigate(['/error']);
  }

  /**
   * Navigate to 404 page
   */
  navigateToNotFound(): Promise<boolean> {
    return this.router.navigate(['/404']);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.router.url;
  }
}
