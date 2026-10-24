import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TELEFONE_MAX_DIGITOS, mascararTelefone, posicaoApos, somenteDigitos } from './telefone';

/**
 * Campo de telefone com máscara. Quem digita vê "(11) 99999-9999", mas o formulário guarda e envia só os
 * dígitos ("11999999999"). Uso: `<input appTelefone formControlName="telefone" />`.
 */
@Directive({
  selector: 'input[appTelefone]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TelefoneDirective), multi: true }],
  host: { '(input)': 'aoDigitar($event)', '(blur)': 'aoSair()' },
})
export class TelefoneDirective implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private digitos = '';
  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  writeValue(valor: string | null): void {
    this.digitos = somenteDigitos(valor ?? '').slice(0, TELEFONE_MAX_DIGITOS);
    this.input.value = mascararTelefone(this.digitos);
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

  aoSair(): void {
    this.aoTocar();
  }

  aoDigitar(evento: Event): void {
    const tipo = (evento as InputEvent).inputType ?? '';
    const texto = this.input.value;
    const cursor = this.input.selectionStart ?? texto.length;
    let digitos = somenteDigitos(texto);
    let antesDoCursor = somenteDigitos(texto.slice(0, cursor)).length;

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

    // Número colado com o código do país (+55 11 99999-9999): fica sem ele.
    if (tipo === 'insertFromPaste' && digitos.length > TELEFONE_MAX_DIGITOS && digitos.startsWith('55')) {
      digitos = digitos.slice(2);
      antesDoCursor = Math.max(0, antesDoCursor - 2);
    }

    digitos = digitos.slice(0, TELEFONE_MAX_DIGITOS);
    const formatado = mascararTelefone(digitos);
    this.input.value = formatado;
    if (document.activeElement === this.input) {
      const posicao = posicaoApos(formatado, Math.min(antesDoCursor, digitos.length));
      this.input.setSelectionRange(posicao, posicao);
    }

    if (digitos !== this.digitos) {
      this.digitos = digitos;
      this.aoMudar(digitos);
    }
  }
}
