import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TutorService } from '../tutores/tutor.service';
import { Animal, DadosAnimal, ErroApi } from './animal.model';

/**
 * AnimalService
 * -------------
 * Escrita de animais no octopus-msusuario. A leitura vem junto com os tutores (cada TutorResponse traz os
 * seus animais), então este serviço não guarda lista: depois de cada escrita avisa o TutorService. Perfis:
 * ADMIN e RECEPCIONISTA (mesmos da admissão).
 */
@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly http = inject(HttpClient);
  private readonly tutorService = inject(TutorService);
  private readonly apiBase = environment.apiBaseUrl;

  /** POST /api/tutores/{tutorId}/animais */
  criar(tutorId: number, dados: DadosAnimal): Observable<Animal> {
    return this.http
      .post<Animal>(`${this.apiBase}/tutores/${tutorId}/animais`, dados)
      .pipe(tap((novo) => this.tutorService.registrarAnimal(novo)));
  }

  /** PUT /api/animais/{id} — corrige dados, antirrábica e mãe. O tutor não muda. */
  atualizar(id: number, dados: DadosAnimal): Observable<Animal> {
    return this.http
      .put<Animal>(`${this.apiBase}/animais/${id}`, dados)
      .pipe(tap((atualizado) => this.tutorService.registrarAnimal(atualizado)));
  }

  /** Traduz o erro HTTP em uma mensagem amigável para exibir na tela. */
  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error as Partial<ErroApi> | null;
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Apenas administradores e recepcionistas podem cadastrar animais.';
      case 400: {
        const campos = corpo?.campos ? Object.entries(corpo.campos) : [];
        if (campos.length) {
          return campos.map(([campo, msg]) => `${campo}: ${msg}`).join(' · ');
        }
        return corpo?.mensagem ?? 'Dados inválidos.';
      }
      case 404:
      case 409:
      case 422:
        return corpo?.mensagem ?? 'Não foi possível salvar o animal.';
      case 502:
      case 503:
        return 'O serviço de animais está fora do ar. Tente em instantes.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }
}
