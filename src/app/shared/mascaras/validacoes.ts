import { CNPJ_DIGITOS, CPF_DIGITOS, somenteDigitos } from './formatos';

/**
 * Validações de formulário que o front faz sozinho: só o formato, para a pessoa corrigir sem esperar a resposta.
 * Quem decide se CPF, CNPJ e celular são válidos é o back (dígito verificador, DDD): o front mostra a mensagem dele.
 */

/** CPF com os 11 dígitos digitados. Se o número existe de verdade, quem diz é o back. */
export function cpfCompleto(valor: string): boolean {
  return somenteDigitos(valor).length === CPF_DIGITOS;
}

export function cnpjCompleto(valor: string): boolean {
  return somenteDigitos(valor).length === CNPJ_DIGITOS;
}

/** Celular: 11 dígitos e o 9 logo depois do DDD. Telefone fixo não é aceito por enquanto. */
export function telefoneValido(valor: string): boolean {
  return /^\d{2}9\d{8}$/.test(somenteDigitos(valor));
}

export function emailValido(valor: string): boolean {
  const e = valor.trim();
  return e.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Pelo menos duas letras: recusa nome vazio, só número ou só símbolo. */
export function nomeValido(valor: string): boolean {
  return (valor.match(/\p{L}/gu) ?? []).length >= 2;
}

/** CRMV: de 1 a 5 dígitos numéricos. */
export function crmvValido(valor: string): boolean {
  return /^\d{1,5}$/.test(valor.trim());
}

/**
 * Data de nascimento (aaaa-MM-dd) de pessoa: existe no calendário, é anterior a hoje e não é antes de 1900.
 * Devolve a mensagem do problema, ou null se estiver certa.
 */
export function problemaNaDataDeNascimento(iso: string, hoje: string): string | null {
  if (!iso) return 'Informe a data de nascimento.';
  const [ano, mes, dia] = iso.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  if (!ano || d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return 'A data de nascimento não existe no calendário.';
  }
  if (iso >= hoje) return 'A data de nascimento precisa ser anterior a hoje.';
  if (ano < 1900) return 'A data de nascimento não pode ser anterior a 1900.';
  return null;
}

/** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
export function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
