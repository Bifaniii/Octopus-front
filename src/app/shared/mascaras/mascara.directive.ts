import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { posicaoApos, somenteDigitos } from './formatos';

/**
 * Base das máscaras numéricas. Quem digita vê o texto formatado ("(11) 99999-9999", "000.000.000-00"), mas o
 * formulário guarda e envia só os dígitos. Cada máscara diz quantos dígitos aceita e como formatá-los.
 */
@Directive()
export abstract class MascaraDirective implements ControlValueAccessor {
  protected readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private digitos = '';
  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  /** O que a máscara guarda: por padrão só dígitos. O CNPJ sobrescreve para aceitar também letras. */
  protected limpar(texto: string): string {
    return somenteDigitos(texto);
  }

  /** Caractere que conta para a posição do cursor (mesmo critério de `limpar`). */
  protected significativo = /\d/;

  protected abstract maxDigitos(): number;
  protected abstract formatar(digitos: string): string;

  /** Ajuste do que foi colado antes de aplicar o limite (ex.: tirar o +55 do telefone). */
  protected aoColar(digitos: string): string {
    return digitos;
  }

  writeValue(valor: string | null): void {
    this.digitos = this.limpar(valor ?? '').slice(0, this.maxDigitos());
    this.input.value = this.formatar(this.digitos);
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.input.disabled = desabilitado;
  }

  @HostListener('blur')
  aoSair(): void {
    this.aoTocar();
  }

  @HostListener('input', ['$event'])
  aoDigitar(evento: Event): void {
    const tipo = (evento as InputEvent).inputType ?? '';
    const texto = this.input.value;
    const cursor = this.input.selectionStart ?? texto.length;
    let digitos = this.limpar(texto);
    let antesDoCursor = this.limpar(texto.slice(0, cursor)).length;

    // Apagar só um símbolo da máscara, como "-" ou ")", não muda os dígitos e a máscara o devolveria: nesse caso
    // o que a pessoa quer é apagar o dígito vizinho.
    if (tipo.startsWith('delete') && digitos === this.digitos) {
      if (tipo === 'deleteContentForward') {
        digitos = digitos.slice(0, antesDoCursor) + digitos.slice(antesDoCursor + 1);
      } else if (antesDoCursor > 0) {
        digitos = digitos.slice(0, antesDoCursor - 1) + digitos.slice(antesDoCursor);
        antesDoCursor--;
      }
    }

    if (tipo === 'insertFromPaste') {
      const ajustado = this.aoColar(digitos);
      antesDoCursor = Math.max(0, antesDoCursor - (digitos.length - ajustado.length));
      digitos = ajustado;
    }

    digitos = digitos.slice(0, this.maxDigitos());
    const formatado = this.formatar(digitos);
    this.input.value = formatado;
    if (document.activeElement === this.input) {
      const posicao = posicaoApos(formatado, Math.min(antesDoCursor, digitos.length), this.significativo);
      this.input.setSelectionRange(posicao, posicao);
    }

    if (digitos !== this.digitos) {
      this.digitos = digitos;
      this.aoMudar(digitos);
    }
  }
}
