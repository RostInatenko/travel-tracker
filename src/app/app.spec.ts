import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      // App's real template renders <router-outlet>. Instantiating RouterOutlet
      // inside the vitest/zoneless TestBed trips an Angular injection-context
      // assertion (NG0203) — a known test-environment quirk, not a runtime bug.
      // We swap in an empty template to unit-test the component class in isolation.
      .overrideComponent(App, { set: { template: '' } })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has the expected title', () => {
    const fixture = TestBed.createComponent(App);
    // `title` is a signal; bracket access sidesteps the `protected` modifier.
    expect((fixture.componentInstance as any).title()).toBe('Travel Tracker');
  });
});
