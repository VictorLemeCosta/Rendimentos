async function carregarDadosUsuario() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return null;
  }

  const { data: profile, error: profileError } = await window.supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Erro ao carregar profile:", profileError);
  }

  const { data: financialProfile, error: financialError } = await window.supabaseClient
    .from("financial_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (financialError) {
    console.error("Erro ao carregar financial_profile:", financialError);
  }

  const { data: benefits, error: benefitsError } = await window.supabaseClient
    .from("user_benefits")
    .select("*")
    .eq("user_id", user.id);

  if (benefitsError) {
    console.error("Erro ao carregar benefícios:", benefitsError);
  }

  const { data: expenses, error: expensesError } = await window.supabaseClient
    .from("user_expenses")
    .select("*")
    .eq("user_id", user.id);

  if (expensesError) {
    console.error("Erro ao carregar despesas:", expensesError);
  }

  const dados = {
    user,
    profile: profile || {},
    financialProfile: financialProfile || {},
    benefits: benefits || [],
    expenses: expenses || []
  };

  window.financeHubUserData = dados;

  preencherSaudacaoUsuario(dados);
  preencherTextosDinamicosHero(dados);

  window.dispatchEvent(
    new CustomEvent("financeHubDataLoaded", {
      detail: dados
    })
  );

  return dados;
}

function preencherSaudacaoUsuario(dados) {
  const greeting = document.getElementById("userGreeting");

  if (!greeting) {
    return;
  }

  const nomeCompleto = dados.profile?.nome || "";
  const primeiroNome = nomeCompleto.split(" ")[0] || "usuário";

  greeting.textContent = `Olá, ${primeiroNome}`;
}

function obterConfiguracaoFinanceiraUsuario() {
  const dados = window.financeHubUserData;

  if (!dados) {
    return null;
  }

  const financeiro = dados.financialProfile || {};

  return {
    nome: dados.profile?.nome || "",

    salarioBruto: Number(financeiro.salario_bruto || 0),
    salarioLiquido: Number(financeiro.salario_liquido || 0),

    valorVr: Number(financeiro.valor_vr || 0),
    valorVa: Number(financeiro.valor_va || 0),
    valorVrVa: Number(financeiro.valor_vr_va || 0),

    bancoSalario: financeiro.banco_salario || "outro",
    fornecedorVr: financeiro.fornecedor_vr || "outro",
    fornecedorVa: financeiro.fornecedor_va || "outro",

    outrosBeneficios: dados.benefits || [],
    despesasExtras: dados.expenses || [],

    jornadaTipo: financeiro.jornada_tipo || "SEG_SEX",
    horaInicio: financeiro.hora_inicio || "09:00",
    horaFim: financeiro.hora_fim || "18:00",
    diasTrabalho: financeiro.dias_trabalho || [1, 2, 3, 4, 5],
    folgaSemanal: financeiro.folga_semanal,

    dataReferencia12x36: financeiro.data_referencia_12x36 || null,
    turno12x36: financeiro.turno_12x36 || null,


    valorVt: Number(financeiro.valor_vt || 0),
    fornecedorVt: financeiro.fornecedor_vt || "outro",
    estadoTransporte: financeiro.estado_transporte || "",
    cidadeTransporte: financeiro.cidade_transporte || ""
  };
}

function preencherTextosDinamicosHero(dados) {
  const financeiro = dados.financialProfile || {};

  const descricao = document.getElementById("dynamicHeroDescription");
  const nota = document.getElementById("dynamicHeroNote");
  const badge = document.getElementById("dynamicWorkBadge");

  if (!descricao || !nota || !badge) {
    return;
  }

  const jornadaTipo = financeiro.jornada_tipo || "SEG_SEX";
  const horaInicio = normalizarHoraTexto(financeiro.hora_inicio || "09:00");
  const horaFim = normalizarHoraTexto(financeiro.hora_fim || "18:00");

  const textoJornada = obterTextoJornada(financeiro);

  descricao.textContent =
    `Este painel transforma seus rendimentos mensais em uma visão prática por segundo, minuto, hora, dia de trabalho e mês. ` +
    `O acumulador em tempo real considera sua jornada cadastrada: ${textoJornada}, das ${horaInicio} às ${horaFim}.`;

  nota.textContent =
    `Para manter os valores consistentes entre dispositivos, mantenha os dados financeiros e a jornada sempre atualizados. ` +
    `O cálculo respeita os dias e horários configurados no seu perfil.`;

  badge.textContent = `${textoJornada} | ${horaInicio} às ${horaFim}`;
}

function normalizarHoraTexto(hora) {
  if (!hora) {
    return "--:--";
  }

  return String(hora).slice(0, 5);
}

function obterTextoJornada(financeiro) {
  const jornadaTipo = financeiro.jornada_tipo || "SEG_SEX";

  if (jornadaTipo === "SEG_SEX") {
    return "Segunda a sexta";
  }

  if (jornadaTipo === "SEG_SAB") {
    return "Segunda a sábado";
  }

  if (jornadaTipo === "6X1") {
    return "Escala 6x1";
  }

  if (jornadaTipo === "12X36") {
    return "Escala 12x36";
  }

  if (jornadaTipo === "TODOS_DIAS") {
    return "Todos os dias";
  }

  if (jornadaTipo === "PERSONALIZADO") {
    return "Jornada personalizada";
  }

  return "Jornada configurada";
}