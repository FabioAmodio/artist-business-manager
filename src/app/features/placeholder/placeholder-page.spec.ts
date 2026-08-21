import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PlaceholderPage } from './placeholder-page';

describe('PlaceholderPage', () => {
  it('reads its title from route data', () => {
    TestBed.configureTestingModule({
      imports: [PlaceholderPage],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { data: { title: 'Dashboard' } } } }],
    });

    const page = TestBed.createComponent(PlaceholderPage).componentInstance;

    expect(page['title']).toBe('Dashboard');
  });
});
