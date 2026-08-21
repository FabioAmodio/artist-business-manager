import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-placeholder-page',
  template: `
    <section class="placeholder-page" aria-labelledby="page-title">
      <p class="eyebrow">Application foundation</p>
      <h1 id="page-title">{{ title }}</h1>
      <p class="description">Questa area e predisposta per una futura feature.</p>
    </section>
  `,
  styles: `
    .placeholder-page {
      border-top: 3px solid #d28b4c;
      max-width: 52rem;
      padding-top: 1.5rem;
    }

    .eyebrow {
      color: #6e7770;
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      margin: 0 0 1.5rem;
      text-transform: uppercase;
    }

    h1 {
      color: #183c37;
      font-family: Georgia, serif;
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 400;
      line-height: 1;
      margin: 0;
    }

    .description {
      color: #6e7770;
      font-size: 0.95rem;
      margin: 1.25rem 0 0;
    }
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = this.route.snapshot.data['title'] as string;
}
