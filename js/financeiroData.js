let currentFinancialUser = null;
let currentFinancialProfile = {};
let currentBenefits = [];
let currentTransactions = [];
let currentClosings = [];
let expensePieChartInstance = null;
let incomePieChartInstance = null;
let balanceChartInstance = null;

function formatBRLFinance(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    anoMes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  };
}

async function carregarDashboardFinanceiroReal() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  currentFinancialUser = user;

  const todayInput = document.getElementById("transactionDate");

  if (todayInput && !todayInput.value) {
    todayInput.value = new Date().toISOString().slice(0, 10);
  }

  await carregarPerfilFinanceiro();
  await carregarBeneficiosFinanceiros();
  await gerarLancamentosAutomaticosDoMes();
  await carregarLancamentosDoMes();
  await carregarHistoricoReal();

  renderizarResumoFinanceiroReal();
  renderizarLancamentosDoMes();
  renderizarHistoricoMensalReal();
  renderizarGraficosFinanceiros();
  ajustarCampoDescricaoLancamento();
}

async function carregarPerfilFinanceiro() {
  const { data, error } = await window.supabaseClient
    .from("financial_profile")
    .select("*")
    .eq("user_id", currentFinancialUser.id)
    .single();

  if (error) {
    console.error("Erro ao carregar financial_profile:", error);
    currentFinancialProfile = {};
    return;
  }

  currentFinancialProfile = data || {};

  preencherConfiguracaoLancamentosAutomaticos();

  const closingInput = document.getElementById("closingDayInput");

    if (closingInput) {
    closingInput.value = currentFinancialProfile.dia_fechamento_mes || 31;
    }
}

async function carregarBeneficiosFinanceiros() {
  const { data, error } = await window.supabaseClient
    .from("user_benefits")
    .select("*")
    .eq("user_id", currentFinancialUser.id);

  if (error) {
    console.error("Erro ao carregar benefícios:", error);
    currentBenefits = [];
    return;
  }

  currentBenefits = data || [];
}

async function carregarLancamentosDoMes() {
  const range = getCurrentMonthRange();

  const { data, error } = await window.supabaseClient
    .from("financial_transactions")
    .select("*")
    .eq("user_id", currentFinancialUser.id)
    .gte("data_lancamento", range.start)
    .lte("data_lancamento", range.end)
    .order("data_lancamento", { ascending: false });

  if (error) {
    console.error("Erro ao carregar lançamentos:", error);
    currentTransactions = [];
    return;
  }

  currentTransactions = data || [];
}

async function carregarHistoricoReal() {
  const { data, error } = await window.supabaseClient
    .from("monthly_financial_closings")
    .select("*")
    .eq("user_id", currentFinancialUser.id)
    .order("ano_mes", { ascending: false });

  if (error) {
    console.error("Erro ao carregar histórico real:", error);
    currentClosings = [];
    return;
  }

  currentClosings = data || [];
}

function calcularTotalBeneficiosAtuais() {
  return currentTransactions
    .filter((item) =>
      item.tipo === "receita" &&
      ["VR", "VA", "VT"].includes(item.categoria)
    )
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

function calcularReceitasDoMes() {
  return currentTransactions
    .filter((item) => item.tipo === "receita")
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

function calcularDespesasDoMes() {
  return currentTransactions
    .filter((item) => item.tipo === "despesa")
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

function renderizarResumoFinanceiroReal() {
  const receitas = calcularReceitasDoMes();
  const despesas = calcularDespesasDoMes();
  const beneficios = calcularTotalBeneficiosAtuais();
  const saldo = receitas + beneficios - despesas;

  document.getElementById("realMonthlyIncome").textContent = formatBRLFinance(receitas);
  document.getElementById("realMonthlyExpenses").textContent = formatBRLFinance(despesas);
  document.getElementById("realMonthlyBenefits").textContent = formatBRLFinance(beneficios);
  document.getElementById("realMonthlyBalance").textContent = formatBRLFinance(saldo);
}

function renderizarLancamentosDoMes() {
  const tbody = document.getElementById("transactionsTableBody");

  if (!tbody) {
    return;
  }

  if (!currentTransactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum lançamento registrado neste mês.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentTransactions.map((item) => `
    <tr>
      <td>${new Date(item.data_lancamento + "T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td>${capitalizarTexto(item.tipo)}</td>
      <td>${capitalizarTexto(item.categoria)}</td>
      <td>${capitalizarPrimeiraLetra(item.descricao)}</td>
      <td>${formatBRLFinance(item.valor)}</td>
      <td>
        <button type="button" class="btn" onclick="removerLancamentoFinanceiro('${item.id}')">
          Remover
        </button>
      </td>
    </tr>
  `).join("");
}

function renderizarHistoricoMensalReal() {
  const tbody = document.getElementById("realHistoryTableBody");

  if (!tbody) {
    return;
  }

  if (!currentClosings.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Nenhum mês fechado ainda.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentClosings.map((item) => `
    <tr>
      <td>${item.ano_mes}</td>
      <td>${formatBRLFinance(item.total_receitas)}</td>
      <td>${formatBRLFinance(item.total_despesas)}</td>
      <td>${formatBRLFinance(item.total_beneficios)}</td>
      <td>${formatBRLFinance(item.saldo_final)}</td>
      <td>${item.status}</td>
      <td>${new Date(item.fechado_em).toLocaleString("pt-BR")}</td>
    </tr>
  `).join("");
}

async function salvarLancamentoFinanceiro() {
  const user = await garantirUsuarioFinanceiro();

  if (!user) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const tipo = document.getElementById("transactionType").value;
  
  let descricao = document.getElementById("transactionDescription").value.trim();
  const categoria = document.getElementById("transactionCategory").value;

    if (!descricao) {
    descricao = categoria;
    }

  const valor = Number(document.getElementById("transactionValue").value || 0);
  const data = document.getElementById("transactionDate").value;
  const recorrente = document.getElementById("transactionRecurring").value === "true";

  if (!descricao || valor <= 0 || !data) {
    alert("Preencha descrição, valor e data.");
    return;
  }

  const { error: insertError } = await window.supabaseClient
    .from("financial_transactions")
    .insert({
      user_id: user.id,
      tipo,
      categoria,
      descricao,
      valor,
      data_lancamento: data,
      recorrente,
      origem: "manual"
    });

  if (insertError) {
    console.error("Erro ao salvar lançamento:", insertError);
    alert("Erro ao salvar lançamento: " + insertError.message);
    return;
  }

  document.getElementById("transactionDescription").value = "";
  document.getElementById("transactionValue").value = "";

  await carregarDashboardFinanceiroReal();
}

async function removerLancamentoFinanceiro(id) {
  const { error } = await window.supabaseClient
    .from("financial_transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao remover lançamento:", error);
    alert("Erro ao remover lançamento: " + error.message);
    return;
  }

  await carregarDashboardFinanceiroReal();
}

async function fecharMesFinanceiro() {
  const range = getCurrentMonthRange();

  const receitas = calcularReceitasDoMes();
  const despesas = calcularDespesasDoMes();
  const beneficios = calcularTotalBeneficiosAtuais();
  const saldo = receitas + beneficios - despesas;

  const perfil = currentFinancialProfile || {};

  const confirmacao = confirm(
    `Deseja fechar o mês ${range.anoMes}?\n\n` +
    `Receitas: ${formatBRLFinance(receitas)}\n` +
    `Despesas: ${formatBRLFinance(despesas)}\n` +
    `Benefícios: ${formatBRLFinance(beneficios)}\n` +
    `Saldo: ${formatBRLFinance(saldo)}`
  );

  if (!confirmacao) {
    return;
  }

  const outrosBeneficios = currentBenefits
    .filter((beneficio) => beneficio.nome !== "VR" && beneficio.nome !== "VA")
    .reduce((sum, beneficio) => sum + Number(beneficio.valor || 0), 0);

  const payload = {
    user_id: currentFinancialUser.id,
    ano_mes: range.anoMes,

    data_inicio: range.start,
    data_fim: range.end,

    total_receitas: receitas,
    total_despesas: despesas,
    total_beneficios: beneficios,
    saldo_final: saldo,

    salario_bruto: Number(perfil.salario_bruto || 0),
    salario_liquido: Number(perfil.salario_liquido || 0),

    total_vr: Number(perfil.valor_vr || 0),
    total_va: Number(perfil.valor_va || 0),
    total_vt: Number(perfil.valor_vt || 0),
    total_outros_beneficios: outrosBeneficios,

    status: "fechado",
    fechado_em: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from("monthly_financial_closings")
    .upsert(payload, {
      onConflict: "user_id,ano_mes"
    });

  if (error) {
    console.error("Erro ao fechar mês:", error);
    alert("Erro ao fechar mês: " + error.message);
    return;
  }

  alert("Mês fechado com sucesso!");

  await carregarDashboardFinanceiroReal();
}

async function salvarDiaFechamentoFinanceiro() {
  const diaFechamento = Number(document.getElementById("closingDayInput").value || 31);

  if (!currentFinancialUser) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const { error } = await window.supabaseClient
    .from("financial_profile")
    .update({
      dia_fechamento_mes: diaFechamento,
      atualizado_em: new Date().toISOString()
    })
    .eq("user_id", currentFinancialUser.id);

  if (error) {
    console.error("Erro ao salvar dia de fechamento:", error);
    alert("Erro ao salvar configuração: " + error.message);
    return;
  }

  alert("Configuração de fechamento salva com sucesso.");

  await carregarDashboardFinanceiroReal();
}

function preencherConfiguracaoLancamentosAutomaticos() {
  const perfil = currentFinancialProfile || {};

  setValue("autoSalaryInput", String(perfil.auto_lancar_salario ?? true));
  setValue("salaryPaymentTypeInput", perfil.salario_pagamento_tipo || "unico");
  setValue("salaryPaymentDayInput", String(perfil.dia_pagamento_salario_1 || 5));

  setValue("salaryInstallment1PercentInput", perfil.salario_parcela1_percentual || 40);
  setValue("salaryInstallment1DayInput", String(perfil.dia_pagamento_salario_1 || 20));
  setValue("salaryInstallment2PercentInput", perfil.salario_parcela2_percentual || 60);
  setValue("salaryInstallment2RuleInput", perfil.salario_parcela2_regra || "ultimo_dia_util");
  setValue("salaryInstallment2DayInput", String(perfil.dia_pagamento_salario_2 || 31));

  setValue("autoBenefitsInput", String(perfil.auto_lancar_beneficios ?? true));
  setValue("benefitsPaymentDayInput", String(perfil.dia_pagamento_beneficios || 5));

  alternarModeloPagamentoSalario();
  atualizarPreviewLancamentosAutomaticos();
}

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

async function salvarConfiguracaoLancamentosAutomaticos() {
  const user = await garantirUsuarioFinanceiro();

  if (!user) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const tipoPagamento = document.getElementById("salaryPaymentTypeInput").value;

  const payload = {
    auto_lancar_salario: document.getElementById("autoSalaryInput").value === "true",
    salario_pagamento_tipo: tipoPagamento,

    salario_parcela1_percentual: tipoPagamento === "parcelado"
      ? Number(document.getElementById("salaryInstallment1PercentInput").value || 40)
      : 100,

    dia_pagamento_salario_1: tipoPagamento === "parcelado"
      ? Number(document.getElementById("salaryInstallment1DayInput").value || 20)
      : Number(document.getElementById("salaryPaymentDayInput").value || 5),

    salario_parcela2_percentual: tipoPagamento === "parcelado"
      ? Number(document.getElementById("salaryInstallment2PercentInput").value || 60)
      : 0,

    salario_parcela2_regra: document.getElementById("salaryInstallment2RuleInput")?.value || "dia_fixo",

    dia_pagamento_salario_2: Number(document.getElementById("salaryInstallment2DayInput")?.value || 31),

    auto_lancar_beneficios: document.getElementById("autoBenefitsInput").value === "true",
    dia_pagamento_beneficios: Number(document.getElementById("benefitsPaymentDayInput").value || 5),

    atualizado_em: new Date().toISOString()
  };

  const totalPercentual = Number(payload.salario_parcela1_percentual || 0) + Number(payload.salario_parcela2_percentual || 0);

  if (tipoPagamento === "parcelado" && totalPercentual !== 100) {
    alert("A soma das parcelas do salário precisa ser 100%.");
    return;
  }

  const { error } = await window.supabaseClient
    .from("financial_profile")
    .update(payload)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao salvar configuração automática:", error);
    alert("Erro ao salvar configuração: " + error.message);
    return;
  }

  alert("Configuração salva com sucesso.");

  await carregarDashboardFinanceiroReal();
}

async function gerarLancamentosAutomaticosDoMes() {
  const perfil = currentFinancialProfile || {};
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  const anoMes = `${ano}-${String(mes).padStart(2, "0")}`;

  const salario = Number(perfil.salario_bruto || 0);
  const autoSalario = perfil.auto_lancar_salario ?? true;
  const tipoPagamento = perfil.salario_pagamento_tipo || "unico";

  if (autoSalario && salario > 0) {
    if (tipoPagamento === "parcelado") {
      const percentual1 = Number(perfil.salario_parcela1_percentual || 40);
      const dia1 = Number(perfil.dia_pagamento_salario_1 || 20);

      const percentual2 = Number(perfil.salario_parcela2_percentual || 60);
      const regra2 = perfil.salario_parcela2_regra || "ultimo_dia_util";
      const dia2 = Number(perfil.dia_pagamento_salario_2 || 31);

      if (diaAtual >= dia1) {
        const dataParcela1 = dataPorDiaDoMes(ano, mes, dia1);

        await inserirLancamentoAutomatico({
          tipo: "receita",
          categoria: "Salário",
          descricao: `Salário automático - Parcela 1 (${percentual1}%)`,
          valor: salario * (percentual1 / 100),
          dataLancamento: dataParcela1,
          referencia: `salario-p1-${anoMes}`
        });
      }

      const dataParcela2 = obterDataPagamentoPorRegra(ano, mes, regra2, dia2);
      const diaParcela2 = Number(dataParcela2.slice(8, 10));

      if (diaAtual >= diaParcela2) {
        await inserirLancamentoAutomatico({
          tipo: "receita",
          categoria: "Salário",
          descricao: `Salário automático - Parcela 2 (${percentual2}%)`,
          valor: salario * (percentual2 / 100),
          dataLancamento: dataParcela2,
          referencia: `salario-p2-${anoMes}`
        });
      }
    } else {
      const diaSalario = Number(perfil.dia_pagamento_salario_1 || 5);

      if (diaAtual >= diaSalario) {
        await inserirLancamentoAutomatico({
          tipo: "receita",
          categoria: "Salário",
          descricao: "Salário mensal automático",
          valor: salario,
          dataLancamento: dataPorDiaDoMes(ano, mes, diaSalario),
          referencia: `salario-${anoMes}`
        });
      }
    }
  }

  await gerarBeneficiosAutomaticosDoMes();
}

async function inserirLancamentoAutomatico({ tipo, categoria, descricao, valor, dataLancamento, referencia }) {
  if (!currentFinancialUser) {
    return;
  }

  const { data: existing, error: selectError } = await window.supabaseClient
    .from("financial_transactions")
    .select("id")
    .eq("user_id", currentFinancialUser.id)
    .eq("referencia_auto", referencia)
    .maybeSingle();

  if (selectError) {
    console.error("Erro ao verificar lançamento automático:", selectError);
    return;
  }

  const payload = {
    user_id: currentFinancialUser.id,
    tipo,
    categoria,
    descricao,
    valor,
    data_lancamento: dataLancamento,
    recorrente: true,
    origem: "automatico",
    referencia_auto: referencia
  };

  if (existing) {
    const { error: updateError } = await window.supabaseClient
      .from("financial_transactions")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      console.error("Erro ao atualizar lançamento automático:", updateError);
    }

    return;
  }

  const { error: insertError } = await window.supabaseClient
    .from("financial_transactions")
    .insert(payload);

  if (insertError) {
    console.error("Erro ao criar lançamento automático:", insertError);
  }
}

async function garantirUsuarioFinanceiro() {
  if (currentFinancialUser) {
    return currentFinancialUser;
  }

  const {
    data: { user },
    error
  } = await window.supabaseClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  currentFinancialUser = user;
  return user;
}

function alternarModeloPagamentoSalario() {
  const tipo = document.getElementById("salaryPaymentTypeInput")?.value || "unico";
  const splitConfig = document.getElementById("salarySplitConfig");

  if (!splitConfig) {
    return;
  }

  if (tipo === "parcelado") {
    splitConfig.classList.remove("hidden");
  } else {
    splitConfig.classList.add("hidden");
  }
}

function dataPorDiaDoMes(ano, mes, dia) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaEfetivo = Math.min(Number(dia || 1), ultimoDia);

  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaEfetivo).padStart(2, "0")}`;
}

function obterUltimoDiaUtil(ano, mes) {
  let data = new Date(ano, mes, 0);

  while (data.getDay() === 0 || data.getDay() === 6) {
    data.setDate(data.getDate() - 1);
  }

  return data.toISOString().slice(0, 10);
}

function obterDataPagamentoPorRegra(ano, mes, regra, diaFixo) {
  if (regra === "ultimo_dia_util") {
    return obterUltimoDiaUtil(ano, mes);
  }

  if (regra === "ultimo_dia_mes") {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    return dataPorDiaDoMes(ano, mes, ultimoDia);
  }

  return dataPorDiaDoMes(ano, mes, diaFixo || 31);
}

async function gerarBeneficiosAutomaticosDoMes() {
  const perfil = currentFinancialProfile || {};
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  const anoMes = `${ano}-${String(mes).padStart(2, "0")}`;

  const autoBeneficios = perfil.auto_lancar_beneficios ?? true;
  const diaBeneficios = Number(perfil.dia_pagamento_beneficios || 5);

  if (!autoBeneficios || diaAtual < diaBeneficios) {
    return;
  }

  const vr = Number(perfil.valor_vr || 0);
  const va = Number(perfil.valor_va || 0);
  const vt = Number(perfil.valor_vt || 0);

  const dataBeneficios = dataPorDiaDoMes(ano, mes, diaBeneficios);

  if (vr > 0) {
    await inserirLancamentoAutomatico({
      tipo: "receita",
      categoria: "VR",
      descricao: "VR mensal automático",
      valor: vr,
      dataLancamento: dataBeneficios,
      referencia: `vr-${anoMes}`
    });
  }

  if (va > 0) {
    await inserirLancamentoAutomatico({
      tipo: "receita",
      categoria: "VA",
      descricao: "VA mensal automático",
      valor: va,
      dataLancamento: dataBeneficios,
      referencia: `va-${anoMes}`
    });
  }

  if (vt > 0) {
    await inserirLancamentoAutomatico({
      tipo: "receita",
      categoria: "VT",
      descricao: "VT mensal automático",
      valor: vt,
      dataLancamento: dataBeneficios,
      referencia: `vt-${anoMes}`
    });
  }
}

function capitalizarTexto(texto) {
  if (!texto) {
    return "";
  }

  return String(texto)
    .toLowerCase()
    .split(" ")
    .map((palavra) => {
      if (!palavra) {
        return "";
      }

      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

function capitalizarPrimeiraLetra(texto) {
  if (!texto) {
    return "";
  }

  const valor = String(texto).trim();

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function atualizarPreviewLancamentosAutomaticos() {
  const salaryPreview = document.getElementById("salaryAutoPreview");
  const benefitsPreview = document.getElementById("benefitsAutoPreview");

  if (!salaryPreview || !benefitsPreview) {
    return;
  }

  const autoSalary = document.getElementById("autoSalaryInput")?.value === "true";
  const salaryType = document.getElementById("salaryPaymentTypeInput")?.value || "unico";
  const salaryDay = document.getElementById("salaryPaymentDayInput")?.value || "5";

  const p1 = document.getElementById("salaryInstallment1PercentInput")?.value || "40";
  const p1Day = document.getElementById("salaryInstallment1DayInput")?.value || "20";

  const p2 = document.getElementById("salaryInstallment2PercentInput")?.value || "60";
  const p2Rule = document.getElementById("salaryInstallment2RuleInput")?.value || "ultimo_dia_util";
  const p2Day = document.getElementById("salaryInstallment2DayInput")?.value || "31";

  const autoBenefits = document.getElementById("autoBenefitsInput")?.value === "true";
  const benefitsDay = document.getElementById("benefitsPaymentDayInput")?.value || "5";

  if (!autoSalary) {
    salaryPreview.textContent = "Lançamento automático desativado";
  } else if (salaryType === "parcelado") {
    const textoRegra2 = p2Rule === "ultimo_dia_util"
      ? "último dia útil"
      : p2Rule === "ultimo_dia_mes"
        ? "último dia do mês"
        : `dia ${p2Day}`;

    salaryPreview.textContent = `${p1}% no dia ${p1Day} e ${p2}% no ${textoRegra2}`;
  } else {
    salaryPreview.textContent = `100% no dia ${salaryDay}`;
  }

  if (!autoBenefits) {
    benefitsPreview.textContent = "Lançamento automático desativado";
  } else {
    benefitsPreview.textContent = `VR, VA e VT no dia ${benefitsDay}`;
  }
}

function ajustarCampoDescricaoLancamento() {
  const categoria = document.getElementById("transactionCategory")?.value || "";
  const descricaoBox = document.getElementById("transactionDescriptionBox");
  const descricaoInput = document.getElementById("transactionDescription");

  if (!descricaoBox || !descricaoInput) {
    return;
  }

  const categoriasComDescricaoPadrao = {
    "Salário": "Salário",
    "VR": "VR",
    "VA": "VA",
    "VT": "VT",
    "Aluguel": "Aluguel",
    "Água": "Água",
    "Luz": "Luz",
    "Internet": "Internet",
    "Reembolso": "Reembolso",
    "PIX recebido": "PIX recebido"
  };

  if (categoriasComDescricaoPadrao[categoria]) {
    descricaoInput.value = categoriasComDescricaoPadrao[categoria];
    descricaoBox.classList.add("hidden");
    return;
  }

  descricaoInput.value = "";
  descricaoBox.classList.remove("hidden");
}

function capitalizarTexto(texto) {
  if (!texto) {
    return "";
  }

  return String(texto)
    .toLowerCase()
    .split(" ")
    .map((palavra) => {
      if (!palavra) {
        return "";
      }

      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
}

function capitalizarPrimeiraLetra(texto) {
  if (!texto) {
    return "";
  }

  const valor = String(texto).trim();

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function agruparPorCategoria(transacoes, tipo) {
  const agrupado = {};

  transacoes
    .filter((item) => item.tipo === tipo)
    .forEach((item) => {
      const categoria = item.categoria || "Outros";
      const valor = Number(item.valor || 0);

      if (!agrupado[categoria]) {
        agrupado[categoria] = 0;
      }

      agrupado[categoria] += valor;
    });

  return agrupado;
}

function destruirGraficoSeExistir(grafico) {
  if (grafico) {
    grafico.destroy();
  }
}

function renderizarGraficosFinanceiros() {
  renderizarGraficoDespesas();
  renderizarGraficoReceitas();
  renderizarGraficoEvolucaoSaldo();
}

function renderizarGraficoDespesas() {
  const canvas = document.getElementById("expensePieChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const dados = agruparPorCategoria(currentTransactions, "despesa");

  const labels = Object.keys(dados);
  const values = Object.values(dados);

  destruirGraficoSeExistir(expensePieChartInstance);

  expensePieChartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values
        }
      ]
    }
  });
}

function renderizarGraficoReceitas() {
  const canvas = document.getElementById("incomePieChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const dados = agruparPorCategoria(currentTransactions, "receita");

  const labels = Object.keys(dados);
  const values = Object.values(dados);

  destruirGraficoSeExistir(incomePieChartInstance);

  incomePieChartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values
        }
      ]
    }
  });
}

function renderizarGraficoEvolucaoSaldo() {
  const canvas = document.getElementById("balanceChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const transacoesOrdenadas = [...currentTransactions].sort((a, b) => {
    return new Date(a.data_lancamento) - new Date(b.data_lancamento);
  });

  const labels = [];
  const valores = [];

  let saldo = 0;

  transacoesOrdenadas.forEach((item) => {
    const dataFormatada = new Date(item.data_lancamento + "T00:00:00").toLocaleDateString("pt-BR");
    const valor = Number(item.valor || 0);

    if (item.tipo === "receita") {
      saldo += valor;
    } else {
      saldo -= valor;
    }

    labels.push(dataFormatada);
    valores.push(saldo);
  });

  destruirGraficoSeExistir(balanceChartInstance);

  balanceChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Saldo acumulado no mês",
          data: valores,
          tension: 0.3
        }
      ]
    }
  });
}

window.toggleCollapsibleSection = function toggleCollapsibleSection(sectionId) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  section.classList.toggle("collapsed");
};