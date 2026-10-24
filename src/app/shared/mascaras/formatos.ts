/** Celular: DDD + 9 dígitos. Telefone fixo não é aceito por enquanto (o back também recusa). */
export const TELEFONE_MAX_DIGITOS = 11;
export const CPF_DIGITOS = 11;
export const CNPJ_DIGITOS = 14;

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Máscara de celular, montada conforme os dígitos chegam: "(11) 99999-9999". */
export function mascararTelefone(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, TELEFONE_MAX_DIGITOS);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Telefone já cadastrado, para mostrar na tela: o celular de 11 dígitos e também o fixo de 10 que ficou de antes da
 * regra "só celular". Qualquer outro tamanho volta como veio.
 */
export function formatarTelefoneCadastrado(telefone: string): string {
  const d = somenteDigitos(telefone);
  if (d.length === 11) return mascararTelefone(d);
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** "000.000.000-00", montado conforme os dígitos chegam. */
export function mascararCpf(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, CPF_DIGITOS);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** "00.000.000/0000-00", montado conforme os dígitos chegam. */
export function mascararCnpj(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, CNPJ_DIGITOS);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Campo que aceita os dois: até 11 dígitos é CPF, e a partir do 12º vira CNPJ. */
export function mascararCpfCnpj(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, CNPJ_DIGITOS);
  return d.length <= CPF_DIGITOS ? mascararCpf(d) : mascararCnpj(d);
}

/** Posição logo depois do n-ésimo dígito do texto formatado (0 se n for 0), para devolver o cursor ao lugar certo. */
export function posicaoApos(formatado: string, quantidadeDeDigitos: number): number {
  if (quantidadeDeDigitos <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < formatado.length; i++) {
    if (/\d/.test(formatado[i]) && ++vistos === quantidadeDeDigitos) return i + 1;
  }
  return formatado.length;
}
