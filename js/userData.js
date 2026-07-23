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
    outrosBeneficios: dados.benefits || [],
    despesasExtras: dados.expenses || [],
    jornadaTipo: financeiro.jornada_tipo || "SEG_SEX",
    horaInicio: financeiro.hora_inicio || "09:00",
    horaFim: financeiro.hora_fim || "18:00",
    diasTrabalho: financeiro.dias_trabalho || [1, 2, 3, 4, 5],
    folgaSemanal: financeiro.folga_semanal
  };
}
