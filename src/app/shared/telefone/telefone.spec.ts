import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TelefoneDirective } from './telefone.directive';
import { mascararTelefone, posicaoApos } from './telefone';

describe('mascararTelefone', () => {
  it('monta a máscara conforme os dígitos chegam', () => {
    expect(mascararTelefone('')).toBe('');
    expect(mascararTelefone('1')).toBe('(1');
    expect(mascararTelefone('11')).toBe('(11');
    expect(mascararTelefone('119')).toBe('(11) 9');
    expect(mascararTelefone('1199999')).toBe('(11) 9999-9');
    expect(mascararTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(mascararTelefone('11999999999')).toBe('(11) 99999-9999');
  });

  it('ignora o que não é dígito e corta em 11', () => {
    expect(mascararTelefone('(11) 99999-9999')).toBe('(11) 99999-9999');
    expect(mascararTelefone('119999999990000')).toBe('(11) 99999-9999');
  });

  it('acha a posição logo depois do n-ésimo dígito', () => {
    expect(posicaoApos('(11) 99999-9999', 0)).toBe(0);
    expect(posicaoApos('(11) 99999-9999', 2)).toBe(3);
    expect(posicaoApos('(11) 99999-9999', 3)).toBe(6);
    expect(posicaoApos('(11) 99999-9999', 11)).toBe(15);
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TelefoneDirective],
  template: `<input appTelefone [formControl]="controle" />`,
})
class CampoTesteComponent {
  controle = new FormControl('', { nonNullable: true });
}

describe('TelefoneDirective', () => {
  let fixture: ComponentFixture<CampoTesteComponent>;
  let input: HTMLInputElement;
  let controle: FormControl<string>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CampoTesteComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    controle = fixture.componentInstance.controle;
  });

  /** Simula o navegador: troca o texto, põe o cursor no fim e dispara o evento `input`. */
  function digitar(texto: string, inputType = 'insertText', cursor = texto.length): void {
    input.value = texto;
    input.setSelectionRange(cursor, cursor);
    input.dispatchEvent(new InputEvent('input', { inputType }));
  }

  it('mostra a máscara e entrega só os dígitos ao formulário', () => {
    digitar('11999999999');
    expect(input.value).toBe('(11) 99999-9999');
    expect(controle.value).toBe('11999999999');
  });

  it('não passa de 11 dígitos', () => {
    digitar('11999999999');
    digitar('(11) 99999-99991');
    expect(input.value).toBe('(11) 99999-9999');
    expect(controle.value).toBe('11999999999');
  });

  it('mostra formatado o valor que vem do formulário (edição)', () => {
    controle.setValue('11987654321');
    expect(input.value).toBe('(11) 98765-4321');
    controle.setValue('');
    expect(input.value).toBe('');
  });

  it('apagar o hífen apaga o dígito vizinho em vez de devolver o símbolo', () => {
    digitar('11987654321');
    // O texto era "(11) 98765-4321"; o "-" foi apagado, com o cursor logo depois de onde ele estava.
    digitar('(11) 987654321', 'deleteContentBackward', 10);
    expect(controle.value).toBe('1198764321');
    expect(input.value).toBe('(11) 9876-4321');
  });

  it('número colado com +55 fica sem o código do país', () => {
    digitar('+55 (11) 99999-9999', 'insertFromPaste');
    expect(controle.value).toBe('11999999999');
    expect(input.value).toBe('(11) 99999-9999');
  });

  it('só avisa o formulário quando os dígitos mudam', () => {
    let avisos = 0;
    controle.valueChanges.subscribe(() => avisos++);
    digitar('1');
    digitar('1', 'insertText');
    expect(avisos).toBe(1);
  });
});
