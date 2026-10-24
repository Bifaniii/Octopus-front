/** Nome legível de cada campo que o back valida, para a mensagem de erro não mostrar o nome técnico. */
const ROTULOS: Record<string, string> = {
  nome: 'Nome',
  email: 'E-mail',
  senha: 'Senha',
  telefone: 'Telefone',
  dataNascimento: 'Data de nascimento',
  cpf: 'CPF',
  cpfCnpj: 'CPF ou CNPJ',
  tipoPessoa: 'Tipo de pessoa',
  crmv: 'CRMV',
  crmvUf: 'UF do CRMV',
  especializacao: 'Especialização',
  endereco: 'Endereço',
};

/**
 * Junta os erros de campo que o back devolve (`campos`) numa frase. Se a mensagem já começa pelo nome do campo
 * ("CPF inválido: ..."), não repete o rótulo na frente.
 */
export function mensagemDosCampos(campos: Record<string, string>): string {
  return Object.entries(campos)
    .map(([campo, mensagem]) => {
      const rotulo = ROTULOS[campo] ?? campo;
      const primeira = rotulo.split(' ')[0].toLowerCase();
      return mensagem.toLowerCase().startsWith(primeira) ? mensagem : `${rotulo}: ${mensagem}`;
    })
    .join(' · ');
}
