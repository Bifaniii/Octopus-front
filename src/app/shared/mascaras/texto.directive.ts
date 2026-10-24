import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { forwardRef } from '@angular/core';
import { somenteDigitos } from './formatos';

/**
 * Campo só de dígitos, sem pontos nem traços, com limite de tamanho: `<input appDigitos="11" ... />`. Serve para o
 * registro da ANVISA e para o código de redefinição de senha.
 */
@Directive({
  selector: 'input[appDigitos]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DigitosDirective), multi: true }],
})
export class DigitosDirective implements ControlValueAccessor {
  @Input('appDigitos') maximo: number | string = 11;

  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  private limpar(valor: string): string {
    return somenteDigitos(valor).slice(0, Number(this.maximo));
  }

  writeValue(valor: string | null): void {
    this.input.value = this.limpar(valor ?? '');
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

  @HostListener('input')
  aoDigitar(): void {
    const limpo = this.limpar(this.input.value);
    if (limpo !== this.input.value) this.input.value = limpo;
    this.aoMudar(limpo);
  }
}

/** Sigla de estado: só letras, sempre maiúsculas, no máximo 2 (`<input appUf ... />`). */
@Directive({
  selector: 'input[appUf]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UfDirective), multi: true }],
})
export class UfDirective implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  private limpar(valor: string): string {
    return valor.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
  }

  writeValue(valor: string | null): void {
    this.input.value = this.limpar(valor ?? '');
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

  @HostListener('input')
  aoDigitar(): void {
    const limpo = this.limpar(this.input.value);
    if (limpo !== this.input.value) this.input.value = limpo;
    this.aoMudar(limpo);
  }
}
