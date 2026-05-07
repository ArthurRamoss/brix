"use client";

/**
 * Brix — i18n (PT canonical, EN international).
 * Ported from Brix-handoff/brix/project/i18n.jsx.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Lang = "pt" | "en";

type StringDict = Record<string, string>;
type FnDict = Record<string, (...args: unknown[]) => string>;
type ArrDict = Record<string, readonly (string | number)[]>;
export type Dict = StringDict & FnDict & ArrDict;

const pt = {
  // nav
  nav_how: "como funciona",
  nav_landlord: "antecipar aluguel",
  nav_invest: "investir",
  nav_agency: "imobiliárias",
  nav_signin: "entrar",
  nav_start: "começar",
  nav_back: "voltar",
  nav_back_site: "← voltar pro site",

  // hero
  hero_toggle_owner: "tenho imóvel",
  hero_toggle_investor: "tenho capital",
  hero_owner_h1: "12 meses de aluguel",
  hero_owner_h2: "no seu PIX hoje.",
  hero_inv_h1: "recebíveis de aluguel",
  hero_inv_h2: "com taxa imutável.",
  hero_owner_sub:
    "antecipe a renda dos seus imóveis alugados. a taxa é gravada em smart contract no momento da assinatura. ela não muda depois. nunca.",
  hero_inv_sub:
    "vault on-chain lastreado em recebíveis de aluguel originados por imobiliárias parceiras. taxa imutável, repagamento previsível, sem especulação.",
  hero_owner_cta: "simular antecipação",
  hero_inv_cta: "depositar no vault",
  hero_secondary_cta: "como funciona",

  // hero stats
  stat_protected: "gravado on-chain · imutável",
  stat_apr_target: "a.a. target",
  stat_credit_cut: "mercado global de aluguéis residenciais",
  stat_no_bait: "bait-and-switch · taxa que muda",

  // marquee
  marq_program: "solana program 6xon…sy94",
  marq_locked: "rate locked at signing",
  marq_brz: "stablecoin settlement",
  marq_yield: "vault yield previsível",
  marq_insurance: "rede de imobiliárias parceiras",
  marq_active: "on-chain receivables",
  marq_city: "global ambition",

  // dual audience
  sec01_kicker: "duas pontas, um contrato",
  aud_owner_kicker: "quem tem imóvel",
  aud_owner_title: "receba 12 meses de aluguel hoje, no PIX.",
  aud_owner_b1: "a taxa que aparece na simulação é a mesma que entra no contrato.",
  aud_owner_b2:
    "recebimento em stablecoin que vira o trilho local (PIX, ach, sepa) automaticamente. você não toca em cripto.",
  aud_owner_b3: "login por email. zero seed phrase, zero carteira pra gerenciar.",
  aud_owner_stat_n: "$ 9.600",
  aud_owner_stat_l: "aluguel R$ 1.800/mês × 6 meses · taxa 19,8% a.a.",

  aud_inv_kicker: "quem tem capital",
  aud_inv_title: "rendimento lastreado em recebíveis reais.",
  aud_inv_b1:
    "recebíveis com seguro fiança quando a regulação local oferece. default real perto de zero.",
  aud_inv_b2: "vault em stablecoin com share price crescente. saca quando quiser.",
  aud_inv_b3: "todo recebível tem hash on-chain. auditoria pública, contraparte verificada.",
  aud_inv_stat_n: "+19,7% a.a.",
  aud_inv_stat_l: "apr médio do vault nos últimos 90 dias",

  // how
  sec02_kicker: "o fluxo",
  how_h2: "quatro passos. um contrato. zero surpresa de taxa.",
  how_s1_t: "imobiliária registra",
  how_s1_d:
    "a imobiliária parceira valida o contrato off-chain e registra o recebível on-chain. taxa gravada agora, imutável.",
  how_s2_t: "vault financia",
  how_s2_d:
    "investidores depositam stablecoin no vault. quando há liquidez, o vault paga o proprietário em segundos.",
  how_s3_t: "liquidação local",
  how_s3_d:
    "a stablecoin é convertida pelo trilho de pagamento local (PIX no brasil, ach/sepa em outras regiões). proprietário recebe em moeda fiat.",
  how_s4_t: "aluguéis repagam",
  how_s4_d:
    "inquilino paga o aluguel mensal pra imobiliária. ela repassa pro contrato. principal + juros volta pro vault.",

  // traction
  sec03_kicker: "por que agora",
  trac_h2: "aluguel é renda previsível. acessar essa renda hoje, não.",
  trac_p:
    "em todo o mundo, proprietários com contratos ativos esperam 12 meses pra receber dinheiro que já é deles. fintechs off-chain encheram o vácuo com pricing opaco que muda entre simulação e contrato. brix resolve com taxa gravada em smart contract — começando pelo brasil, onde o crédito imobiliário caiu pela metade em seis meses, e expandindo pra qualquer mercado com infraestrutura de stablecoin local.",
  trac_r1: "unidades alugadas só no brasil",
  trac_r2: "famílias brasileiras moram de aluguel",
  trac_r3: "crédito imobiliário cortado no 1S25 (br)",
  trac_r4: "mercado global de receitas de aluguel",
  trac_r5: "proprietários sem instrumento",
  trac_r6: "taxa target a.a.",

  // contrast
  sec04_kicker: "brix vs antecipação off-chain",
  cont_h2: "o que muda quando a regra mora no contrato em vez do termo de uso.",
  cont_col_brix: "brix",
  cont_col_other: "fintechs FIDC",
  cont_r1: ["taxa visível na simulação", "sim", "sim"] as const,
  cont_r2: ["taxa imutável após assinatura", "sim", "não"] as const,
  cont_r3: ["seguro fiança nas operações", "85%", "não obrigatório"] as const,
  cont_r4: ["contraparte verificável", "on-chain", "fechada"] as const,
  cont_r5: ["saída do investidor", "liquidez do vault", "até vencimento do FIDC"] as const,
  cont_r6: ["custódia do dinheiro", "smart contract", "instituição"] as const,

  // footer
  foot_h1: "aluguel é renda previsível.",
  foot_h2: "não devia precisar esperar 12 meses.",
  foot_cta_owner: "começar como proprietário",
  foot_cta_inv: "começar como investidor",
  foot_meta: "built on solana · stablecoin-native · global ambition",

  // public landlord
  pub_ll_kicker: "para proprietários",
  pub_ll_h1_a: "antecipe até 12 meses",
  pub_ll_h1_b: "de aluguel hoje.",
  pub_ll_sub:
    "simule em segundos. a taxa que aparece é a mesma que vai pro contrato — gravada on-chain, imutável. você recebe via PIX.",
  pub_ll_b1_t: "taxa imutável",
  pub_ll_b1_d:
    "a taxa é gravada no smart contract no momento da assinatura. ela não muda depois. nunca.",
  pub_ll_b2_t: "PIX em até 24h",
  pub_ll_b2_d:
    "stablecoin convertida automaticamente pro trilho local. você não precisa tocar em cripto.",
  pub_ll_b3_t: "login por email",
  pub_ll_b3_d:
    "zero seed phrase, zero carteira pra gerenciar. usa o brix como qualquer app.",
  pub_ll_sim_h: "simule agora, sem login.",
  pub_ll_sim_sub: "a taxa que aparece aqui é a mesma que vai pro contrato. sem surpresa.",
  pub_ll_sim_cta: "criar conta pra solicitar",

  // public investor
  pub_inv_kicker: "para investidores",
  pub_inv_h1_a: "recebíveis de aluguel",
  pub_inv_h1_b: "com taxa imutável.",
  pub_inv_sub:
    "vault on-chain lastreado em contratos de aluguel reais. taxa gravada no smart contract, repagamento previsível, sem especulação.",
  pub_inv_cta: "começar a investir",
  pub_inv_preview_h: "o vault em números.",
  pub_inv_s1: "apr target a.a.",
  pub_inv_s2: "contratos com seguro fiança",
  pub_inv_s3: "bait-and-switch",
  pub_inv_s4: "lockup · saca quando quiser",
  pub_inv_b1_t: "yield previsível",
  pub_inv_b1_d: "recebíveis com repagamento mensal. share price cresce conforme o vault recebe.",
  pub_inv_b2_t: "seguro fiança",
  pub_inv_b2_d:
    "quando a regulação local oferece, contratos vêm com seguro. default real perto de zero.",
  pub_inv_b3_t: "transparência on-chain",
  pub_inv_b3_d: "cada recebível tem hash on-chain. auditoria pública, contraparte verificável.",
  pub_inv_how_h: "como funciona o vault.",
  pub_inv_hw1_t: "deposite",
  pub_inv_hw1_d:
    "envie stablecoin pro vault. receba shares (brxV) que valorizam ao longo do tempo.",
  pub_inv_hw2_t: "vault financia",
  pub_inv_hw2_d:
    "o vault usa a liquidez pra financiar recebíveis de aluguel originados por imobiliárias parceiras.",
  pub_inv_hw3_t: "saque quando quiser",
  pub_inv_hw3_d:
    "queime shares e receba de volta principal + yield acumulado. sem lockup.",

  // public agency
  pub_ag_kicker: "para imobiliárias",
  pub_ag_h1_a: "origine recebíveis",
  pub_ag_h1_b: "com taxa imutável.",
  pub_ag_sub:
    "ofereça antecipação de aluguel aos proprietários da sua carteira. a taxa é gravada on-chain — sem risco reputacional de pricing opaco.",
  pub_ag_cta: "tornar-se parceira",
  pub_ag_b1_t: "produto novo, zero estoque",
  pub_ag_b1_d:
    "ofereça antecipação de aluguel como serviço. o vault financia, você origina e cobra sua comissão.",
  pub_ag_b2_t: "taxa imutável pro proprietário",
  pub_ag_b2_d:
    "a taxa é gravada no smart contract. seu cliente sabe exatamente o que vai pagar. zero surpresa.",
  pub_ag_b3_t: "repasse simples",
  pub_ag_b3_d:
    "receba o aluguel do inquilino como sempre. repasse ao contrato num clique. principal + juros volta pro vault.",
  pub_ag_how_h: "como funciona pra sua imobiliária.",
  pub_ag_hw1_t: "cadastre-se como parceira",
  pub_ag_hw1_d:
    "crie uma conta, valide sua imobiliária e acesse o portal de originação.",
  pub_ag_hw2_t: "registre o recebível",
  pub_ag_hw2_d:
    "cadastre contrato + seguro fiança. revise termos. taxa gravada on-chain ao confirmar.",
  pub_ag_hw3_t: "proprietário recebe",
  pub_ag_hw3_d:
    "vault financia o contrato. stablecoin convertida pro PIX do proprietário em até 24h.",
  pub_ag_hw4_t: "repasse mensal",
  pub_ag_hw4_d:
    "receba aluguel do inquilino como sempre. repasse ao smart contract. vault recebe principal + juros.",

  // login
  log_brand: "entrar no brix",
  log_sub:
    "login com email. sem seed phrase, sem cripto pra gerenciar — você usa o brix como qualquer app.",
  sec_partners_kicker: "parceiros",
  partners_h: "originação distribuída via imobiliárias parceiras.",
  partners_p:
    "a brix conecta-se a imobiliárias licenciadas que conhecem o inquilino e originam o recebível. cada parceira opera no seu mercado local. a rede cresce conforme entramos em novas regiões.",
  partners_founding: "parceiro fundador",
  partners_role: "originação · brasil",
  partners_units: "selectimob.com.br",
  partners_more: "novas parcerias em breve",
  log_email_label: "e-mail",
  log_email_ph: "voce@email.com",
  log_continue: "continuar",
  log_code_h: "digite o código",
  log_code_sub: "enviamos um código de 6 dígitos para",
  log_code_hint: "dica: digite qualquer 6 dígitos pra continuar",
  log_persona_h: "como você usa o brix?",
  log_persona_sub: "você pode trocar a qualquer momento.",
  log_p_landlord_t: "proprietário",
  log_p_landlord_d: "tenho imóvel alugado e quero antecipar a renda.",
  log_p_agency_t: "imobiliária",
  log_p_agency_d: "origino contratos e gerencio o portfólio.",
  log_p_investor_t: "investidor",
  log_p_investor_d: "quero alocar capital em recebíveis de aluguel.",
  log_secure: "secured by privy",

  // shell
  shell_logout: "sair",
  shell_landlord: "proprietário",
  shell_agency: "imobiliária",
  shell_investor: "investidor",

  // landlord portal
  ll_tab_overview: "visão geral",
  ll_tab_simulate: "simular",
  ll_tab_contracts: "meus contratos",
  ll_greet: "olá, marina",
  ll_overview_h1_a: "você tem",
  ll_overview_h1_b: "em aluguéis previstos para os próximos 60 dias.",
  ll_overview_h1_b_short: "em aluguéis previstos.",
  ll_kpi1_l: "antecipado este ano",
  ll_kpi1_s: "contrato BRX-0421",
  ll_kpi2_l: "taxa atual",
  ll_kpi2_v: "19,8% a.a.",
  ll_kpi2_s: "imutável até 2027-04-21",
  ll_kpi3_l: "seguro fiança",
  ll_kpi3_v: "ativo",
  ll_kpi3_s: "cobertura porto seguro",
  ll_repay_h: "repagamento em curso",
  ll_repay_paid: "parcelas pagas",
  ll_repay_progress: (paid: number) => `$ ${paid.toLocaleString("pt-BR")} repago`,
  ll_repay_next: "próxima",
  ll_simulate_cta: "simular outra antecipação",

  sim_h1: "simular antecipação",
  sim_sub: "a taxa que aparece aqui é a mesma que vai pro contrato. ela não muda.",
  sim_rent_l: "aluguel mensal",
  sim_months_l: "meses pra antecipar",
  sim_insurance_note: "quando aplicável, o contrato deve ter seguro fiança ativo.",
  sim_immutable: "taxa imutável",
  sim_you_get: "você recebe hoje",
  sim_eta: "cai no seu PIX em até 24h após aprovação",
  sim_r_assigned: "aluguéis cedidos",
  sim_r_total: "total bruto",
  sim_r_apr: "taxa anual gravada",
  sim_r_cost: "custo da antecipação",
  sim_r_monthly: "repagamento mensal",
  sim_submit: "solicitar antecipação",
  sim_done_h: "solicitação enviada",
  sim_done_p_a:
    "a imobiliária que originou o contrato vai validar. assim que aprovar, os fundos",
  sim_done_p_b: "cai no seu PIX em até 24h.",
  sim_done_pending: "contrato pendente",
  sim_done_again: "simular outra",

  contracts_h: "meus contratos",
  cell_advanced: "antecipado",
  cell_rate: "taxa",
  cell_installments: "parcelas",
  cell_insurance: "seguro",
  cell_insurance_active: "fiança ativo",

  // agency portal
  ag_tab_portfolio: "portfólio",
  ag_tab_register: "registrar recebível",
  ag_tab_repay: "registrar repagamento",
  ag_kicker: "painel da imobiliária parceira",
  ag_h1: "portfólio de recebíveis",
  ag_kpi1_l: "total ativo",
  ag_kpi1_s: "contratos na rede de parceiros",
  ag_kpi2_l: "on-chain",
  ag_kpi2_s: "registrados em devnet",
  ag_kpi3_l: "financiados",
  ag_kpi3_s: (n: number) => `${n} em curso`,
  ag_kpi4_l: "default",
  ag_kpi4_s: "seguro acionado",
  ag_search_ph: "buscar por id, proprietário ou endereço…",
  ag_th_id: "id",
  ag_th_owner: "proprietário",
  ag_th_property: "imóvel",
  ag_th_value: "valor",
  ag_th_rate: "taxa",
  ag_th_inst: "parcelas",
  ag_th_status: "status",

  reg_h1: "registrar recebível",
  reg_sub: (n: number, total: number) =>
    `passo ${n} de ${total} · validação off-chain primeiro, escrita on-chain depois`,
  reg_landlord_l: "proprietário",
  reg_landlord_ph: "nome completo",
  reg_address_l: "endereço do imóvel",
  reg_address_ph: "rua, número, complemento, cidade",
  reg_rent_l: "aluguel mensal",
  reg_months_l: "meses",
  reg_insurer_l: "seguradora fiança",
  reg_insurer_none: "sem seguro fiança",
  reg_review_cta: "revisar antes de registrar",
  reg_warn: "uma vez registrado, a taxa não pode ser alterada.",
  reg_r_landlord: "proprietário",
  reg_r_property: "imóvel",
  reg_r_total: "valor total",
  reg_r_inst: "parcelas",
  reg_r_apr: "taxa anual",
  reg_r_insurance: "seguro",
  reg_back: "voltar",
  reg_confirm: "registrar on-chain",
  reg_done_h: "recebível registrado on-chain",
  reg_done_p: (apr: string) =>
    `taxa de ${apr} gravada no smart contract. proprietário recebe a notificação por email.`,
  reg_done_view: "ver portfólio",
  reg_done_again: "registrar outro",

  repay_h1: "registrar repagamento",
  repay_sub: "repasse mensal de aluguel recebido pra o smart contract.",
  repay_contract_l: "contrato",
  repay_inst: "parcela",
  repay_value: "valor da parcela",
  repay_rest: "restante após esta",
  repay_confirm: "confirmar repasse",
  repay_done_h: "parcela repassada ao vault",
  repay_done_p_a:
    "foram debitados da carteira da imobiliária e creditados ao vault. share price subiu.",
  repay_done_again: "outra parcela",

  // investor portal
  inv_tab_vault: "vault",
  inv_tab_deposit: "depositar",
  inv_tab_withdraw: "sacar",
  inv_tab_positions: "minha posição",
  inv_kicker: "vault on-chain · solana devnet",
  inv_h1_empty: "vault aguarda primeiro depósito",
  inv_h1_active: "vault financiando contratos de aluguel ativos",
  inv_tvl_l: "total value locked",
  inv_tvl_delta: "+$ 1.842 nas últimas 24h",
  inv_apr_30d: "apr 30d",
  inv_kpi_util: "utilização",
  inv_kpi_util_s: (n: number) => `${n} contratos ativos`,
  inv_kpi_insurance: "seguro fiança",
  inv_kpi_insurance_s: "dos contratos cobertos",
  inv_kpi_active: "contratos ativos",
  inv_kpi_active_s: (n: number) =>
    n === 1 ? "lastreando o vault" : `${n} lastreando o vault`,
  inv_kpi_active_s_empty: "vault aguarda primeiro recebível",
  inv_actions: "ações",
  inv_deposit_cta: "depositar",
  inv_withdraw_cta: "sacar",
  inv_backing_h: "recebíveis lastreando o vault",
  inv_backing_count: (n: number) => `${n} ativos`,
  inv_th_property: "imóvel",
  inv_th_city: "cidade",
  inv_chart_x: ["60d atrás", "45d", "30d", "15d", "hoje"] as const,

  dep_h1: "depositar no vault",
  dep_sub: "você recebe shares (brxV) que crescem conforme o vault repaga.",
  dep_amount_l: "quantidade",
  dep_share_price: "share price atual",
  dep_shares_est: "shares estimadas",
  dep_apr_exp: "apr esperado",
  dep_lockup: "lockup",
  dep_lockup_v: "nenhum, saca quando quiser",
  dep_confirm: "confirmar depósito",
  dep_signed: "assinado pela sua carteira embedded · sem seed phrase",
  dep_done_h: "depósito confirmado",
  dep_done_p_a: "você recebeu",
  dep_done_p_b: "shares.",
  dep_done_again: "depositar mais",

  wd_h1: "sacar do vault",
  wd_sub: "queima shares · fundos voltam pra carteira em segundos.",
  wd_shares_l: "shares (brxV)",
  wd_available: "disponível",
  wd_max: "usar máximo",
  wd_you_get: "você recebe",
  wd_gas: "custo de gás",
  wd_confirm: "confirmar saque",
  wd_insufficient: "saldo insuficiente",

  pos_h1: "minha posição",
  pos_kpi_dep: "depositado",
  pos_kpi_dep_s: "2 transações",
  pos_kpi_value: "valor atual",
  pos_kpi_yield: "rendimento",
  pos_kpi_yield_s: "desde 14 fev",
  pos_kpi_shares: "shares",
  pos_history_h: "histórico de transações",
  pos_tx_deposit: "depósito",
  pos_tx_yield: "yield acrued",

  // how page
  how_kicker: "como funciona",
  how_page_h1_a: "três pessoas, um contrato,",
  how_page_h1_b: "uma taxa que não muda.",
  how_page_p:
    "o brix conecta proprietários que querem antecipar a renda dos imóveis, a imobiliária que origina os contratos, e investidores que financiam o vault. cada papel tem um portal próprio.",
  how_p1_kicker: "proprietário",
  how_p1_t: "antecipar 12 meses de aluguel",
  how_p1_s: [
    "login com email. zero seed phrase, zero cripto pra gerenciar.",
    "simulador mostra exatamente quanto você recebe. sem letrinha miúda.",
    "a imobiliária que originou o contrato valida em até 24h.",
    "stablecoin é convertida pro trilho local (PIX, ach, sepa) e cai na sua conta.",
  ] as const,
  how_p2_kicker: "imobiliária",
  how_p2_t: "originar e gerenciar recebíveis",
  how_p2_s: [
    "cadastra contrato (e seguro fiança, quando aplicável) no portal da agência.",
    "revisa termos. taxa é gravada on-chain quando você confirma.",
    "recebe aluguel mensal do inquilino como sempre.",
    "repassa parcela ao smart contract num clique. vault recebe principal + juros.",
  ] as const,
  how_p3_kicker: "investidor",
  how_p3_t: "alocar capital em recebíveis de aluguel",
  how_p3_s: [
    "entra com email ou conecta sua carteira solana.",
    "deposita stablecoin no vault. recebe shares (brxV) que valorizam ao longo do tempo.",
    "vê em tempo real quais recebíveis lastreiam sua posição.",
    "saca quando quiser. share price = principal + yield acumulado.",
  ] as const,
  how_try_as: (kicker: string) => `experimentar como ${kicker}`,

  // login extras (new flow: only investor + agency self-register)
  log_checking: "verificando seu cadastro",
  log_landlord_note_h: "é proprietário?",
  log_landlord_note_p:
    "sua imobiliária te cadastra na plataforma. depois é só logar com o email que ela usou — seus contratos aparecem aqui automaticamente.",

  // agency — new keys
  ag_tab_clients: "clientes",
  ag_new_advance: "novo adiantamento",

  // agency clients (CRM)
  clients_kicker: "carteira de clientes",
  clients_h: "clientes",
  clients_sub: (n: number) =>
    `${n} ${n === 1 ? "proprietário cadastrado" : "proprietários cadastrados"}`,
  clients_new: "novo cliente",
  clients_cancel: "cancelar",
  clients_save: "salvar",
  clients_form_h: "cadastrar proprietário",
  clients_form_name_l: "nome",
  clients_form_name_ph: "nome completo",
  clients_form_email_l: "email",
  clients_form_addr_l: "endereço do imóvel",
  clients_form_addr_ph: "rua, número, complemento, cidade",
  clients_form_rent_l: "aluguel mensal (BRZ)",
  clients_form_pix_l: "chave PIX",
  clients_form_pix_ph: "opcional · default: email",
  clients_st_rent: "aluguel",
  clients_st_active: "contratos ativos",
  clients_advance: "antecipar",

  // register receivable — new keys
  reg_mode_existing: "cliente da carteira",
  reg_mode_new: "cadastrar agora",
  reg_pick_client_l: "selecionar proprietário",

  // repay — new key
  repay_empty: "sem contratos financiados pra registrar pagamento.",

  // landlord portal — new flow keys
  ll_tab_history: "histórico",
  ll_not_linked_h: "ainda não cadastrado",
  ll_not_linked_p:
    "sua imobiliária ainda não te adicionou. peça pra eles te cadastrarem usando este email — depois recarregue a página.",
  ll_h1_empty: "ainda não há contratos antecipados",
  ll_h1_active: "seus contratos antecipados",
  ll_partner: "imobiliária parceira",
  ll_property: "imóvel",
  ll_total_received: "total recebido via brix",
  ll_pix_sent: "PIX enviado para",
  ll_no_active: "nenhum contrato ativo no momento.",
  ll_history_h: "histórico de contratos",
  ll_history_empty: "nenhum contrato encerrado ainda.",
  ll_repayment_total: "total a quitar",
  ll_view_tx: "ver transação on-chain",
  ll_partner_city: "cidade",

  // agency onboarding (founding partner application)
  ob_kicker: "candidatura · imobiliária parceira",
  ob_h1: "torne sua imobiliária um parceiro fundador",
  ob_sub:
    "antes de operar pelo brix, sua imobiliária passa por uma checagem rápida de KYB, CRECI e modelo de gestão. preenche aqui e o time entra em contato.",
  ob_company_l: "nome da imobiliária",
  ob_company_ph: "ex: Selectimob",
  ob_contact_l: "contato responsável",
  ob_contact_ph: "nome de quem assina pela empresa",
  ob_email_l: "email corporativo",
  ob_cnpj_l: "CNPJ",
  ob_creci_l: "CRECI",
  ob_website_l: "site",
  ob_city_l: "cidade / UF",
  ob_contracts_l: "contratos sob gestão",
  ob_contracts_help:
    "número aproximado de contratos de aluguel ativos hoje na imobiliária.",
  ob_disclaimer:
    "ao enviar, você autoriza o time brix a entrar em contato pra validar os dados acima. nada é registrado on-chain antes da aprovação.",
  ob_submit: "enviar candidatura",
  ob_done_kicker: "candidatura recebida",
  ob_done_h: "obrigado, {company}",
  ob_done_p:
    "vamos validar os dados em até 48h úteis e responder por email. enquanto isso, nenhum cliente seu é cadastrado e nada acontece on-chain.",
  ob_demo_label: "modo demo",
  ob_demo_p:
    "este é um protótipo — você pode simular a aprovação agora pra ver o painel da imobiliária.",
  ob_demo_cta: "simular aprovação e entrar",

  // agency portfolio empty state
  ag_empty_h: "ainda não há recebíveis registrados",
  ag_empty_p:
    "registre o primeiro adiantamento de aluguel pra ver no portfólio. cada recebível é registrado on-chain com taxa imutável.",
  ag_empty_cta: "registrar primeiro recebível",

  // agency clients — extras
  clients_empty_h: "sua carteira de clientes tá vazia",
  clients_empty_p:
    "cadastre os proprietários antes de antecipar contratos. cada cliente pode ter vários imóveis.",
  clients_empty_cta: "adicionar primeiro proprietário",
  clients_form_cpf_l: "CPF",
  clients_form_phone_l: "telefone",
  clients_st_props: "imóveis",
  clients_props_h: "imóveis vinculados",
  clients_add_prop: "adicionar imóvel",
  clients_no_props: "esse proprietário ainda não tem imóveis cadastrados.",
  clients_prop_addr_l: "endereço do imóvel",
  clients_prop_addr_ph: "rua, número, complemento, cidade",
  clients_prop_rent_l: "aluguel mensal (BRZ)",

  // register receivable — extras
  reg_pick_client_ph: "selecione um proprietário…",
  reg_pick_property_l: "imóvel",
  reg_no_clients_h: "sem clientes ainda",
  reg_no_clients_p:
    "antes de antecipar você precisa cadastrar pelo menos um proprietário na carteira.",
  reg_no_clients_cta: "ir pra clientes",
  reg_no_props_for_client:
    "esse proprietário ainda não tem imóveis cadastrados.",
  reg_no_props_cta: "adicionar imóvel agora →",
  reg_pre_total: "valor total cedido",
  reg_pre_apr: "taxa anual",
  reg_months_help: "entre 3 e 12 meses · taxa cresce levemente com o prazo.",

  // repay — empty state extras
  repay_empty_h: "sem contratos financiados",
  repay_empty_p:
    "registre e financie um recebível antes de receber repagamentos do inquilino.",
  repay_empty_cta: "ver portfólio",

  // invest — empty states
  inv_backing_empty:
    "vault aguardando primeiro recebível · ainda não há contratos sendo lastreados.",
  pos_history_empty:
    "sem histórico ainda · faça seu primeiro depósito pra começar a render.",
  pos_history_pending:
    "histórico em curso · próximas transações aparecem aqui automaticamente.",
};

// `pt` is inferred with narrow literal types — we cast `en` afterwards so
// EN strings/tuples don't have to literally equal PT.
const en = {
  nav_how: "how it works",
  nav_landlord: "get advance",
  nav_invest: "invest",
  nav_agency: "for agencies",
  nav_signin: "sign in",
  nav_start: "get started",
  nav_back: "back",
  nav_back_site: "← back to site",

  hero_toggle_owner: "i own property",
  hero_toggle_investor: "i have capital",
  hero_owner_h1: "12 months of rent",
  hero_owner_h2: "in your account today.",
  hero_inv_h1: "rental receivables",
  hero_inv_h2: "with an immutable rate.",
  hero_owner_sub:
    "advance the rent on your leased properties. the rate is written into the smart contract at signing. it never changes after that. ever.",
  hero_inv_sub:
    "on-chain vault backed by rental receivables originated by partner agencies. immutable rate, predictable repayment, no speculation.",
  hero_owner_cta: "simulate an advance",
  hero_inv_cta: "deposit into vault",
  hero_secondary_cta: "how it works",

  stat_protected: "written on-chain · immutable",
  stat_apr_target: "target apr",
  stat_credit_cut: "global residential rent market",
  stat_no_bait: "bait-and-switch · rate that drifts",

  marq_program: "solana program 6xon…sy94",
  marq_locked: "rate locked at signing",
  marq_brz: "stablecoin settlement",
  marq_yield: "predictable vault yield",
  marq_insurance: "partner agency network",
  marq_active: "on-chain receivables",
  marq_city: "global ambition",

  sec01_kicker: "two sides, one contract",
  aud_owner_kicker: "property owners",
  aud_owner_title: "12 months of rent, paid out today.",
  aud_owner_b1: "the rate you see in the simulator is the rate that goes into the contract.",
  aud_owner_b2:
    "paid in stablecoin that auto-converts to local rails (PIX, ach, sepa). you never touch crypto.",
  aud_owner_b3: "sign in with email. zero seed phrases, zero wallets to manage.",
  aud_owner_stat_n: "$ 9,600",
  aud_owner_stat_l: "rent R$ 1,800/mo × 6 months · 19.8% apr",

  aud_inv_kicker: "capital allocators",
  aud_inv_title: "yield backed by real receivables.",
  aud_inv_b1:
    "receivables backed by rent insurance where local regulation supports it. real default rate near zero.",
  aud_inv_b2: "stablecoin-denominated vault with rising share price. withdraw anytime.",
  aud_inv_b3: "every receivable has an on-chain hash. public audit, verified counterparty.",
  aud_inv_stat_n: "+19.7% apr",
  aud_inv_stat_l: "vault average over the last 90 days",

  sec02_kicker: "the flow",
  how_h2: "four steps. one contract. zero rate surprises.",
  how_s1_t: "agency registers",
  how_s1_d:
    "partner agency validates the lease off-chain and registers the receivable on-chain. rate written now, immutable.",
  how_s2_t: "vault funds",
  how_s2_d:
    "investors deposit stablecoin into the vault. when there is liquidity, the vault pays the owner in seconds.",
  how_s3_t: "local settlement",
  how_s3_d:
    "stablecoin converts via the local payment rail (PIX in brazil, ach/sepa elsewhere). owner receives fiat in their account.",
  how_s4_t: "rent repays",
  how_s4_d:
    "tenant pays monthly rent to the agency. the agency forwards it to the contract. principal + interest flows back into the vault.",

  sec03_kicker: "why now",
  trac_h2: "rent is predictable income. accessing it today is not.",
  trac_p:
    "around the world, owners with active leases wait twelve months to get money that is already theirs. off-chain fintechs filled the gap with opaque pricing that changes between simulation and contract. brix solves this with a rate written into the smart contract — starting in brazil, where real-estate credit was cut in half in six months, and expanding to any market with local stablecoin infrastructure.",
  trac_r1: "rented units in brazil alone",
  trac_r2: "brazilian families rent their home",
  trac_r3: "real-estate credit cut in 1H25 (br)",
  trac_r4: "global rental income market",
  trac_r5: "owners without an instrument",
  trac_r6: "target annual yield",

  sec04_kicker: "brix vs off-chain advances",
  cont_h2: "what changes when the rule lives in the contract instead of the terms of service.",
  cont_col_brix: "brix",
  cont_col_other: "FIDC fintechs",
  cont_r1: ["rate visible in simulator", "yes", "yes"] as const,
  cont_r2: ["rate immutable after signing", "yes", "no"] as const,
  cont_r3: ["rent insurance on operations", "85%", "not required"] as const,
  cont_r4: ["verifiable counterparty", "on-chain", "closed"] as const,
  cont_r5: ["investor exit", "vault liquidity", "wait for FIDC maturity"] as const,
  cont_r6: ["custody of funds", "smart contract", "institution"] as const,

  foot_h1: "rent is predictable income.",
  foot_h2: "it should not take 12 months to access it.",
  foot_cta_owner: "start as an owner",
  foot_cta_inv: "start as an investor",
  foot_meta: "built on solana · stablecoin-native · global ambition",

  pub_ll_kicker: "for property owners",
  pub_ll_h1_a: "advance up to 12 months",
  pub_ll_h1_b: "of rent today.",
  pub_ll_sub:
    "simulate in seconds. the rate you see is the rate that goes into the contract — written on-chain, immutable. you get paid via local rails.",
  pub_ll_b1_t: "immutable rate",
  pub_ll_b1_d:
    "the rate is written into the smart contract at signing. it never changes after that. ever.",
  pub_ll_b2_t: "paid within 24h",
  pub_ll_b2_d:
    "stablecoin auto-converts to your local payment rail. you never need to touch crypto.",
  pub_ll_b3_t: "email sign-in",
  pub_ll_b3_d: "zero seed phrases, zero wallets to manage. use brix like any other app.",
  pub_ll_sim_h: "simulate now, no login needed.",
  pub_ll_sim_sub: "the rate you see here is the rate that goes into the contract. no surprises.",
  pub_ll_sim_cta: "create account to request",

  pub_inv_kicker: "for investors",
  pub_inv_h1_a: "rental receivables",
  pub_inv_h1_b: "with an immutable rate.",
  pub_inv_sub:
    "on-chain vault backed by real rental contracts. rate written into the smart contract, predictable repayment, no speculation.",
  pub_inv_cta: "start investing",
  pub_inv_preview_h: "the vault in numbers.",
  pub_inv_s1: "target apr",
  pub_inv_s2: "contracts with rent insurance",
  pub_inv_s3: "bait-and-switch",
  pub_inv_s4: "lockup · withdraw anytime",
  pub_inv_b1_t: "predictable yield",
  pub_inv_b1_d: "receivables with monthly repayment. share price grows as the vault collects.",
  pub_inv_b2_t: "rent insurance",
  pub_inv_b2_d:
    "where local regulation supports it, contracts come with insurance. real default rate near zero.",
  pub_inv_b3_t: "on-chain transparency",
  pub_inv_b3_d: "every receivable has an on-chain hash. public audit, verifiable counterparty.",
  pub_inv_how_h: "how the vault works.",
  pub_inv_hw1_t: "deposit",
  pub_inv_hw1_d:
    "send stablecoin to the vault. receive shares (brxV) that appreciate over time.",
  pub_inv_hw2_t: "vault funds",
  pub_inv_hw2_d:
    "the vault uses liquidity to fund rental receivables originated by partner agencies.",
  pub_inv_hw3_t: "withdraw anytime",
  pub_inv_hw3_d: "burn shares and receive back principal + accrued yield. no lockup.",

  pub_ag_kicker: "for agencies",
  pub_ag_h1_a: "originate receivables",
  pub_ag_h1_b: "with an immutable rate.",
  pub_ag_sub:
    "offer rent advances to the owners in your portfolio. the rate is written on-chain — no reputational risk from opaque pricing.",
  pub_ag_cta: "become a partner",
  pub_ag_b1_t: "new product, zero inventory",
  pub_ag_b1_d:
    "offer rent advances as a service. the vault funds, you originate and collect your commission.",
  pub_ag_b2_t: "immutable rate for the owner",
  pub_ag_b2_d:
    "the rate is written into the smart contract. your client knows exactly what they will pay. zero surprises.",
  pub_ag_b3_t: "simple forwarding",
  pub_ag_b3_d:
    "collect rent from the tenant as always. forward to the contract in one click. principal + interest flows back to the vault.",
  pub_ag_how_h: "how it works for your agency.",
  pub_ag_hw1_t: "sign up as a partner",
  pub_ag_hw1_d: "create an account, verify your agency, and access the origination portal.",
  pub_ag_hw2_t: "register the receivable",
  pub_ag_hw2_d:
    "enter contract + rent insurance. review terms. rate written on-chain when you confirm.",
  pub_ag_hw3_t: "owner gets paid",
  pub_ag_hw3_d:
    "vault funds the contract. stablecoin converts to the owner's local rail within 24h.",
  pub_ag_hw4_t: "monthly forwarding",
  pub_ag_hw4_d:
    "collect rent from the tenant as usual. forward to the smart contract. vault gets principal + interest.",

  log_brand: "sign in to brix",
  log_sub:
    "sign in with email. no seed phrases, no crypto to manage — you use brix like any other app.",
  sec_partners_kicker: "partners",
  partners_h: "distributed origination via partner agencies.",
  partners_p:
    "brix connects to licensed real-estate agencies that know the tenant and originate the receivable. each partner operates in their local market. the network grows as we enter new regions.",
  partners_founding: "founding partner",
  partners_role: "origination · brazil",
  partners_units: "selectimob.com.br",
  partners_more: "new partnerships coming soon",
  log_email_label: "email",
  log_email_ph: "you@email.com",
  log_continue: "continue",
  log_code_h: "enter the code",
  log_code_sub: "we sent a 6-digit code to",
  log_code_hint: "tip: type any 6 digits to continue",
  log_persona_h: "how do you use brix?",
  log_persona_sub: "you can switch at any time.",
  log_p_landlord_t: "property owner",
  log_p_landlord_d: "i own a leased property and want to advance the rent.",
  log_p_agency_t: "agency",
  log_p_agency_d: "i originate contracts and manage the portfolio.",
  log_p_investor_t: "investor",
  log_p_investor_d: "i want to allocate capital into rental receivables.",
  log_secure: "secured by privy",

  shell_logout: "sign out",
  shell_landlord: "owner",
  shell_agency: "agency",
  shell_investor: "investor",

  ll_tab_overview: "overview",
  ll_tab_simulate: "simulate",
  ll_tab_contracts: "my contracts",
  ll_greet: "hi, marina",
  ll_overview_h1_a: "you have",
  ll_overview_h1_b: "in rent due over the next 60 days.",
  ll_overview_h1_b_short: "in rent due.",
  ll_kpi1_l: "advanced this year",
  ll_kpi1_s: "contract BRX-0421",
  ll_kpi2_l: "current rate",
  ll_kpi2_v: "19.8% apr",
  ll_kpi2_s: "immutable until 2027-04-21",
  ll_kpi3_l: "rent insurance",
  ll_kpi3_v: "active",
  ll_kpi3_s: "porto seguro coverage",
  ll_repay_h: "repayment in progress",
  ll_repay_paid: "installments paid",
  ll_repay_progress: (paid: number) => `$ ${paid.toLocaleString("en-US")} repaid`,
  ll_repay_next: "next",
  ll_simulate_cta: "simulate another advance",

  sim_h1: "simulate an advance",
  sim_sub: "the rate you see here is the rate that goes into the contract. it does not change.",
  sim_rent_l: "monthly rent",
  sim_months_l: "months to advance",
  sim_insurance_note: "contract must have active rent insurance (porto, too, mapfre).",
  sim_immutable: "immutable rate",
  sim_you_get: "you receive today",
  sim_eta: "lands in your account within 24h of approval",
  sim_r_assigned: "rents assigned",
  sim_r_total: "gross total",
  sim_r_apr: "annual rate (locked)",
  sim_r_cost: "cost of advance",
  sim_r_monthly: "monthly repayment",
  sim_submit: "request advance",
  sim_done_h: "request submitted",
  sim_done_p_a: "the originating agency will validate the contract. once approved, the funds",
  sim_done_p_b: "land in your account within 24h.",
  sim_done_pending: "pending contract",
  sim_done_again: "simulate another",

  contracts_h: "my contracts",
  cell_advanced: "advanced",
  cell_rate: "rate",
  cell_installments: "installments",
  cell_insurance: "insurance",
  cell_insurance_active: "rent ins. active",

  ag_tab_portfolio: "portfolio",
  ag_tab_register: "register receivable",
  ag_tab_repay: "register repayment",
  ag_kicker: "partner agency dashboard",
  ag_h1: "receivables portfolio",
  ag_kpi1_l: "total active",
  ag_kpi1_s: "contracts across partner network",
  ag_kpi2_l: "on-chain",
  ag_kpi2_s: "registered on devnet",
  ag_kpi3_l: "funded",
  ag_kpi3_s: (n: number) => `${n} in progress`,
  ag_kpi4_l: "default",
  ag_kpi4_s: "insurance triggered",
  ag_search_ph: "search by id, owner or address…",
  ag_th_id: "id",
  ag_th_owner: "owner",
  ag_th_property: "property",
  ag_th_value: "value",
  ag_th_rate: "rate",
  ag_th_inst: "inst.",
  ag_th_status: "status",

  reg_h1: "register receivable",
  reg_sub: (n: number, total: number) =>
    `step ${n} of ${total} · off-chain validation first, on-chain write next`,
  reg_landlord_l: "owner",
  reg_landlord_ph: "full name",
  reg_address_l: "property address",
  reg_address_ph: "street, number, unit, city",
  reg_rent_l: "monthly rent",
  reg_months_l: "months",
  reg_insurer_l: "rent insurer",
  reg_insurer_none: "no rent insurance",
  reg_review_cta: "review before signing",
  reg_warn: "once registered, the rate cannot be changed.",
  reg_r_landlord: "owner",
  reg_r_property: "property",
  reg_r_total: "total value",
  reg_r_inst: "installments",
  reg_r_apr: "annual rate",
  reg_r_insurance: "insurance",
  reg_back: "back",
  reg_confirm: "sign on-chain",
  reg_done_h: "receivable registered on-chain",
  reg_done_p: (apr: string) =>
    `${apr} rate written into the smart contract. owner is notified by email.`,
  reg_done_view: "view portfolio",
  reg_done_again: "register another",

  repay_h1: "register repayment",
  repay_sub: "monthly forwarding of received rent to the smart contract.",
  repay_contract_l: "contract",
  repay_inst: "installment",
  repay_value: "installment amount",
  repay_rest: "remaining after this",
  repay_confirm: "confirm forwarding",
  repay_done_h: "installment forwarded to vault",
  repay_done_p_a:
    "were debited from the agency and credited to the vault. share price went up.",
  repay_done_again: "another installment",

  inv_tab_vault: "vault",
  inv_tab_deposit: "deposit",
  inv_tab_withdraw: "withdraw",
  inv_tab_positions: "my position",
  inv_kicker: "on-chain vault · solana devnet",
  inv_h1_empty: "vault awaits first deposit",
  inv_h1_active: "vault funding active rental contracts",
  inv_tvl_l: "total value locked",
  inv_tvl_delta: "+$ 1,842 in last 24h",
  inv_apr_30d: "apr 30d",
  inv_kpi_util: "utilization",
  inv_kpi_util_s: (n: number) => `${n} active contracts`,
  inv_kpi_insurance: "rent insurance",
  inv_kpi_insurance_s: "of contracts covered",
  inv_kpi_active: "active contracts",
  inv_kpi_active_s: (n: number) =>
    n === 1 ? "backing the vault" : `${n} backing the vault`,
  inv_kpi_active_s_empty: "vault waiting for first receivable",
  inv_actions: "actions",
  inv_deposit_cta: "deposit",
  inv_withdraw_cta: "withdraw",
  inv_backing_h: "receivables backing the vault",
  inv_backing_count: (n: number) => `${n} active`,
  inv_th_property: "property",
  inv_th_city: "city",
  inv_chart_x: ["60d ago", "45d", "30d", "15d", "today"] as const,

  dep_h1: "deposit into vault",
  dep_sub: "you receive shares (brxV) that grow as the vault repays.",
  dep_amount_l: "amount",
  dep_share_price: "current share price",
  dep_shares_est: "estimated shares",
  dep_apr_exp: "expected apr",
  dep_lockup: "lockup",
  dep_lockup_v: "none, withdraw anytime",
  dep_confirm: "confirm deposit",
  dep_signed: "signed by your embedded wallet · no seed phrase",
  dep_done_h: "deposit confirmed",
  dep_done_p_a: "you received",
  dep_done_p_b: "shares.",
  dep_done_again: "deposit more",

  wd_h1: "withdraw from vault",
  wd_sub: "burns shares · funds returned to your wallet within seconds.",
  wd_shares_l: "shares (brxV)",
  wd_available: "available",
  wd_max: "use max",
  wd_you_get: "you receive",
  wd_gas: "gas cost",
  wd_confirm: "confirm withdrawal",
  wd_insufficient: "insufficient balance",

  pos_h1: "my position",
  pos_kpi_dep: "deposited",
  pos_kpi_dep_s: "2 transactions",
  pos_kpi_value: "current value",
  pos_kpi_yield: "yield",
  pos_kpi_yield_s: "since feb 14",
  pos_kpi_shares: "shares",
  pos_history_h: "transaction history",
  pos_tx_deposit: "deposit",
  pos_tx_yield: "yield accrued",

  how_kicker: "how it works",
  how_page_h1_a: "three roles, one contract,",
  how_page_h1_b: "a rate that does not change.",
  how_page_p:
    "brix connects owners who want to advance the rent on their properties, the agency that originates the contracts, and investors who fund the vault. each role has its own portal.",
  how_p1_kicker: "owner",
  how_p1_t: "advance 12 months of rent",
  how_p1_s: [
    "sign in with email. zero seed phrases, zero crypto to manage.",
    "the simulator shows exactly what you receive. no fine print.",
    "the originating agency validates the contract within 24h.",
    "stablecoin converts to your local rail (PIX, ach, sepa) and lands in your account.",
  ] as const,
  how_p2_kicker: "agency",
  how_p2_t: "originate and manage receivables",
  how_p2_s: [
    "enter the contract + insurance in the agency portal.",
    "review terms. rate is written on-chain when you confirm.",
    "collect monthly rent from the tenant as usual.",
    "forward the installment to the smart contract in one click. vault gets principal + interest.",
  ] as const,
  how_p3_kicker: "investor",
  how_p3_t: "allocate capital into rental receivables",
  how_p3_s: [
    "sign in with email or connect your solana wallet.",
    "deposit stablecoin into the vault. receive shares (brxV) that appreciate over time.",
    "see in real time which receivables back your position.",
    "withdraw whenever. share price = principal + accrued yield.",
  ] as const,
  how_try_as: (kicker: string) => `try as ${kicker}`,

  // login extras (new flow: only investor + agency self-register)
  log_checking: "checking your registration",
  log_landlord_note_h: "are you a property owner?",
  log_landlord_note_p:
    "your agency adds you to the platform. just log in with the email they used — your contracts show up here automatically.",

  // agency — new keys
  ag_tab_clients: "clients",
  ag_new_advance: "new advance",

  // agency clients (CRM)
  clients_kicker: "client roster",
  clients_h: "clients",
  clients_sub: (n: number) =>
    `${n} ${n === 1 ? "owner registered" : "owners registered"}`,
  clients_new: "new client",
  clients_cancel: "cancel",
  clients_save: "save",
  clients_form_h: "register owner",
  clients_form_name_l: "name",
  clients_form_name_ph: "full name",
  clients_form_email_l: "email",
  clients_form_addr_l: "property address",
  clients_form_addr_ph: "street, number, unit, city",
  clients_form_rent_l: "monthly rent (BRZ)",
  clients_form_pix_l: "PIX key",
  clients_form_pix_ph: "optional · defaults to email",
  clients_st_rent: "rent",
  clients_st_active: "active contracts",
  clients_advance: "advance",

  // register receivable — new keys
  reg_mode_existing: "from roster",
  reg_mode_new: "register now",
  reg_pick_client_l: "select owner",

  // repay — new key
  repay_empty: "no funded contracts to register a payment for.",

  // landlord portal — new flow keys
  ll_tab_history: "history",
  ll_not_linked_h: "not linked yet",
  ll_not_linked_p:
    "your agency hasn't added you yet. ask them to register you with this email — then refresh the page.",
  ll_h1_empty: "no advances yet",
  ll_h1_active: "your active advances",
  ll_partner: "partner agency",
  ll_property: "property",
  ll_total_received: "total received via brix",
  ll_pix_sent: "PIX sent to",
  ll_no_active: "no active contracts right now.",
  ll_history_h: "contract history",
  ll_history_empty: "no completed contracts yet.",
  ll_repayment_total: "total to repay",
  ll_view_tx: "view on-chain transaction",
  ll_partner_city: "city",

  // agency onboarding (founding partner application)
  ob_kicker: "application · partner agency",
  ob_h1: "become a founding partner agency",
  ob_sub:
    "before operating through brix, your agency goes through a quick KYB, license and management model check. fill this in and the team will be in touch.",
  ob_company_l: "agency name",
  ob_company_ph: "e.g. Selectimob",
  ob_contact_l: "contact in charge",
  ob_contact_ph: "name of who signs for the company",
  ob_email_l: "company email",
  ob_cnpj_l: "tax id (CNPJ)",
  ob_creci_l: "real-estate license (CRECI)",
  ob_website_l: "website",
  ob_city_l: "city / state",
  ob_contracts_l: "contracts under management",
  ob_contracts_help:
    "approximate number of active rental contracts your agency manages today.",
  ob_disclaimer:
    "by submitting you authorize the brix team to contact you to verify the data above. nothing is recorded on-chain before approval.",
  ob_submit: "submit application",
  ob_done_kicker: "application received",
  ob_done_h: "thanks, {company}",
  ob_done_p:
    "we'll review the data within 48 business hours and reply by email. nothing is registered on-chain and no clients are added until approval.",
  ob_demo_label: "demo mode",
  ob_demo_p:
    "this is a prototype — you can simulate approval right now to see the agency dashboard.",
  ob_demo_cta: "simulate approval and enter",

  // agency portfolio empty state
  ag_empty_h: "no receivables yet",
  ag_empty_p:
    "register the first rental advance to see it in the portfolio. each receivable is recorded on-chain with an immutable rate.",
  ag_empty_cta: "register first receivable",

  // agency clients — extras
  clients_empty_h: "your client roster is empty",
  clients_empty_p:
    "register property owners before advancing contracts. each client can have multiple properties.",
  clients_empty_cta: "add first owner",
  clients_form_cpf_l: "tax id (CPF)",
  clients_form_phone_l: "phone",
  clients_st_props: "properties",
  clients_props_h: "linked properties",
  clients_add_prop: "add property",
  clients_no_props: "this owner has no properties registered yet.",
  clients_prop_addr_l: "property address",
  clients_prop_addr_ph: "street, number, unit, city",
  clients_prop_rent_l: "monthly rent (BRZ)",

  // register receivable — extras
  reg_pick_client_ph: "select an owner…",
  reg_pick_property_l: "property",
  reg_no_clients_h: "no clients yet",
  reg_no_clients_p:
    "before advancing you need to register at least one owner in your roster.",
  reg_no_clients_cta: "go to clients",
  reg_no_props_for_client: "this owner has no properties registered yet.",
  reg_no_props_cta: "add a property now →",
  reg_pre_total: "total assigned",
  reg_pre_apr: "annual rate",
  reg_months_help: "between 3 and 12 months · rate scales lightly with term.",

  // repay — empty state extras
  repay_empty_h: "no funded contracts",
  repay_empty_p:
    "register and fund a receivable before posting tenant repayments.",
  repay_empty_cta: "view portfolio",

  // invest — empty states
  inv_backing_empty:
    "vault waiting for its first receivable · no contracts being backed yet.",
  pos_history_empty:
    "no history yet · make your first deposit to start earning.",
  pos_history_pending:
    "history pending · upcoming transactions will appear here automatically.",
};

// Widened value type — translations can be strings, function-valued
// templates, or readonly tuples. Callers narrow at use site.
export type TValue =
  | string
  | ((...args: unknown[]) => string)
  | readonly (string | number)[];

export const TRANSLATIONS: Record<Lang, Record<string, TValue>> = {
  pt: pt as unknown as Record<string, TValue>,
  en: en as unknown as Record<string, TValue>,
};
export type TKey = keyof typeof pt;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: <K extends TKey>(key: K) => (typeof pt)[K];
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "brix_lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeToLang, getLangSnapshot, getServerLangSnapshot);

  // mirror to <html lang>
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, l);
    window.dispatchEvent(new Event("brix-lang-change"));
  }, []);

  const value = useMemo<LangContextValue>(() => {
    const dict = lang === "pt" ? pt : (en as unknown as typeof pt);
    return {
      lang,
      setLang,
      t: <K extends TKey>(key: K) => dict[key],
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

function getLangSnapshot(): Lang {
  if (typeof window === "undefined") return "pt";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "pt";
}

function getServerLangSnapshot(): Lang {
  return "pt";
}

function subscribeToLang(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  const handleCustom = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("brix-lang-change", handleCustom as EventListener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("brix-lang-change", handleCustom as EventListener);
  };
}

export function useT(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // fallback to PT outside provider (e.g. SSR before hydration)
    return {
      lang: "pt",
      setLang: () => {},
      t: <K extends TKey>(key: K) => pt[key],
    };
  }
  return ctx;
}
