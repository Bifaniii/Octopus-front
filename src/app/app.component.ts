import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * AppComponent
 * ------------
 * Raiz da aplicação. Não tem tela própria: apenas hospeda o
 * <router-outlet />, onde o Angular monta a rota atual.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ClinicaPet';
}
