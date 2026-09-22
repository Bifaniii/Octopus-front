import { Injectable, signal } from '@angular/core';
import { Baia, DadosBaia } from './baia.model';

/**
 * BaiaService
 * -----------
 * Fonte de dados das baias e das operações de cadastro.
 * Por enquanto tudo fica em memória: ao recarregar a página, volta ao início
 * (lista vazia). Cadastre as baias pelo botão "Nova baia" na tela.
 */
@Injectable({ providedIn: 'root' })
export class BaiaService {
  // TODO: trocar por chamadas HttpClient quando a API de baias existir.
  private readonly _baias = signal<Baia[]>([]);

  readonly baias = this._baias.asReadonly();

  /** Cadastra uma nova baia. Se já nascer ocupada, registra a hora atual. */
  adicionar(dados: DadosBaia): Baia {
    const ocupada = dados.status === 'ocupada';
    const nova: Baia = {
      id: Math.max(0, ...this._baias().map((b) => b.id)) + 1,
      tipo: dados.tipo,
      numero: dados.numero,
      status: dados.status,
      descricao: ocupada ? dados.descricao : undefined,
      detalhe: ocupada ? dados.detalhe : undefined,
      desde: ocupada ? this.horaAtual() : undefined,
    };
    this._baias.update((lista) => [...lista, nova]);
    return nova;
  }

  /** Atualiza uma baia. Ao liberar, limpa o atendimento; ao ocupar, registra a hora. */
  atualizar(id: number, dados: DadosBaia): void {
    this._baias.update((lista) =>
      lista.map((b) => {
        if (b.id !== id) return b;
        if (dados.status === 'livre') {
          return { id, tipo: dados.tipo, numero: dados.numero, status: 'livre' };
        }
        return {
          id,
          tipo: dados.tipo,
          numero: dados.numero,
          status: 'ocupada',
          descricao: dados.descricao,
          detalhe: dados.detalhe,
          desde: b.status === 'ocupada' ? b.desde : this.horaAtual(),
        };
      }),
    );
  }

  remover(id: number): void {
    this._baias.update((lista) => lista.filter((b) => b.id !== id));
  }

  private horaAtual(): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }
}
