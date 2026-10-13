import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dose, Painel } from './painel-doses.model';

/** Nome e baia do animal de cada internação, e nome de cada medicamento, para a tela não mostrar só ids. */
export interface InternacaoDoPainel {
  id: number;
  animalNome: string;
  baiaId: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PainelDosesService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  painel(): Observable<Painel> {
    return this.http.get<Painel>(`${this.base}/doses/painel`);
  }

  aplicar(doseId: number, observacao?: string): Observable<Dose> {
    return this.http.patch<Dose>(`${this.base}/doses/${doseId}/aplicar`, { observacao });
  }

  aplicarSeNecessario(itemPrescricaoId: number, observacao?: string): Observable<Dose> {
    return this.http.post<Dose>(`${this.base}/doses/se-necessario/${itemPrescricaoId}/aplicacoes`, { observacao });
  }

  internacoes(): Observable<InternacaoDoPainel[]> {
    return this.http.get<InternacaoDoPainel[]>(`${this.base}/internacoes`);
  }

  nomesDasBaias(): Observable<Map<number, string>> {
    return this.http
      .get<{ id: number; nome: string }[]>(`${this.base}/baias`)
      .pipe(map((lista) => new Map(lista.map((b) => [b.id, b.nome] as const))));
  }

  nomesDosMedicamentos(): Observable<Map<number, string>> {
    return this.http
      .get<{ id: number; nomeComercial: string }[]>(`${this.base}/medicacoes`)
      .pipe(map((lista) => new Map(lista.map((m) => [m.id, m.nomeComercial] as const))));
  }

  mensagemDeErro(e: HttpErrorResponse): string {
    const mensagem: string | undefined = e.error?.mensagem;
    switch (e.status) {
      case 0:
        return 'Não foi possível falar com o servidor. Verifique a conexão.';
      case 403:
        return 'Só o auxiliar registra a aplicação das doses.';
      case 404:
      case 422:
        // 422 traz o texto da regra: RN-03 (fora da janela), RN-04 (perdida), RN-05 (já aplicada) ou intervalo mínimo.
        return mensagem ?? 'Não foi possível registrar a aplicação.';
      case 409:
        return 'Outra pessoa registrou esta dose ao mesmo tempo. O painel foi atualizado.';
      case 502:
      case 503:
        return 'O serviço de doses ou de medicamentos está fora do ar. Tente em instantes.';
      default:
        return mensagem ?? 'Erro inesperado. Tente novamente.';
    }
  }
}
