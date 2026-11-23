export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  lead: string;
  sections: { title: string; text: string }[];
  question: { prompt: string; options: string[]; correct: number; explanation: string };
};
export type Module = {
  id: string; title: string; eyebrow: string; description: string; category: string; lessons: Lesson[];
};
const lesson = (
  id: string, title: string, lead: string, sections: [string, string][],
  prompt: string, options: string[], correct: number, explanation: string, minutes = 7
): Lesson => ({ id, title, lead, minutes,
  sections: sections.map(([title, text]) => ({ title, text })),
  question: { prompt, options, correct, explanation } });
const module = (id: string, title: string, eyebrow: string, description: string, category: string, lessons: Lesson[]): Module =>
  ({ id, title, eyebrow, description, category, lessons });

export const modules: Module[] = [
  module("fundamentos", "O começo de tudo", "01 / FUNDAMENTOS",
    "Entenda o que faz um automóvel ganhar vida e domine o vocabulário essencial.", "Fundamentos", [
    lesson("anatomia-carro", "Anatomia de um automóvel", "Antes de falar de potência, descubra como os sistemas trabalham juntos.",
      [["O caminho da energia", "Em um carro a combustão, o motor transforma a energia química do combustível em movimento giratório. A transmissão leva esse movimento às rodas motrizes. Pneus, suspensão, direção e freios permitem controlar o carro com segurança."],
      ["Conjuntos essenciais", "Motor, transmissão, chassi, carroceria, sistema elétrico, arrefecimento, direção e freios são sistemas distintos e conectados. Um defeito em um deles pode afetar outros: o motor pode funcionar perfeitamente e o veículo não se mover devido a uma falha na transmissão."]],
      "Qual conjunto leva a força produzida pelo motor às rodas?", ["Sistema de arrefecimento", "Transmissão", "Sistema de iluminação", "Freios"], 1,
      "A transmissão transfere torque do motor às rodas por meio de embreagem ou conversor, caixa de marchas, eixos e diferencial."),
    lesson("potencia-torque", "Potência, torque e RPM", "Três números aparecem em toda conversa sobre desempenho. Eles não são sinônimos.",
      [["Torque é esforço de giro", "Torque, medido em N·m, é a capacidade de uma força provocar rotação. No virabrequim, representa o esforço giratório disponível em cada rotação."],
      ["Potência inclui velocidade de rotação", "Potência indica a rapidez com que o trabalho é realizado. Quanto maior o torque em determinada rotação, maior a potência. RPM é o número de rotações do eixo por minuto. Dois motores podem entregar potência parecida com curvas de torque muito diferentes."]],
      "Dois motores têm o mesmo torque, mas um gira mais rápido. Nesse instante, qual tende a ter maior potência?",
      ["O que gira mais rápido", "O que gira mais devagar", "Ambos sempre terão zero", "Não há relação"], 0,
      "Potência mecânica é torque multiplicado pela velocidade angular. Mantido o torque, aumentar a rotação aumenta a potência."),
    lesson("manual-automatico", "Manual ou automático?", "Entenda o papel dos pedais e a diferença entre escolher e automatizar marchas.",
      [["Transmissão manual", "No câmbio manual tradicional, o motorista aciona a embreagem para desacoplar temporariamente o motor da transmissão e escolhe a marcha com a alavanca. Em geral há três pedais: embreagem, freio e acelerador."],
      ["Transmissões automáticas", "No automático convencional, o sistema seleciona relações de marcha e frequentemente utiliza conversor de torque. Há também automatizados de dupla embreagem e sistemas CVT; por isso 'automático' não indica uma única tecnologia."]],
      "Qual afirmação está correta?", ["Todo automático tem exatamente oito marchas", "O manual dispensa embreagem", "Existem diferentes tecnologias de transmissão automática", "CVT e câmbio manual são idênticos"], 2,
      "Automático convencional, dupla embreagem e CVT são soluções diferentes para controlar a relação entre motor e rodas.")
  ]),
  module("transmissoes", "Domine a transmissão", "02 / SISTEMAS",
    "Das engrenagens à distribuição de torque entre as rodas.", "Transmissão", [
    lesson("relações-marcha", "A lógica das marchas", "Descubra por que primeira marcha e marcha alta parecem tão diferentes.",
      [["Multiplicação de torque", "Marchas curtas multiplicam mais o torque nas rodas, facilitando a saída e a aceleração em baixa velocidade. Marchas longas permitem maior velocidade para a mesma rotação do motor, dentro dos limites de força disponível."],
      ["Relação final e pneus", "A rotação das rodas também depende do diferencial e da circunferência dos pneus. Alterar esses componentes modifica a relação entre RPM e velocidade; o simulador da plataforma permite explorar essa conta."]],
      "Para sair da imobilidade em um carro manual comum, qual relação é geralmente usada?", ["A primeira marcha", "A marcha mais longa", "O ponto morto", "A ré em qualquer situação"], 0,
      "A primeira marcha oferece grande multiplicação de torque nas rodas, facilitando a saída."),
    lesson("tracao-diferencial", "Tração e diferencial", "Aprenda a distinguir FWD, RWD e AWD sem confundir com potência.",
      [["Onde está a tração?", "Tração dianteira (FWD) envia força às rodas dianteiras. Tração traseira (RWD), às traseiras. Tração integral (AWD/4WD) pode enviar força aos dois eixos, conforme a arquitetura."],
      ["O diferencial em curvas", "Um diferencial aberto permite que as duas rodas do mesmo eixo motriz girem a velocidades diferentes numa curva. Isso reduz arrasto nos pneus. Diferenciais autoblocantes limitam a diferença de rotação ou distribuição de torque em determinadas condições."]],
      "Por que existe diferencial em um eixo motriz?", ["Para criar combustível", "Para permitir diferentes velocidades de roda em curvas", "Para substituir o freio", "Para resfriar o radiador"], 1,
      "Em uma curva, a roda externa percorre distância maior. O diferencial permite a diferença de velocidade sem arrastar desnecessariamente os pneus.")
  ]),
  module("combustao", "Dentro do motor", "03 / ENGENHARIA",
    "Explore pistões, válvulas, compressão e as arquiteturas de motores.", "Motores", [
    lesson("quatro-tempos", "O ciclo de quatro tempos", "Uma volta completa da lógica de funcionamento de um motor comum.",
      [["Admissão e compressão", "Na admissão entra ar ou mistura de ar e combustível, dependendo da injeção. Na compressão, o pistão sobe com as válvulas fechadas, elevando pressão e temperatura."],
      ["Combustão e escape", "No motor Otto, a vela inicia a combustão, que empurra o pistão e gera trabalho. O escape expulsa os gases queimados. O ciclo de quatro tempos completa-se em duas voltas do virabrequim por cilindro."]],
      "Em um motor quatro-tempos, quantas voltas do virabrequim completam um ciclo por cilindro?", ["Meia", "Uma", "Duas", "Quatro"], 2,
      "Admissão, compressão, expansão e escape ocupam quatro cursos do pistão, equivalentes a duas voltas do virabrequim."),
    lesson("arquiteturas", "Em linha, V e boxer", "A configuração dos cilindros influencia espaço, vibração e o caráter do conjunto.",
      [["Disposição dos cilindros", "Em linha, os cilindros ficam numa única bancada. Em V, ocupam duas bancadas inclinadas. No boxer, os pistões opostos se movimentam em direções opostas, numa arquitetura horizontal."],
      ["Mais cilindros não significam sempre mais potência", "Cilindrada, aspiração, rotação, eficiência, calibração e resistência dos componentes importam tanto quanto a quantidade de cilindros. Um quatro-cilindros turbo pode superar um V8 aspirado em determinadas condições."]],
      "Qual motor é normalmente descrito por dois bancos de cilindros formando um ângulo?", ["Em linha", "Em V", "Motor elétrico", "Monocilíndrico em linha"], 1,
      "Motores em V possuem duas bancadas de cilindros; o ângulo varia conforme o projeto.")
  ]),
  module("sobrealimentacao", "A ciência da pressão", "04 / PERFORMANCE",
    "Turbo, supercharger, intercooler e o caminho do ar comprimido.", "Performance", [
    lesson("turbo-funciona", "Como trabalha um turbo", "Uma turbina aproveita a energia dos gases de escape.",
      [["Duas rodas, um eixo", "Os gases de escape fazem girar a turbina. No mesmo eixo, o compressor pressuriza o ar admitido pelo motor. Mais oxigênio disponível permite queimar mais combustível com a calibração e os componentes adequados."],
      ["Controle e temperatura", "A wastegate regula parte da energia direcionada à turbina. O intercooler reduz a temperatura do ar comprimido, aumentando sua densidade e ajudando a controlar a temperatura da admissão."]],
      "O que normalmente fornece energia à turbina de um turbocompressor?", ["Uma correia ligada ao virabrequim", "Os gases do escapamento", "A bateria de 12 V", "O fluido de freio"], 1,
      "A turbina do turbo é movida pelos gases de escape. Uma correia é característica de vários tipos de supercharger mecânico."),
    lesson("turbo-supercharger", "Turbo x supercharger", "Dois métodos de comprimir ar com respostas e compromissos distintos.",
      [["De onde vem a energia", "Um turbo usa energia dos gases de escape. Um supercharger mecânico é acionado pelo motor, geralmente por correia ou engrenagens, consumindo parte da potência produzida."],
      ["Resposta e eficiência", "Sistemas mecânicos podem oferecer resposta muito direta, mas impõem carga ao motor. Turbos podem aproveitar energia que seria desperdiçada, embora tenham inércia e resposta dependente da configuração. Nenhuma solução é automaticamente melhor em todos os cenários."]],
      "Qual sistema costuma ser acionado mecanicamente pelo virabrequim?", ["Turbo tradicional", "Supercharger", "Intercooler", "Catalisador"], 1,
      "O compressor mecânico recebe energia do motor, ao contrário do turbo, cuja turbina aproveita o fluxo de escape."),
    lesson("biturbo-valvulas", "Biturbo e sons de válvulas", "Entenda dois turbos, alívio de pressão e por que cada ruído surge.",
      [["Dois turbos", "Biturbo significa dois turbocompressores, mas a instalação pode ser paralela, sequencial ou ter outra organização. Não equivale obrigatoriamente ao dobro da potência."],
      ["O que você ouve?", "O assobio de aceleração costuma vir do compressor e do fluxo de ar. Ao aliviar o acelerador, válvulas podem descarregar ou recircular pressão do ar admitido. O som depende de muitos fatores, incluindo a posição do microfone."]],
      "Qual frase sobre biturbo é tecnicamente correta?", ["Sempre dobra a potência", "Sempre utiliza quatro turbinas", "Significa um sistema com dois turbocompressores", "É exatamente o mesmo que supercharger"], 2,
      "Biturbo descreve dois turbocompressores, não uma promessa específica de potência ou som.")
  ]),
  module("motores-iconicos", "Motores que fizeram história", "05 / ÍCONES",
    "Conheça projetos que marcaram gerações de entusiastas.", "Cultura", [
    lesson("jz-family", "Toyota 1JZ e 2JZ", "Dois seis-cilindros em linha que ganharam status lendário.",
      [["Família JZ", "O Toyota 1JZ tem cilindrada nominal de 2,5 litros e o 2JZ, de 3,0 litros. Ambos são seis-cilindros em linha, com diversas versões aspiradas e turbo ao longo do tempo."],
      ["O que muda?", "Cilindrada e projeto dos componentes influenciam curvas de torque e comportamento. O 2JZ-GTE é especialmente conhecido no Supra de quarta geração, mas potência e som dependem muito da configuração. Não se identifica um JZ com certeza apenas por um áudio."]],
      "Qual é a cilindrada nominal do Toyota 2JZ?", ["1,6 L", "2,0 L", "3,0 L", "5,0 L"], 2,
      "A nomenclatura 2JZ corresponde a um seis-cilindros em linha de aproximadamente 3,0 litros; o 1JZ tem aproximadamente 2,5 litros."),
    lesson("outras-lendas", "RB26, K20, LS e Wankel", "Quatro filosofias mecânicas, quatro histórias completamente diferentes.",
      [["Projetos famosos", "O Nissan RB26DETT é um seis-em-linha biturbo associado ao Skyline GT-R R32–R34. O Honda K20 é uma família de quatro-cilindros em linha. A família GM LS reúne vários motores V8 com arquitetura pushrod."],
      ["Um motor fora do padrão", "O Mazda rotativo Wankel utiliza rotores em vez de pistões alternativos. Pode entregar rotações elevadas, com desafios específicos de vedação, consumo e emissões."]],
      "Qual dos exemplos usa rotores em vez de pistões convencionais?", ["Honda K20", "GM LS", "Mazda Wankel", "Nissan RB26"], 2,
      "No motor Wankel, rotores giram dentro de uma carcaça de formato especial, substituindo o movimento alternativo dos pistões.")
  ]),
  module("paisagem-sonora", "A assinatura do som", "06 / ACÚSTICA",
    "Aprenda a interpretar registros sonoros com cuidado técnico.", "Áudio", [
    lesson("sons-admissao", "Assobio, recirculação e pressão", "Nem todo chiado é um turbo. Ouça com método.",
      [["Fontes de ruído", "Admissão, compressor, correia, válvula de alívio e escapamento podem produzir sons parecidos. Distância, reverberação, microfone e edição alteram muito uma gravação."],
      ["Reconhecimento responsável", "Procure o contexto do áudio: houve aceleração ou alívio do acelerador? O som surge quando aumenta a pressão ou quando ela é descarregada? A gravação sozinha raramente confirma um componente específico."]],
      "Um vídeo com assobio agudo identifica com certeza um turbo específico?", ["Sim, sempre", "Não: é preciso contexto e outras evidências", "Sim, se o vídeo estiver em estéreo", "Sim, se tiver muitos graves"], 1,
      "Uma gravação isolada pode enganar. Entender o funcionamento e o contexto vale mais do que decorar um único ruído."),
    lesson("sons-motores", "Cilindros, escape e acústica", "O som é uma pista, não um documento de identidade.",
      [["Pulso de combustão", "Número de cilindros, sequência de ignição, arquitetura e regime do motor influenciam os pulsos de escape e sua percepção. Coletores, escapamentos e abafadores alteram o resultado."],
      ["Comparação honesta", "Para comparar gravações, observe se os motores estão em condições e RPM semelhantes. Um motor modificado pode soar bem diferente de outro original, ainda que compartilhem a mesma família."]],
      "O que pode mudar intensamente o som de um motor sem trocar o bloco?", ["Projeto do escapamento", "Cor da pintura", "Marca do limpador", "Material do volante"], 0,
      "Coletores, catalisadores, abafadores e tubulações alteram o som mesmo quando o motor é o mesmo.")
  ]),
  module("manutencao", "Sua oficina começa aqui", "07 / CUIDADOS",
    "Antecipe falhas e compreenda os sistemas que mantêm um carro confiável.", "Oficina", [
    lesson("oleo-filtros", "Óleo, filtros e manutenção", "O cuidado correto custa menos que reparar um motor danificado.",
      [["A função do óleo", "O óleo lubrifica, ajuda a remover calor e protege superfícies contra desgaste e corrosão. Viscosidade e especificação devem seguir o manual do veículo; óleo mais grosso não é automaticamente melhor."],
      ["O plano de manutenção", "Intervalos variam com motor, combustível, uso e recomendações do fabricante. Filtro de óleo, filtro de ar e inspeções preventivas fazem parte do conjunto."]],
      "Qual é o critério mais confiável para escolher a especificação do óleo?", ["A opinião aleatória de um vídeo", "A recomendação do fabricante para aquele motor", "A cor do frasco", "O cheiro do óleo"], 1,
      "O manual do veículo e as normas aplicáveis são a referência inicial para viscosidade, desempenho e intervalo."),
    lesson("arrefecimento", "Sistema de arrefecimento", "Um motor precisa aquecer, mas também precisa manter a temperatura controlada.",
      [["Quem participa", "Bomba d'água, radiador, válvula termostática, ventoinha, mangueiras e fluido compõem o circuito de arrefecimento em muitos carros."],
      ["Segurança primeiro", "Superaquecimento pode indicar vazamentos, falta de circulação, ventoinha defeituosa ou outros problemas. Nunca abra uma tampa pressurizada com o sistema quente: há risco de queimaduras graves."]],
      "O motor superaqueceu e o reservatório está pressurizado e quente. O que fazer?", ["Abrir a tampa imediatamente", "Desligar em local seguro e aguardar esfriar", "Jogar água fria no bloco quente", "Ignorar o aviso"], 1,
      "Abertura de sistema pressurizado quente pode lançar fluido fervente. Pare com segurança e procure diagnóstico após resfriamento.")
  ]),
  module("chassi", "O contato com o asfalto", "08 / DINÂMICA",
    "Suspensão, pneus e as forças que determinam como um carro faz curvas.", "Dinâmica", [
    lesson("pneus-aderencia", "O papel dos pneus", "A única ligação direta do carro com a pista merece atenção especial.",
      [["Atrito e temperatura", "A força disponível depende do composto, carga, pressão, temperatura e condições do piso. Sulcos ajudam a escoar água; pneus inadequados ou gastos comprometem frenagem e controle."],
      ["Pressão correta", "Excesso ou falta de pressão modifica desgaste, comportamento e aquecimento. Use a recomendação específica do fabricante, considerando a carga e as condições de uso."]],
      "Qual condição tende a aumentar muito o risco de aquaplanagem?", ["Pneus desgastados sobre lâmina d'água", "Pintura metálica", "Vidro escurecido", "Bancos em couro"], 0,
      "Sulcos insuficientes prejudicam o escoamento de água; velocidade e profundidade da água agravam o risco."),
    lesson("subesterco-sobresterco", "Subesterço e sobresterço", "Entenda a diferença entre perder aderência na frente e atrás.",
      [["Subesterço", "Quando o eixo dianteiro satura sua capacidade de aderência e o veículo faz uma curva mais aberta do que o comandado, ocorre subesterço."],
      ["Sobresterço", "Quando o eixo traseiro perde aderência relativa e a traseira tende a girar para fora da curva, ocorre sobresterço. Distribuição de carga, pneus, geometria e entradas do motorista influenciam ambos."]],
      "A traseira começa a girar mais do que o esperado numa curva. Esse comportamento é chamado de:", ["Subesterço", "Sobresterço", "Cavitação", "Detonação"], 1,
      "Sobresterço é associado à perda relativa de aderência na traseira, produzindo maior guinada que a desejada.")
  ]),
  module("preparacao", "Preparar com inteligência", "09 / PROJETOS",
    "Potência é um sistema: combustível, temperatura, transmissão e confiabilidade.", "Preparação", [
    lesson("preparacao-responsavel", "O conjunto vem antes do número", "Subir potência sem pensar no resto costuma sair caro.",
      [["Limites de projeto", "Aumentar pressão de turbo e combustível não é o suficiente. Bicos, bomba, mistura, temperatura de admissão, ignição, arrefecimento e resistência dos componentes precisam ser avaliados."],
      ["Segurança e legalidade", "Freios, pneus e suspensão precisam acompanhar o desempenho. Modificações para circulação em vias públicas dependem de regras locais, homologação e inspeções aplicáveis."]],
      "Ao aumentar significativamente a potência, o que deve ser avaliado?", ["Apenas a cor das rodas", "O conjunto mecânico e os sistemas de segurança", "Somente o adesivo no vidro", "Nada além do filtro de cabine"], 1,
      "Potência adicional eleva solicitações térmicas e mecânicas. Um projeto confiável considera o veículo inteiro."),
    lesson("ecu-remap", "ECU, mapas e calibração", "A central eletrônica é um sistema de controle, não um botão de potência grátis.",
      [["O que a ECU faz", "A unidade de controle interpreta sensores e comanda injeção, ignição e outros atuadores. Suas estratégias variam com carga, temperatura, rotação e limites de proteção."],
      ["Remapeamento", "Modificar calibrações sem instrumentos e conhecimento pode causar detonação, emissões excessivas ou danos. Testes e medições em ambiente profissional são fundamentais."]],
      "Por que um remapeamento sem validação técnica pode ser arriscado?", ["Não existe risco", "Pode alterar mistura, ignição e proteções do motor", "Porque muda o formato dos pneus", "Porque remove o diferencial"], 1,
      "Calibrações inadequadas podem comprometer emissões, temperatura, confiabilidade e segurança do conjunto.")
  ]),
  module("drift", "A física do drift", "10 / MOTORSPORT",
    "O que realmente acontece quando um carro atravessa uma curva de lado.", "Drift", [
    lesson("fisica-drift", "O que sustenta um drift?", "Não é só pisar fundo: trata-se de equilíbrio dinâmico.",
      [["Sobresterço controlado", "No drift competitivo, o piloto sustenta deliberadamente um ângulo de guinada superior ao de uma curva convencional, equilibrando aderência, aceleração, direção e transferência de carga."],
      ["Por que RWD?", "Em carros de tração traseira, o motor pode controlar o deslizamento das rodas traseiras enquanto as dianteiras continuam responsáveis principalmente pela direção. É a arquitetura tradicional de muitos projetos de drift em pista."]],
      "Qual configuração é a base mais comum de um projeto tradicional de drift?", ["Tração traseira", "Tração dianteira", "Carro sem freios", "Moto com sidecar"], 0,
      "A tração traseira facilita o controle do deslizamento do eixo posterior pelo acelerador. Aprendizado prático deve acontecer apenas em pista e com instrução adequada."),
    lesson("diferencial-drift", "Diferencial aberto, LSD e soldado", "Entenda o que muda quando as rodas traseiras precisam entregar força.",
      [["Diferencial aberto e autoblocante", "O diferencial aberto permite rotação independente das rodas, mas pode limitar a capacidade de tração quando uma perde aderência. Diferenciais de deslizamento limitado (LSD) gerenciam a diferença de rotação e de torque de modos distintos."],
      ["Soldar não é obrigação", "Soldar engrenagens de um diferencial bloqueia permanentemente as rodas entre si e pode causar arrasto, grande desgaste e comportamento indesejado. É uma intervenção com riscos e não é uma exigência para drift. Uma solução projetada para pista é preferível."]],
      "Para fazer drift é obrigatório soldar o diferencial?", ["Sim, em qualquer carro", "Não; há diferentes soluções, com riscos e vantagens", "Sim, mesmo em veículos elétricos", "Sim, por lei"], 1,
      "Diferenciais LSD e outras soluções existem. Um diferencial soldado é uma modificação permanente com consequências importantes para segurança e dirigibilidade."),
    lesson("rpm-drift", "Torque, giro e escolha do carro", "Aprenda a pensar em faixa útil de potência e orçamento.",
      [["Faixa de trabalho", "Não é obrigatório que o motor gire extremamente alto. Importa que a transmissão mantenha torque utilizável nas rodas para o circuito e a aderência disponível."],
      ["Projeto realista", "Priorize carro estruturalmente íntegro, freios, refrigeração, segurança, revisão mecânica e disponibilidade de peças antes de buscar números grandes de potência. Preços variam com local e estado do carro."]],
      "Qual é uma prioridade razoável ao planejar um carro de pista econômico?", ["Aumentar potência antes de testar freios", "Revisar integridade, freios e segurança", "Remover os cintos", "Ignorar manutenção"], 1,
      "Um veículo confiável e seguro é a base de qualquer projeto de pista, independentemente da potência.")
  ]),
  module("construtor", "Monte seu projeto", "11 / LABORATÓRIO",
    "Tome decisões técnicas e construa uma proposta coerente para uso em circuito.", "Laboratório", [
    lesson("carro-base", "Como escolher a plataforma", "A melhor base nem sempre é o carro mais potente.",
      [["O que avaliar", "Arquitetura de tração, integridade estrutural, peças disponíveis, transmissão, peso, suporte técnico e orçamento são critérios essenciais."],
      ["O custo além da compra", "Um carro barato pode exigir reparos caros. Reserve verba para revisão, equipamento de segurança, transporte e manutenção de pista. Compare cenários com o planejador da central."]],
      "Dois carros custam igual. Um precisa de reparos estruturais importantes e outro está íntegro. Qual é a base mais sensata?", ["O estruturalmente íntegro, após inspeção", "O danificado, sempre", "Ambos são idênticos", "O que tem mais adesivos"], 0,
      "O custo total e a segurança estrutural são mais importantes que o preço isolado de compra."),
    lesson("equilibrio-projeto", "Equilibrando o orçamento", "Distribua recursos entre segurança, confiabilidade e desempenho.",
      [["Ordem de prioridades", "Inspeção, manutenção e equipamentos de segurança vêm antes de alterações destinadas a aumentar a velocidade."],
      ["Compromissos", "Pneus, freios, suspensão, diferencial, potência e resfriamento interagem. A solução mais cara não é necessariamente a mais apropriada à pista e à experiência do condutor."]],
      "Um projeto ficou sem verba para revisar os freios. Qual é a decisão correta?", ["Adiar a preparação até garantir os freios", "Dobrar a potência", "Desligar ABS em vias públicas", "Usar pneus com bolhas"], 0,
      "Segurança não é item opcional. Adie atividades de pista até que o veículo esteja mecanicamente adequado.")
  ]),
  module("diagnostico", "Pense como um mecânico", "12 / DIAGNÓSTICO",
    "Analise sintomas sem trocar peças às cegas.", "Oficina", [
    lesson("partida", "O carro não dá partida", "Sintomas diferentes apontam para caminhos diferentes.",
      [["Primeira distinção", "Se o motor de partida não gira, investigam-se bateria, conexões, comando de partida e outros componentes. Se gira mas o motor não funciona, entram outras hipóteses como combustível, ignição e sincronização."],
      ["Diagnóstico com evidências", "Tensão, códigos de falha, histórico e medições orientam a investigação. Um barulho ou luz de painel isolados raramente permitem concluir qual peça deve ser substituída."]],
      "Se o motor de partida não gira, qual grupo merece investigação inicial?", ["Bateria e circuito de partida", "Cor da carroceria", "Alinhamento do para-choque", "Escape esportivo"], 0,
      "Ausência de giro pode estar ligada à energia elétrica ou ao sistema de partida; medições são necessárias para confirmar."),
    lesson("superaquecimento-diagnostico", "Motor quente demais", "Um sintoma, várias possibilidades.",
      [["Possíveis causas", "Baixo nível de fluido, radiador obstruído, ventilador inoperante, bomba com problema ou termostato defeituoso podem provocar superaquecimento."],
      ["Próximo passo seguro", "Interrompa o uso quando houver aviso de temperatura crítica, estacione com segurança e deixe esfriar. Inspeções em componentes pressurizados ou em movimento exigem cuidado e, muitas vezes, um profissional."]],
      "Uma luz de temperatura crítica acendeu. Como proceder?", ["Continuar em alta velocidade", "Parar com segurança e desligar conforme manual", "Abrir radiador quente", "Desconsiderar o alerta"], 1,
      "Continuar dirigindo com superaquecimento pode danificar o motor; sistemas quentes e pressurizados também oferecem risco de queimadura.")
  ]),
  module("eletronica", "A inteligência do carro", "13 / ELETRÔNICA",
    "Sensores, módulos e sistemas de segurança eletrônicos.", "Eletrônica", [
    lesson("ecus-sensores", "Sensores e atuadores", "Como o computador do veículo entende o que está acontecendo.",
      [["Entrada e saída", "Sensores medem grandezas como rotação, pressão, temperatura e oxigênio. A ECU calcula respostas e comanda atuadores como injetores, bobinas e válvulas."],
      ["Por que isso importa", "Uma leitura incorreta pode produzir sintomas parecidos com falhas mecânicas. Diagnóstico eletrônico envolve analisar dados, não apenas apagar códigos."]],
      "Qual é a principal função de um sensor automotivo?", ["Medir uma grandeza e fornecer informação ao controle", "Gerar gasolina", "Substituir todas as rodas", "Lubrificar diretamente a caixa"], 0,
      "Sensores fornecem sinais para as unidades de controle tomarem decisões."),
    lesson("abs-estabilidade", "ABS e controle de estabilidade", "Duas tecnologias de segurança com funções complementares.",
      [["ABS", "O sistema antibloqueio modula a pressão de frenagem para reduzir o travamento das rodas em certas frenagens, ajudando a preservar a capacidade de direção."],
      ["ESC", "O controle eletrônico de estabilidade compara o comportamento do carro com a intenção do motorista e pode atuar em freios individuais e torque do motor. Nenhum sistema elimina os limites físicos de aderência."]],
      "O ABS pode ajudar principalmente a:", ["Evitar travamento das rodas em frenagens", "Fazer o carro voar", "Aumentar a octanagem", "Substituir a direção"], 0,
      "O ABS controla o bloqueio das rodas; isso pode ajudar a manter o controle direcional durante a frenagem.")
  ]),
  module("eletricos", "Além da combustão", "14 / FUTURO",
    "Motores elétricos, baterias, híbridos e regeneração.", "Eletrificação", [
    lesson("motor-eletrico", "Torque instantâneo?", "Como motores elétricos entregam movimento às rodas.",
      [["A força eletromagnética", "Um motor elétrico converte energia elétrica em torque por interação de campos magnéticos. Muitos oferecem forte torque em baixa rotação, embora a curva real dependa do motor e do controle."],
      ["Bateria e inversor", "A bateria armazena energia; o inversor controla a energia elétrica fornecida ao motor. Carros elétricos utilizam diferentes arquiteturas de transmissão e potência."]],
      "Qual componente normalmente controla a energia elétrica que alimenta o motor de tração?", ["Inversor", "Catalisador", "Carburador", "Bomba de óleo do motor Otto"], 0,
      "O inversor controla tensão e frequência/corrente aplicadas aos motores elétricos de tração, conforme o sistema."),
    lesson("regeneracao", "Frenagem regenerativa e híbridos", "Recuperar parte da energia não significa criar energia.",
      [["Regeneração", "Durante desaceleração, o motor elétrico pode atuar como gerador, convertendo parte da energia cinética em energia elétrica armazenada na bateria."],
      ["Limites reais", "A recuperação tem perdas e depende do estado da bateria, temperatura e aderência. Freios mecânicos continuam essenciais. Sistemas híbridos combinam motor a combustão e elétrico de maneiras diferentes."]],
      "O que faz a frenagem regenerativa?", ["Recupera parte da energia cinética", "Cria energia ilimitada", "Elimina todos os freios convencionais", "Aumenta combustível no tanque"], 0,
      "A regeneração aproveita parte da energia do movimento que normalmente seria dissipada como calor, mas não recupera 100%.")
  ]),
  module("engenharia", "Engenharia de alto nível", "15 / MASTER",
    "Ligue os conceitos de física, desempenho e confiabilidade.", "Engenharia", [
    lesson("peso-potencia", "Peso-potência e aerodinâmica", "Mais cavalos não contam toda a história.",
      [["Relação peso-potência", "Dividir a massa pela potência resulta em kg/cv ou kg/kW, dependendo da unidade. Valores menores normalmente favorecem aceleração, mas tração, câmbio e resistência do ar também influenciam."],
      ["Arrasto e downforce", "A força de arrasto cresce aproximadamente com o quadrado da velocidade. Elementos aerodinâmicos podem gerar força vertical, aumentando a carga nos pneus, mas frequentemente com custo de arrasto adicional."]],
      "Dois carros têm a mesma potência. Qual tende a apresentar melhor relação peso-potência?", ["O mais leve", "O mais pesado", "O de cor vermelha", "Ambos sempre iguais"], 0,
      "Com potência igual, menor massa produz uma relação massa/potência menor, embora aceleração real dependa de outras variáveis."),
    lesson("eficiencia-confiabilidade", "Performance sustentável", "O melhor projeto entrega resultados de forma repetível.",
      [["Calor e desgaste", "Mais esforço mecânico e térmico pode reduzir a margem de segurança de componentes. Eficiência, lubrificação, arrefecimento e calibração influenciam durabilidade."],
      ["Pensamento de engenharia", "Bons projetos começam com objetivos mensuráveis, verificações e limites conhecidos. Telemetria, inspeções e testes controlados ajudam a validar resultados sem depender de palpites."]],
      "Qual princípio representa uma boa decisão de engenharia?", ["Medir, testar e respeitar limites", "Ignorar a temperatura", "Alterar tudo de uma vez sem medir", "Avaliar apenas o som do escape"], 0,
      "Engenharia eficaz depende de hipóteses verificáveis, instrumentos adequados e margem de segurança.")
  ])
];

export const glossary = [
  ["ABS", "Sistema antibloqueio de freios, que modula pressão para reduzir o travamento das rodas."],
  ["Admissão", "Sistema que conduz ar para dentro do motor."],
  ["AWD", "Sistema de tração com capacidade de enviar torque aos dois eixos."],
  ["Biturbo", "Sistema de sobrealimentação com dois turbocompressores."],
  ["Blow-off", "Válvula que descarrega pressão do sistema de admissão em determinadas condições."],
  ["Cilindrada", "Volume total deslocado pelos pistões entre pontos extremos do curso."],
  ["Comando de válvulas", "Eixo ou sistema que determina a abertura e fechamento das válvulas."],
  ["CVT", "Transmissão continuamente variável, com ampla faixa de relações sem etapas convencionais."],
  ["Diferencial", "Conjunto que distribui torque e, em muitas configurações, permite rotações distintas entre rodas."],
  ["Downforce", "Força aerodinâmica vertical que tende a pressionar o veículo contra o solo."],
  ["ECU", "Unidade eletrônica que controla funções do veículo, como injeção e ignição."],
  ["ESC", "Controle eletrônico de estabilidade que pode atuar nos freios e torque."],
  ["FWD", "Front-wheel drive: tração dianteira."],
  ["Intercooler", "Trocador de calor que resfria o ar comprimido na admissão."],
  ["LSD", "Limited-slip differential: diferencial de deslizamento limitado."],
  ["OBD-II", "Padrão de diagnóstico veicular com acesso a informações e falhas eletrônicas."],
  ["RPM", "Rotações por minuto de um eixo, frequentemente do virabrequim."],
  ["RWD", "Rear-wheel drive: tração traseira."],
  ["Sobresterço", "Tendência de a traseira escorregar mais do que a dianteira em uma curva."],
  ["Subesterço", "Tendência de a dianteira perder aderência e abrir a trajetória da curva."],
  ["Supercharger", "Compressor mecânico que eleva a pressão do ar admitido pelo motor."],
  ["Torque", "Grandeza de esforço giratório, expressa geralmente em newton-metro."],
  ["Turbo lag", "Atraso de resposta percebido em sistemas turbo sob certas condições."],
  ["Wastegate", "Válvula que controla o fluxo de gases direcionado à turbina de um turbo."]
].map(([term, definition]) => ({ term, definition }));
