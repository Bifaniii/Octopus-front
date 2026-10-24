/**
 * Marca o campo com erro (borda vermelha, via `[aria-invalid='true']` no tema) e leva o foco até ele. A marca sai
 * sozinha quando a pessoa mexe no campo. `controle` é o nome do `formControlName`.
 */
export function destacarCampo(raiz: ParentNode | null | undefined, controle: string): void {
  limparDestaques(raiz);
  const campo = raiz?.querySelector<HTMLElement>(`[formControlName="${controle}"]`);
  if (!campo) return;
  campo.setAttribute('aria-invalid', 'true');
  campo.focus();
  const limpar = () => campo.removeAttribute('aria-invalid');
  campo.addEventListener('input', limpar, { once: true });
  campo.addEventListener('change', limpar, { once: true });
}

export function limparDestaques(raiz: ParentNode | null | undefined): void {
  raiz?.querySelectorAll('[aria-invalid="true"]').forEach((e) => e.removeAttribute('aria-invalid'));
}
