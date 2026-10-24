import { CNPJ_DIGITOS, CPF_DIGITOS, somenteDigitos } from './formatos';

/**
 * Validações de formulário que não dependem do back. O back confere só o formato (11 ou 14 dígitos, tamanho
 * máximo); aqui também se confere o que ele não vê, como o dígito verificador, para a pessoa corrigir na hora.
 */

const todosIguais = (d: string) => /^(\d)\1+$/.test(d);

export function cpfValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== CPF_DIGITOS || todosIguais(d)) return false;
  const digito = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function cnpjValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== CNPJ_DIGITOS || todosIguais(d)) return false;
  const digito = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, i) => acc + Number(d[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return (
    digito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
    digito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}

const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92,
  93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Celular: DDD + 9 + 8 dígitos (11). Fixo: DDD + 8 dígitos começando de 2 a 5 (10). O DDD precisa existir.
 */
export function telefoneValido(valor: string): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 10 && d.length !== 11) return false;
  if (!DDDS_VALIDOS.has(Number(d.slice(0, 2)))) return false;
  return d.length === 11 ? d[2] === '9' : /[2-5]/.test(d[2]);
}

export function emailValido(valor: string): boolean {
  const e = valor.trim();
  return e.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Pelo menos duas letras: recusa nome vazio, só número ou só símbolo. */
export function nomeValido(valor: string): boolean {
  return (valor.match(/\p{L}/gu) ?? []).length >= 2;
}

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export function ufValida(valor: string): boolean {
  return UFS.includes(valor.trim().toUpperCase());
}

/** CRMV: letras, números, ponto, hífen ou barra, até 20 caracteres (o limite do back). */
export function crmvValido(valor: string): boolean {
  return /^[A-Za-z0-9./-]{1,20}$/.test(valor.trim());
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
