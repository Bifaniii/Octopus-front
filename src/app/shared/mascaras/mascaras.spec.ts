import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { destacarCampo, limparDestaques } from './campo-invalido';
import { CpfCnpjDirective, CpfDirective } from './documento.directive';
import { mascararCnpj, mascararCpf, mascararCpfCnpj, mascararTelefone, posicaoApos } from './formatos';
import { TelefoneDirective } from './telefone.directive';
import { DigitosDirective, UfDirective } from './texto.directive';
import {
  cnpjValido,
  cpfValido,
  crmvValido,
  emailValido,
  nomeValido,
  problemaNaDataDeNascimento,
  telefoneValido,
  ufValida,
} from './validacoes';

describe('formatos', () => {
  it('telefone: monta a máscara conforme os dígitos chegam', () => {
    expect(mascararTelefone('')).toBe('');
    expect(mascararTelefone('1')).toBe('(1');
    expect(mascararTelefone('119')).toBe('(11) 9');
    expect(mascararTelefone('1199999')).toBe('(11) 9999-9');
    expect(mascararTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(mascararTelefone('11999999999')).toBe('(11) 99999-9999');
    expect(mascararTelefone('119999999990000')).toBe('(11) 99999-9999');
  });

  it('CPF e CNPJ: pontos, barra e traço no lugar certo', () => {
    expect(mascararCpf('5')).toBe('5');
    expect(mascararCpf('52998')).toBe('529.98');
    expect(mascararCpf('52998224')).toBe('529.982.24');
    expect(mascararCpf('52998224725')).toBe('529.982.247-25');
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararCnpj('112223')).toBe('11.222.3');
  });

  it('campo de CPF ou CNPJ vira CNPJ a partir do 12º dígito', () => {
    expect(mascararCpfCnpj('52998224725')).toBe('529.982.247-25');
    expect(mascararCpfCnpj('112223330001')).toBe('11.222.333/0001');
    expect(mascararCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('acha a posição logo depois do n-ésimo dígito', () => {
    expect(posicaoApos('(11) 99999-9999', 0)).toBe(0);
    expect(posicaoApos('(11) 99999-9999', 2)).toBe(3);
    expect(posicaoApos('(11) 99999-9999', 3)).toBe(6);
    expect(posicaoApos('(11) 99999-9999', 11)).toBe(15);
  });
});

describe('validações', () => {
  it('CPF confere o dígito verificador e recusa sequência repetida', () => {
    expect(cpfValido('52998224725')).toBeTrue();
    expect(cpfValido('529.982.247-25')).toBeTrue();
    expect(cpfValido('11144477735')).toBeTrue();
    expect(cpfValido('52998224726')).toBeFalse();
    expect(cpfValido('11111111111')).toBeFalse();
    expect(cpfValido('1234567890')).toBeFalse();
  });

  it('CNPJ confere os dois dígitos verificadores', () => {
    expect(cnpjValido('11222333000181')).toBeTrue();
    expect(cnpjValido('11.444.777/0001-61')).toBeTrue();
    expect(cnpjValido('11222333000182')).toBeFalse();
    expect(cnpjValido('00000000000000')).toBeFalse();
    expect(cnpjValido('1122233300018')).toBeFalse();
  });

  it('telefone exige DDD que existe, 9 no celular e 2 a 5 no fixo', () => {
    expect(telefoneValido('11999999999')).toBeTrue();
    expect(telefoneValido('1133334444')).toBeTrue();
    expect(telefoneValido('(21) 98765-4321')).toBeTrue();
    expect(telefoneValido('10999999999')).toBeFalse(); // DDD 10 não existe
    expect(telefoneValido('11899999999')).toBeFalse(); // celular sem o 9
    expect(telefoneValido('1163334444')).toBeFalse(); // fixo começando em 6
    expect(telefoneValido('119999999')).toBeFalse();
  });

  it('e-mail, nome, UF e CRMV', () => {
    expect(emailValido('nome@clinica.com')).toBeTrue();
    expect(emailValido('nome@clinica')).toBeFalse();
    expect(emailValido('nome clinica@x.com')).toBeFalse();
    expect(nomeValido('Ana')).toBeTrue();
    expect(nomeValido('123')).toBeFalse();
    expect(nomeValido('-')).toBeFalse();
    expect(ufValida('sp')).toBeTrue();
    expect(ufValida('XX')).toBeFalse();
    expect(crmvValido('12345')).toBeTrue();
    expect(crmvValido('SP-12345')).toBeTrue();
    expect(crmvValido('12 345')).toBeFalse();
    expect(crmvValido('')).toBeFalse();
  });

  it('data de nascimento: existe, é anterior a hoje e não é antes de 1900', () => {
    const hoje = '2026-10-24';
    expect(problemaNaDataDeNascimento('1990-05-02', hoje)).toBeNull();
    expect(problemaNaDataDeNascimento('', hoje)).toContain('Informe');
    expect(problemaNaDataDeNascimento('2026-10-24', hoje)).toContain('anterior a hoje');
    expect(problemaNaDataDeNascimento('2030-01-01', hoje)).toContain('anterior a hoje');
    expect(problemaNaDataDeNascimento('1850-01-01', hoje)).toContain('1900');
    expect(problemaNaDataDeNascimento('2021-02-30', hoje)).toContain('calendário');
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TelefoneDirective, CpfDirective, CpfCnpjDirective, DigitosDirective, UfDirective],
  template: `
    <div id="raiz">
      <input id="tel" appTelefone [formControl]="telefone" />
      <input id="cpf" appCpf [formControl]="cpf" />
      <input id="doc" appCpfCnpj [formControl]="doc" />
      <input id="cod" appDigitos="6" [formControl]="codigo" />
      <input id="uf" appUf [formControl]="uf" />
    </div>
  `,
})
class CamposTesteComponent {
  telefone = new FormControl('', { nonNullable: true });
  cpf = new FormControl('', { nonNullable: true });
  doc = new FormControl('', { nonNullable: true });
  codigo = new FormControl('', { nonNullable: true });
  uf = new FormControl('', { nonNullable: true });
}

describe('diretivas de máscara', () => {
  let fixture: ComponentFixture<CamposTesteComponent>;
  let c: CamposTesteComponent;
  const el = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(CamposTesteComponent);
    c = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Simula o navegador: troca o texto, põe o cursor no fim e dispara o evento `input`. */
  function digitar(id: string, texto: string, inputType = 'insertText', cursor = texto.length): void {
    const input = el(id);
    input.value = texto;
    input.setSelectionRange(cursor, cursor);
    input.dispatchEvent(new InputEvent('input', { inputType }));
  }

  it('telefone: mostra a máscara e entrega só os dígitos', () => {
    digitar('tel', '11999999999');
    expect(el('tel').value).toBe('(11) 99999-9999');
    expect(c.telefone.value).toBe('11999999999');
  });

  it('telefone: não passa de 11 dígitos', () => {
    digitar('tel', '11999999999');
    digitar('tel', '(11) 99999-99991');
    expect(el('tel').value).toBe('(11) 99999-9999');
    expect(c.telefone.value).toBe('11999999999');
  });

  it('mostra formatado o valor que vem do formulário (edição) e limpa quando zera', () => {
    c.telefone.setValue('11987654321');
    c.cpf.setValue('52998224725');
    c.doc.setValue('11222333000181');
    expect(el('tel').value).toBe('(11) 98765-4321');
    expect(el('cpf').value).toBe('529.982.247-25');
    expect(el('doc').value).toBe('11.222.333/0001-81');
    c.telefone.setValue('');
    expect(el('tel').value).toBe('');
  });

  it('apagar o hífen apaga o dígito vizinho em vez de devolver o símbolo', () => {
    digitar('tel', '11987654321');
    digitar('tel', '(11) 987654321', 'deleteContentBackward', 10);
    expect(c.telefone.value).toBe('1198764321');
    expect(el('tel').value).toBe('(11) 9876-4321');
  });

  it('número colado com +55 fica sem o código do país', () => {
    digitar('tel', '+55 (11) 99999-9999', 'insertFromPaste');
    expect(c.telefone.value).toBe('11999999999');
  });

  it('CPF: pontos e traço enquanto digita, só dígitos no formulário', () => {
    digitar('cpf', '52998224725');
    expect(el('cpf').value).toBe('529.982.247-25');
    expect(c.cpf.value).toBe('52998224725');
    digitar('cpf', '529.982.247-251');
    expect(c.cpf.value).toBe('52998224725');
  });

  it('CPF ou CNPJ: troca a máscara conforme o tamanho', () => {
    digitar('doc', '52998224725');
    expect(el('doc').value).toBe('529.982.247-25');
    digitar('doc', '529.982.247-251');
    expect(el('doc').value).toBe('52.998.224/7251');
    digitar('doc', '11222333000181');
    expect(el('doc').value).toBe('11.222.333/0001-81');
    expect(c.doc.value).toBe('11222333000181');
  });

  it('dígitos: tira o que não é número e respeita o limite', () => {
    digitar('cod', '12a3-45678');
    expect(el('cod').value).toBe('123456');
    expect(c.codigo.value).toBe('123456');
  });

  it('UF: só letras, maiúsculas, no máximo 2', () => {
    digitar('uf', 's1p9');
    expect(el('uf').value).toBe('SP');
    expect(c.uf.value).toBe('SP');
  });

  it('só avisa o formulário quando os dígitos mudam', () => {
    let avisos = 0;
    c.telefone.valueChanges.subscribe(() => avisos++);
    digitar('tel', '1');
    digitar('tel', '1', 'insertText');
    expect(avisos).toBe(1);
  });
});

describe('destacarCampo', () => {
  it('marca o campo, leva o foco e solta a marca quando a pessoa digita', () => {
    const raiz = document.createElement('div');
    raiz.innerHTML = '<input formControlName="cpf" /><input formControlName="nome" />';
    document.body.appendChild(raiz);
    const cpf = raiz.querySelector('[formControlName="cpf"]') as HTMLInputElement;

    destacarCampo(raiz, 'cpf');
    expect(cpf.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(cpf);

    cpf.dispatchEvent(new Event('input'));
    expect(cpf.hasAttribute('aria-invalid')).toBeFalse();

    destacarCampo(raiz, 'nome');
    limparDestaques(raiz);
    expect(raiz.querySelectorAll('[aria-invalid]').length).toBe(0);
    raiz.remove();
  });
});
