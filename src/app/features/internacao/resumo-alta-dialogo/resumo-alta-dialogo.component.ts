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
import { Tutor } from '../../cadastro-tutor-animal/tutores/tutor.model';
import { Internacao } from '../internacao.model';

/**
 * ResumoAltaDialogoComponent
 * --------------------------
 * Depois da alta, o back manda o resumo ao e-mail do tutor. Este diálogo mostra para onde foi e deixa reenviar;
 * se o tutor não tem e-mail, é aqui que a recepção baixa o PDF para imprimir e entregar.
 */
@Component({
  selector: 'app-resumo-alta-dialogo',
  standalone: true,
  templateUrl: './resumo-alta-dialogo.component.html',
  styleUrls: ['../dialogo.css', './resumo-alta-dialogo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumoAltaDialogoComponent implements AfterViewInit {
  @Input({ required: true }) internacao!: Internacao;
  /** `undefined` enquanto procura; `null` se o tutor do animal não foi achado. */
  @Input() tutor: Tutor | null | undefined = undefined;
  /** 'baixar' ou 'enviar' enquanto a chamada está em andamento. */
  @Input() ocupado: 'baixar' | 'enviar' | null = null;
  @Input() aviso: string | null = null;
  @Input() erro: string | null = null;

  @Output() baixar = new EventEmitter<void>();
  @Output() reenviar = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close();
  }
}
