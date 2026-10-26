import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FILTROS_POR_TIPO, FiltrosRelatorio, FormatoRelatorio, PessoaResumo, TipoRelatorio } from './relatorio.model';

export interface ArquivoRelatorio {
  nome: string;
  conteudo: Blob;
}

/** Consome o octopus-msrelatorios. O arquivo vem pronto do back; aqui só se dispara o download. */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  gerar(tipo: TipoRelatorio, formato: FormatoRelatorio, filtros: FiltrosRelatorio): Observable<ArquivoRelatorio> {
    let params = new HttpParams().set('formato', formato);
    for (const campo of FILTROS_POR_TIPO[tipo]) {
      if (filtros[campo]) params = params.set(campo, filtros[campo]);
    }
    return this.http
      .get(`${this.apiBase}/relatorios/${tipo}`, { params, responseType: 'blob', observe: 'response' })
      .pipe(
        map((resposta: HttpResponse<Blob>) => ({
          nome: this.nomeDoArquivo(resposta) ?? `relatorio-${tipo}.${formato.toLowerCase()}`,
          conteudo: resposta.body ?? new Blob(),
        })),
      );
  }

  /** PDF de uma prescrição, assinado pelo veterinário que prescreveu. */
  prescricao(id: number): Observable<ArquivoRelatorio> {
    return this.http
      .get(`${this.apiBase}/relatorios/prescricoes/${id}`, { responseType: 'blob', observe: 'response' })
      .pipe(
        map((resposta: HttpResponse<Blob>) => ({
          nome: this.nomeDoArquivo(resposta) ?? `prescricao-${id}.pdf`,
          conteudo: resposta.body ?? new Blob(),
        })),
      );
  }

  /** PDF do resumo de alta, para entregar ao tutor que não tem e-mail. */
  resumoDeAlta(internacaoId: number): Observable<ArquivoRelatorio> {
    return this.http
      .get(`${this.apiBase}/relatorios/altas/${internacaoId}`, { responseType: 'blob', observe: 'response' })
      .pipe(
        map((resposta: HttpResponse<Blob>) => ({
          nome: this.nomeDoArquivo(resposta) ?? `resumo-de-alta-${internacaoId}.pdf`,
          conteudo: resposta.body ?? new Blob(),
        })),
      );
  }

  /** Reenvia o resumo de alta ao e-mail cadastrado do tutor. Devolve o endereço usado. */
  enviarResumoDeAlta(internacaoId: number): Observable<string> {
    return this.http
      .post<{ destinatario: string }>(`${this.apiBase}/relatorios/altas/${internacaoId}/email`, null)
      .pipe(map((r) => r.destinatario));
  }

  /** Auxiliares para o filtro do relatório de doses (inclui contas desativadas, que seguem no histórico). */
  auxiliares(): Observable<PessoaResumo[]> {
    return this.http.get<PessoaResumo[]>(`${this.apiBase}/usuarios/nomes`).pipe(
      map((pessoas) =>
        pessoas.filter((p) => p.role === 'ROLE_AUXILIAR').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      ),
    );
  }

  /** Cria um link temporário para o arquivo e clica nele, que é como o navegador baixa um Blob. */
  baixar(arquivo: ArquivoRelatorio): void {
    const url = URL.createObjectURL(arquivo.conteudo);
    const link = document.createElement('a');
    link.href = url;
    link.download = arquivo.nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Com responseType blob, o JSON de erro do back também chega como Blob e precisa ser lido. */
  async mensagemDeErro(e: HttpErrorResponse): Promise<string> {
    let mensagem: string | undefined;
    if (e.error instanceof Blob) {
      try {
        mensagem = JSON.parse(await e.error.text())?.mensagem;
      } catch {
        mensagem = undefined;
      }
    } else if (typeof e.error?.mensagem === 'string') {
      mensagem = e.error.mensagem; // chamadas que não são download (ex.: reenviar o resumo) vêm como JSON
    }
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';
      case 400:
        return mensagem ?? 'Filtros inválidos.';
      case 403:
        return 'Seu perfil não tem acesso a este relatório.';
      case 422:
        return mensagem ?? 'A operação não pôde ser feita.';
      case 502:
        // O back usa 502 só quando o servidor de e-mail recusa o envio, e a mensagem já diz o que fazer.
        return mensagem ?? 'O e-mail não pôde ser enviado.';
      case 503:
        return 'Um dos serviços que fornecem os dados não respondeu. Tente de novo em instantes.';
      default:
        return 'Não foi possível gerar o relatório. Tente novamente.';
    }
  }

  // Content-Disposition: attachment; filename="relatorio-doses-2026-10-12.pdf"
  private nomeDoArquivo(resposta: HttpResponse<Blob>): string | null {
    const cabecalho = resposta.headers.get('Content-Disposition') ?? '';
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho);
    if (utf8) return decodeURIComponent(utf8[1]);
    const simples = /filename="?([^";]+)"?/i.exec(cabecalho);
    return simples ? simples[1] : null;
  }
}
