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
import { Internacao, InternacaoEvento, NOME_POR_STATUS, formatarDataHora } from '../internacao.model';

/**
 * HistoricoDialogoComponent
 * -------------------------
 * Linha do tempo da internação: quem mudou o status (ou a baia), quando e para onde. Só exibe.
 */
@Component({
  selector: 'app-historico-dialogo',
  standalone: true,
  templateUrl: './historico-dialogo.component.html',
  styleUrls: ['../dialogo.css', './historico-dialogo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoDialogoComponent implements AfterViewInit {
  @Input({ required: true }) internacao!: Internacao;
  /** `null` enquanto carrega. */
  @Input() eventos: InternacaoEvento[] | null = null;
  /** baiaId → nome, para mostrar a baia de cada passo. */
  @Input() nomesBaias: Record<string, string | undefined> = {};
  @Input() erroApi: string | null = null;

  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  protected readonly nomes = NOME_POR_STATUS;
  protected readonly formatar = formatarDataHora;

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close();
  }
}
