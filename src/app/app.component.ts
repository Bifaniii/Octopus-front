import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MedicationComponent } from './features/medication/medication.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MedicationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ClinicaPet';
}
