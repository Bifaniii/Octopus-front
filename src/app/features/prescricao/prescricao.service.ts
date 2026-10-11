import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InternacaoOpcao,
  MedicacaoOpcao,
  Prescricao,
  PrescricaoRequest,
} from './prescricao.model';

@Injectable({ providedIn: 'root' })
export class PrescricaoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listar(): Observable<Prescricao[]> {
    return this.http.get<Prescricao[]>(`${this.base}/prescricoes`);
  }

  criar(pedido: PrescricaoRequest): Observable<Prescricao> {
    return this.http.post<Prescricao>(`${this.base}/prescricoes`, pedido);
  }

  desativar(id: number): Observable<Prescricao> {
    return this.http.patch<Prescricao>(
      `${this.base}/prescricoes/${id}/desativar`,
      {},
    );
  }

  // --- Dados de outros módulos (internação e medicamentos) ---------------------------------------

  listarInternacoes(): Observable<InternacaoOpcao[]> {
    return this.http.get<any[]>(`${this.base}/internacoes`).pipe(
      map((lista) =>
        lista.map((r) => ({
          id: r.id as number,
          animalNome: (r.animalNome ?? `Internação #${r.id}`) as string,
          animalEspecie: r.animalEspecie as string | undefined,
          status: r.status as string,
        })),
      ),
    );
  }

  listarMedicacoes(): Observable<MedicacaoOpcao[]> {
    return this.http
      .get<any[]>(`${this.base}/medicacoes`)
      .pipe(
        map((lista) =>
          lista
            .filter((r) => r.ativo !== false)
            .map((r) => ({
              id: r.id as number,
              nomeComercial: r.nomeComercial as string,
            })),
        ),
      );
  }

  // --- Erros -------------------------------------------------------------------------------------

  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error;
    const mensagem: string | undefined = corpo?.mensagem;

    switch (e.status) {
      case 0:
        return 'Não foi possível falar com o servidor. Verifique a conexão.';
      case 400: {
        const campos = corpo?.campos;
        if (campos && typeof campos === 'object') {
          const texto = Object.entries(campos)
            .map(([campo, msg]) => `${campo}: ${msg}`)
            .join('; ');
          if (texto) return texto;
        }
        return mensagem ?? 'Dados inválidos. Revise o formulário.';
      }
      case 403:
        return 'Seu perfil não tem permissão para esta ação.';
      case 404:
      case 409:
      case 422:
        return mensagem ?? 'Não foi possível concluir a operação.';
      case 502:
      case 503:
        return 'Um dos serviços (prescrição, internação ou medicamentos) está fora do ar. Tente de novo em instantes.';
      default:
        return mensagem ?? 'Erro inesperado. Tente novamente.';
    }
  }
}
