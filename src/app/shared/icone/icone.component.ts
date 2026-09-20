import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icone',
  standalone: true,
  imports: [],
  template: `
    <p>
      icone works!
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconeComponent {

}
