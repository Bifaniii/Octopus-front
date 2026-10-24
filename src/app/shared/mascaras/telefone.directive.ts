import { Directive, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MascaraDirective } from './mascara.directive';
import { TELEFONE_MAX_DIGITOS, mascararTelefone } from './formatos';

/** Telefone com máscara: o campo mostra "(11) 99999-9999" e o formulário guarda "11999999999". */
@Directive({
  selector: 'input[appTelefone]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TelefoneDirective), multi: true }],
})
export class TelefoneDirective extends MascaraDirective {
  protected maxDigitos = () => TELEFONE_MAX_DIGITOS;
  protected formatar = mascararTelefone;

  /** Número colado com o código do país (+55 11 99999-9999) fica sem ele. */
  protected override aoColar(digitos: string): string {
    return digitos.length > TELEFONE_MAX_DIGITOS && digitos.startsWith('55') ? digitos.slice(2) : digitos;
  }
}
