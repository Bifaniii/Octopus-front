import { CPF_DIGITOS, somenteAlfanumericos, somenteDigitos } from './formatos';

/**
 * Validações de formulário que o front faz sozinho: só o formato, para a pessoa corrigir sem esperar a resposta.
 * Quem decide se CPF, CNPJ e celular são válidos é o back (dígito verificador, DDD): o front mostra a mensagem dele.
 */

/** CPF com os 11 dígitos digitados. Se o número existe de verdade, quem diz é o back. */
export function cpfCompleto(valor: string): boolean {
  return somenteDigitos(valor).length === CPF_DIGITOS;
}

/** CNPJ completo: 12 posições de 0-9 ou A-Z e 2 dígitos. O dígito verificador é conferido no back. */
export function cnpjCompleto(valor: string): boolean {
  return /^[0-9A-Z]{12}\d{2}$/.test(somenteAlfanumericos(valor));
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

/**
 * Nome de pessoa (usuário ou tutor): só letras, espaço, apóstrofo, hífen e ponto, sem números, e com nome e
 * sobrenome (duas palavras de 2 letras ou mais). Devolve a mensagem do problema, ou null se estiver certo.
 * Nome de animal tem regra mais frouxa (`nomeValido`): "Rex" não tem sobrenome.
 */
export function problemaNoNomeDePessoa(valor: string): string | null {
  const nome = valor.trim();
  if (!nome) return 'Informe o nome.';
  if (/\d/.test(nome)) return 'O nome não pode ter números.';
  if (!/^[\p{L}\p{M}\s'’.-]+$/u.test(nome)) return 'O nome só pode ter letras, espaço, hífen, apóstrofo e ponto.';
  const palavras = nome.split(/\s+/).filter((p) => (p.match(/\p{L}/gu) ?? []).length >= 2);
  if (palavras.length < 2) return 'Informe nome e sobrenome.';
  return null;
}

/** CRMV: de 1 a 5 dígitos numéricos. */
export function crmvValido(valor: string): boolean {
  return /^\d{1,5}$/.test(valor.trim());
}

/** Veterinário: o mínimo de uma formação em medicina veterinária concluída (o back confere o mesmo valor). */
export const IDADE_MINIMA_VETERINARIO = 23;

/** Maioridade: auxiliar, recepcionista e tutor (o back confere o mesmo valor). */
export const IDADE_MINIMA_ADULTO = 18;

/** Anos completos em `hoje` de quem nasceu em `nascimento` (aaaa-MM-dd). */
export function idadeEmAnos(nascimento: string, hoje: string): number {
  const [an, mn, dn] = nascimento.split('-').map(Number);
  const [ah, mh, dh] = hoje.split('-').map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

/**
 * Último nascimento (aaaa-MM-dd) que já atinge `anos` em `hoje`, para o `max` do campo de data. Em 29/02 de um
 * ano sem 29/02 vale 28/02, como na conta do back.
 */
export function nascimentoMaximoPara(anos: number, hoje: string): string {
  const [ano, mes, dia] = hoje.split('-').map(Number);
  const alvo = ano - anos;
  const ultimoDia = new Date(alvo, mes, 0).getDate();
  return `${alvo}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, ultimoDia)).padStart(2, '0')}`;
}

/**
 * Data de nascimento (aaaa-MM-dd) de pessoa: existe no calendário, é anterior a hoje, não é antes de 1900 e, se
 * `idadeMinima` vier, a pessoa já tem essa idade (`quem` entra na mensagem). Devolve a mensagem do problema, ou
 * null se estiver certa.
 */
export function problemaNaDataDeNascimento(
  iso: string,
  hoje: string,
  idadeMinima?: number,
  quem = 'A pessoa',
): string | null {
  if (!iso) return 'Informe a data de nascimento.';
  const [ano, mes, dia] = iso.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  if (!ano || d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return 'A data de nascimento não existe no calendário.';
  }
  if (iso >= hoje) return 'A data de nascimento precisa ser anterior a hoje.';
  if (ano < 1900) return 'A data de nascimento não pode ser anterior a 1900.';
  if (idadeMinima && idadeEmAnos(iso, hoje) < idadeMinima) return `${quem} precisa ter pelo menos ${idadeMinima} anos.`;
  return null;
}

/** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
export function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
