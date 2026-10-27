import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { destacarCampo, limparDestaques } from './campo-invalido';
import { CpfCnpjDirective, CpfDirective } from './documento.directive';
import {
  formatarTelefoneCadastrado,
  mascararCnpj,
  mascararCpf,
  mascararCpfCnpj,
  mascararTelefone,
  posicaoApos,
} from './formatos';
import { mensagemDosCampos } from './mensagens-api';
import { TelefoneDirective } from './telefone.directive';
import { DigitosDirective } from './texto.directive';
import { UFS } from './ufs';
import {
  cnpjCompleto,
  cpfCompleto,
  crmvValido,
  emailValido,
  nomeValido,
  problemaNoNomeDePessoa,
  problemaNaDataDeNascimento,
  telefoneValido,
} from './validacoes';

describe('formatos', () => {
  it('telefone: monta a máscara conforme os dígitos chegam', () => {
    expect(mascararTelefone('')).toBe('');
    expect(mascararTelefone('1')).toBe('(1');
    expect(mascararTelefone('119')).toBe('(11) 9');
    expect(mascararTelefone('1198765')).toBe('(11) 98765');
    expect(mascararTelefone('11987654')).toBe('(11) 98765-4');
    expect(mascararTelefone('11999999999')).toBe('(11) 99999-9999');
    expect(mascararTelefone('119999999990000')).toBe('(11) 99999-9999');
  });

  it('telefone já cadastrado: celular e o fixo antigo aparecem formatados, o resto volta como veio', () => {
    expect(formatarTelefoneCadastrado('11987654321')).toBe('(11) 98765-4321');
    expect(formatarTelefoneCadastrado('1133334444')).toBe('(11) 3333-4444');
    expect(formatarTelefoneCadastrado('123')).toBe('123');
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

  it('CNPJ alfanumérico: aceita letras maiúsculas e a máscara é a mesma', () => {
    expect(mascararCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(mascararCpfCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    // uma letra já indica CNPJ (CPF só tem números), então a máscara de CNPJ vale desde o começo
    expect(mascararCpfCnpj('12AB')).toBe('12.AB');
    // CPF continua só de números
    expect(mascararCpfCnpj('529.982.247-25')).toBe('529.982.247-25');
  });

  it('acha a posição logo depois do n-ésimo dígito', () => {
    expect(posicaoApos('(11) 99999-9999', 0)).toBe(0);
    expect(posicaoApos('(11) 99999-9999', 2)).toBe(3);
    expect(posicaoApos('(11) 99999-9999', 3)).toBe(6);
    expect(posicaoApos('(11) 99999-9999', 11)).toBe(15);
  });
});

describe('validações', () => {
  it('CPF e CNPJ: o front só confere o tamanho, quem confere o dígito verificador é o back', () => {
    expect(cpfCompleto('529.982.247-25')).toBeTrue();
    expect(cpfCompleto('11111111111')).toBeTrue(); // o back é que recusa
    expect(cpfCompleto('5299822472')).toBeFalse();
    expect(cnpjCompleto('11.222.333/0001-81')).toBeTrue();
    expect(cnpjCompleto('1122233300018')).toBeFalse();
    expect(cnpjCompleto('12.ABC.345/01DE-35')).toBeTrue(); // alfanumérico
    expect(cnpjCompleto('12.abc.345/01de-35')).toBeTrue(); // minúsculas viram maiúsculas na máscara
    expect(cnpjCompleto('12ABC34501DEAB')).toBeFalse(); // os dois últimos são números
    expect(cpfCompleto('52998224A25')).toBeFalse(); // CPF não tem letra
  });

  it('nome de pessoa: sem números e com sobrenome', () => {
    for (const bom of ['Maria Silva', 'João da Silva', 'Dra. Carla Souza', "Ana-Clara D'Ávila", 'José A. Pereira']) {
      expect(problemaNoNomeDePessoa(bom)).withContext(bom).toBeNull();
    }
    expect(problemaNoNomeDePessoa('aaa12131241')).toBe('O nome não pode ter números.');
    expect(problemaNoNomeDePessoa('Maria Silva 2')).toBe('O nome não pode ter números.');
    expect(problemaNoNomeDePessoa('Maria')).toBe('Informe nome e sobrenome.');
    expect(problemaNoNomeDePessoa('M. S.')).toBe('Informe nome e sobrenome.');
    expect(problemaNoNomeDePessoa('Ana#Souza')).toContain('só pode ter letras');
    expect(problemaNoNomeDePessoa('  ')).toBe('Informe o nome.');
    // nome de animal segue a regra frouxa: "Rex" não tem sobrenome
    expect(nomeValido('Rex')).toBeTrue();
  });

  it('telefone: só celular, com 11 dígitos e o 9 depois do DDD', () => {
    expect(telefoneValido('11999999999')).toBeTrue();
    expect(telefoneValido('(21) 98765-4321')).toBeTrue();
    expect(telefoneValido('1133334444')).toBeFalse(); // fixo
    expect(telefoneValido('11899999999')).toBeFalse(); // sem o 9
    expect(telefoneValido('119999999')).toBeFalse();
  });

  it('e-mail, nome e CRMV', () => {
    expect(emailValido('nome@clinica.com')).toBeTrue();
    expect(emailValido('nome@clinica')).toBeFalse();
    expect(emailValido('nome clinica@x.com')).toBeFalse();
    expect(nomeValido('Ana')).toBeTrue();
    expect(nomeValido('123')).toBeFalse();
    expect(crmvValido('12345')).toBeTrue();
    expect(crmvValido('7')).toBeTrue();
    expect(crmvValido('123456')).toBeFalse(); // até 5 dígitos
    expect(crmvValido('12A45')).toBeFalse();
    expect(crmvValido('')).toBeFalse();
  });

  it('a lista de UFs tem os 26 estados e o DF, em ordem', () => {
    const siglas = UFS.map((u) => u.sigla);
    expect(siglas.length).toBe(27);
    expect(siglas).toContain('SP');
    expect(siglas).toContain('DF');
    expect([...siglas].sort()).toEqual([...siglas]);
  });

  it('data de nascimento: existe, é anterior a hoje e não é antes de 1900', () => {
    const hoje = '2026-10-24';
    expect(problemaNaDataDeNascimento('1990-05-02', hoje)).toBeNull();
    expect(problemaNaDataDeNascimento('', hoje)).toContain('Informe');
    expect(problemaNaDataDeNascimento('2026-10-24', hoje)).toContain('anterior a hoje');
    expect(problemaNaDataDeNascimento('1850-01-01', hoje)).toContain('1900');
    expect(problemaNaDataDeNascimento('2021-02-30', hoje)).toContain('calendário');
  });

  it('mensagens do back: rótulo legível, sem repetir quando a frase já começa por ele', () => {
    expect(mensagemDosCampos({ crmv: 'deve ter de 1 a 5 dígitos numéricos' })).toBe('CRMV: deve ter de 1 a 5 dígitos numéricos');
    expect(mensagemDosCampos({ cpfCnpj: 'CPF inválido: pessoa física precisa de um CPF' })).toBe(
      'CPF inválido: pessoa física precisa de um CPF',
    );
    expect(mensagemDosCampos({ crmvUf: 'Valor inválido', campoNovo: 'x' })).toBe('UF do CRMV: Valor inválido · campoNovo: x');
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TelefoneDirective, CpfDirective, CpfCnpjDirective, DigitosDirective],
  template: `
    <div id="raiz">
      <input id="tel" appTelefone [formControl]="telefone" />
      <input id="cpf" appCpf [formControl]="cpf" />
      <input id="doc" appCpfCnpj [formControl]="doc" />
      <input id="cod" appDigitos="6" [formControl]="codigo" />
    </div>
  `,
})
class CamposTesteComponent {
  telefone = new FormControl('', { nonNullable: true });
  cpf = new FormControl('', { nonNullable: true });
  doc = new FormControl('', { nonNullable: true });
  codigo = new FormControl('', { nonNullable: true });
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
    expect(el('tel').value).toBe('(11) 98764-321');
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

  it('CPF ou CNPJ: aceita letras do CNPJ alfanumérico, em maiúsculas, e entrega os 14 caracteres', () => {
    digitar('doc', '12abc34501de35');
    expect(el('doc').value).toBe('12.ABC.345/01DE-35');
    expect(c.doc.value).toBe('12ABC34501DE35');
    digitar('doc', '12.ABC.345/01DE-35X'); // passa do limite de 14
    expect(c.doc.value).toBe('12ABC34501DE35');
  });

  it('dígitos: tira o que não é número e respeita o limite', () => {
    digitar('cod', '12a3-45678');
    expect(el('cod').value).toBe('123456');
    expect(c.codigo.value).toBe('123456');
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
