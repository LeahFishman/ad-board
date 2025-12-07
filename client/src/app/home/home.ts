import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  readonly items = signal([
    { title: 'Docs', link: 'https://angular.dev' },
    { title: 'Tutorials', link: 'https://angular.dev/tutorials' },
    { title: 'CLI', link: 'https://angular.dev/tools/cli' }
  ]);

  readonly show = signal(true);

  toggle() {
    this.show.update(v => !v);
  }
}
