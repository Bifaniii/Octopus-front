import { Directive, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MascaraDirective } from './mascara.directive';
import { CNPJ_DIGITOS, CPF_DIGITOS, mascararCnpj, mascararCpf, mascararCpfCnpj, somenteAlfanumericos } from './formatos';

/** CPF com máscara: mostra "000.000.000-00" e guarda os 11 dígitos. */
@Directive({
  selector: 'input[appCpf]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CpfDirective), multi: true }],
})
export class CpfDirective extends MascaraDirective {
  protected maxDigitos = () => CPF_DIGITOS;
  protected formatar = mascararCpf;
}

/** CNPJ com máscara: mostra "00.000.000/0000-00" e guarda os 14 caracteres (números e letras maiúsculas). */
@Directive({
  selector: 'input[appCnpj]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CnpjDirective), multi: true }],
})
export class CnpjDirective extends MascaraDirective {
  protected maxDigitos = () => CNPJ_DIGITOS;
  protected formatar = mascararCnpj;
  protected override limpar = somenteAlfanumericos;
  protected override significativo = /[0-9A-Z]/;
}

/** Campo de CPF ou CNPJ: até 11 dígitos vira CPF, e a partir do 12º caractere (ou da primeira letra) vira CNPJ. */
@Directive({
  selector: 'input[appCpfCnpj]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CpfCnpjDirective), multi: true }],
})
export class CpfCnpjDirective extends MascaraDirective {
  protected maxDigitos = () => CNPJ_DIGITOS;
  protected formatar = mascararCpfCnpj;
  protected override limpar = somenteAlfanumericos;
  protected override significativo = /[0-9A-Z]/;
}
