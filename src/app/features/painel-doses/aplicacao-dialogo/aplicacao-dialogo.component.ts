import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlvoAplicacao } from '../painel-doses.model';

// Confirma o registro da aplicação. A hora e o auxiliar vêm do servidor (RN-05); aqui só a observação.
@Component({
  selector: 'app-aplicacao-dialogo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './aplicacao-dialogo.component.html',
  styleUrl: '../../internacao/dialogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AplicacaoDialogoComponent implements AfterViewInit {
  @Input({ required: true }) alvo!: AlvoAplicacao;
  @Input() salvando = false;
  @Input() erro: string | null = null;
  @Output() confirmar = new EventEmitter<string | undefined>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dlg') private dlg!: ElementRef<HTMLDialogElement>;

  observacao = '';

  ngAfterViewInit(): void {
    this.dlg.nativeElement.showModal();
  }

  cancelar(): void {
    this.dlg.nativeElement.close();
  }

  enviar(): void {
    this.confirmar.emit(this.observacao.trim() || undefined);
  }
}
