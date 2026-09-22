import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';

/** Uma prescrição ativa, agrupando os itens de medicação de um animal. */
interface PrescricaoAtiva {
  id: string;
  animal: string;
  especie: string;
  registro: string;
  responsavel: string;
  status: string;
  /** Controla a cor da etiqueta de status — ver CSS. */
  variante: 'tratamento' | 'atencao' | 'cirurgico' | 'observacao';
  itens: string[];
}

/**
 * RegistroMedicamentosPaginaComponent
 * -------------------------------------
 * Base visual da tela "Registro de medicamentos" (mockup enviado pela
 * squad). Por enquanto é só a CASCA: dados estáticos, sem chamar
 * nenhum service. Próximos passos, quando formos ligar a lógica:
 *
 *  - Trocar `prescricoes` (mock) por dados vindos de um serviço
 *    (provavelmente a fonte é a Prescrição/Painel de doses do TAP —
 *    telas 5/6 —, não o catálogo de medicamentos da tela 3).
 *  - O botão "Cadastrar medicamento" hoje não faz nada
 *    (`onCadastrarClick`): decidir se ele abre o formulário que já
 *    existe em `MedicamentosPaginaComponent` ou se essa tela e
 *    aquela se fundem em uma só.
 *  - Os checkboxes de cada item são só visuais; ainda não registram
 *    a aplicação da dose (isso é regra de negócio — RN-03/RN-04/RN-05).
 */
@Component({
  selector: 'app-medication',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './medication.component.html',
  styleUrl: './medication.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationComponent {
  // Dados estáticos só para bater com o mockup. Substituir por uma
  // chamada de service quando a origem real dos dados for definida.
  protected readonly prescricoes: PrescricaoAtiva[] = [
    {
      id: '0231',
      animal: 'Rex',
      especie: 'Cachorro',
      registro: '0231',
      responsavel: 'Dra. Ana',
      status: 'Em tratamento',
      variante: 'tratamento',
      itens: [
        'Amoxicilina 250mg — 1 comprimido a cada 12h, por 7 dias',
        'Pomada cicatrizante — passar 2x ao dia na pata',
      ],
    },
    {
      id: '0198',
      animal: 'Mia',
      especie: 'Gato',
      registro: '0198',
      responsavel: 'Dr. Lucas',
      status: 'Atenção horário',
      variante: 'atencao',
      itens: [
        'Antipulgas oral — 1 dose única',
        'Vitamina em gotas — tomar das 8h às 20h, 3 gotas',
      ],
    },
    {
      id: '0245',
      animal: 'Thor',
      especie: 'Cachorro',
      registro: '0245',
      responsavel: 'Dra. Ana',
      status: 'Pós-cirúrgico',
      variante: 'cirurgico',
      itens: [
        'Anti-inflamatório 50mg — 1 comprimido ao dia, por 5 dias',
        'Analgésico — 2 comprimidos a cada 8h',
        'Pomada na incisão — passar 1x ao dia até cicatrizar',
      ],
    },
    {
      id: '0260',
      animal: 'Luna',
      especie: 'Cachorro (ninhada)',
      registro: '0260',
      responsavel: 'Equipe pet care',
      status: 'Observação',
      variante: 'observacao',
      itens: ['Suplemento pós-parto — 1 dose ao dia com a ração'],
    },
  ];

  protected onCadastrarClick(): void {
    // TODO: decidir o fluxo de cadastro e ligar aqui.
  }
}
