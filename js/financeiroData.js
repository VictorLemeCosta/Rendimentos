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

/* ==================================================
   ASSISTENTE FINANCEIRO - IMPORTACAO DE EXTRATO CSV
   FinanceHub
================================================== */

let movimentacoesImportadasTemporarias = [];
let modoEdicaoImportacaoExtrato = false;

function processarCsv() {
    const inputExtrato = document.getElementById("extratoCsvInput");
    const nomeArquivoExtrato = document.getElementById("nomeArquivoExtrato");

    if (!inputExtrato) {
        console.error("Campo extratoCsvInput nao encontrado.");
        return;
    }

    if (!nomeArquivoExtrato) {
        console.error("Campo nomeArquivoExtrato nao encontrado.");
        return;
    }

    const arquivo = inputExtrato.files[0];

    if (!arquivo) {
        nomeArquivoExtrato.textContent = "Nenhum arquivo selecionado";
        return;
    }

    nomeArquivoExtrato.textContent = arquivo.name;

    const leitor = new FileReader();

    leitor.onload = async function(evento) {
        const conteudoCsv = evento.target.result;
        const movimentacoes = converterCsvParaMovimentacoes(conteudoCsv);

        await marcarAvisosDuplicidadeSalario(movimentacoes);

        movimentacoesImportadasTemporarias = movimentacoes;
        modoEdicaoImportacaoExtrato = false;

        abrirModalPreviewExtrato();
        exibirPreviewExtrato();
    };

    leitor.onerror = function() {
        alert("Nao foi possivel ler o arquivo CSV.");
    };

    leitor.readAsText(arquivo, "UTF-8");
}

/* ==================================================
   LEITURA E CONVERSAO DO CSV
================================================== */

function converterCsvParaMovimentacoes(conteudoCsv) {
  const linhas = conteudoCsv
    .split(/\r?\n/)
    .map(function(linha) {
      return linha.trim();
    })
    .filter(function(linha) {
      return linha !== "";
    });

  if (linhas.length <= 1) {
    return [];
  }

  const separador = identificarSeparadorCsv(linhas[0]);
  const cabecalho = dividirLinhaCsv(linhas[0], separador).map(normalizarTextoExtrato);

  const indices = identificarColunasExtrato(cabecalho);
  const movimentacoes = [];

  for (let i = 1; i < linhas.length; i++) {
    const colunas = dividirLinhaCsv(linhas[i], separador);

    const data = obterValorColuna(colunas, indices.data);
    const valorTexto = obterValorColuna(colunas, indices.valor);
    const descricao = montarDescricaoExtrato(colunas, indices);
    const tipoInformado = obterValorColuna(colunas, indices.tipo);

    if (!data && !descricao && !valorTexto) {
      continue;
    }

    const valorNumerico = converterValorExtratoParaNumero(valorTexto);

    if (!data || !descricao || valorNumerico === 0) {
      continue;
    }

    const tipo = identificarTipoMovimentacao(valorNumerico, tipoInformado);
    const categoria = sugerirCategoriaExtrato(descricao, tipo);

    movimentacoes.push({
      data: normalizarDataExtrato(data),
      descricao: limparDescricaoExtrato(descricao),
      valor: valorNumerico,
      tipo: tipo,
      categoria: categoria
    });
  }

  return movimentacoes;
}

function identificarColunasExtrato(cabecalho) {
  return {
    data: encontrarIndiceCabecalho(cabecalho, [
      "DATA",
      "DATA LANCAMENTO",
      "DATA MOVIMENTO",
      "DATA DA TRANSACAO",
      "DATE"
    ]),

    valor: encontrarIndiceCabecalho(cabecalho, [
      "VALOR",
      "VALOR R$",
      "AMOUNT",
      "VALUE",
      "QUANTIA",
      "MONTANTE"
    ]),

    descricao: encontrarIndiceCabecalho(cabecalho, [
      "DESCRICAO",
      "DESCRIÇÃO",
      "HISTORICO",
      "HISTÓRICO",
      "LANCAMENTO",
      "LANÇAMENTO",
      "DETALHES",
      "DESCRIPTON",
      "DESCRIPTION",
      "NOME"
    ]),

    tipo: encontrarIndiceCabecalho(cabecalho, [
      "TIPO",
      "TYPE",
      "CATEGORIA",
      "OPERACAO",
      "OPERAÇÃO"
    ]),

    identificador: encontrarIndiceCabecalho(cabecalho, [
      "IDENTIFICADOR",
      "ID",
      "CODIGO",
      "CÓDIGO",
      "REFERENCE",
      "REFERENCIA",
      "REFERÊNCIA"
    ])
  };
}

function encontrarIndiceCabecalho(cabecalho, nomesPossiveis) {
  for (let i = 0; i < cabecalho.length; i++) {
    for (let j = 0; j < nomesPossiveis.length; j++) {
      if (cabecalho[i] === normalizarTextoExtrato(nomesPossiveis[j])) {
        return i;
      }
    }
  }

  return -1;
}

function obterValorColuna(colunas, indice) {
  if (indice < 0 || indice >= colunas.length) {
    return "";
  }

  return String(colunas[indice] || "").trim();
}

function montarDescricaoExtrato(colunas, indices) {
  const descricaoPrincipal = obterValorColuna(colunas, indices.descricao);

  if (descricaoPrincipal) {
    return descricaoPrincipal;
  }

  const partesDescricao = [];

  for (let i = 0; i < colunas.length; i++) {
    if (
      i !== indices.data &&
      i !== indices.valor &&
      i !== indices.tipo &&
      i !== indices.identificador
    ) {
      const parte = String(colunas[i] || "").trim();

      if (parte) {
        partesDescricao.push(parte);
      }
    }
  }

  return partesDescricao.join(" ");
}

function identificarSeparadorCsv(linhaCabecalho) {
    if (linhaCabecalho.indexOf(";") >= 0) {
        return ";";
    }

    if (linhaCabecalho.indexOf(",") >= 0) {
        return ",";
    }

    return ";";
}

function dividirLinhaCsv(linha, separador) {
    const resultado = [];
    let valorAtual = "";
    let dentroDeAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const caractere = linha[i];

        if (caractere === '"') {
            dentroDeAspas = !dentroDeAspas;
            continue;
        }

        if (caractere === separador && !dentroDeAspas) {
            resultado.push(valorAtual);
            valorAtual = "";
            continue;
        }

        valorAtual += caractere;
    }

    resultado.push(valorAtual);
    return resultado;
}

function converterValorBrasileiroParaNumero(valorTexto) {
  return converterValorExtratoParaNumero(valorTexto);
}

function converterValorExtratoParaNumero(valorTexto) {
  if (!valorTexto) {
    return 0;
  }

  let valorLimpo = String(valorTexto)
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "")
    .trim();

  if (!valorLimpo) {
    return 0;
  }

  const temVirgula = valorLimpo.includes(",");
  const temPonto = valorLimpo.includes(".");

  if (temVirgula && temPonto) {
    const ultimoPonto = valorLimpo.lastIndexOf(".");
    const ultimaVirgula = valorLimpo.lastIndexOf(",");

    if (ultimaVirgula > ultimoPonto) {
      valorLimpo = valorLimpo.replace(/\./g, "").replace(",", ".");
    } else {
      valorLimpo = valorLimpo.replace(/,/g, "");
    }
  } else if (temVirgula) {
    valorLimpo = valorLimpo.replace(",", ".");
  }

  const numero = Number(valorLimpo);

  if (isNaN(numero)) {
    return 0;
  }

  return numero;
}

function identificarTipoMovimentacao(valor, tipoInformado) {
    if (tipoInformado) {
        const tipoNormalizado = normalizarTextoExtrato(tipoInformado);

        if (tipoNormalizado.includes("RECEITA") || tipoNormalizado.includes("CREDITO")) {
            return "Receita";
        }

        if (tipoNormalizado.includes("DESPESA") || tipoNormalizado.includes("DEBITO")) {
            return "Despesa";
        }
    }

    if (valor >= 0) {
        return "Receita";
    }

    return "Despesa";
}

/* ==================================================
   CATEGORIZACAO
================================================== */

function sugerirCategoriaExtrato(descricao, tipo) {
    const texto = normalizarTextoExtrato(descricao);

    const regrasCategoria = [
        {
            categoria: "Salário",
            palavras: [
                "SALARIO", "PAGAMENTO SALARIO", "PAGTO SALARIO", "CREDITO SALARIO",
                "CRED SALARIO", "FOLHA PAGAMENTO", "REMUNERACAO", "ORDENADO",
                "HUGHES", "HUGHES TELECOM", "HUGHES DO BRASIL"
            ]
        },
        {
            categoria: "PIX recebido",
            palavras: [
                "PIX RECEBIDO", "PIX REC", "RECEB PIX", "RECEBIMENTO PIX",
                "CREDITO PIX", "PIX CREDITO", "PIX ENTRADA", "ENTRADA PIX",
                "DEVOLUCAO PIX", "PIX DEVOLVIDO"
            ]
        },
        {
            categoria: "Reembolso",
            palavras: [
                "REEMBOLSO", "RESSARCIMENTO", "ESTORNO", "DEVOLUCAO",
                "RESTITUICAO", "CASHBACK", "CASH BACK"
            ]
        },
        {
            categoria: "Investimentos",
            palavras: [
                "BINANCE", "COINBASE", "MERCADO BITCOIN", "FOXBIT", "BITSO",
                "NOVA DAX", "RIPIO", "BIPA", "NUINVEST", "XP INVESTIMENTOS",
                "RICO", "CLEAR", "BTG", "BTG PACTUAL", "INTER DTVM",
                "TESOURO DIRETO", "TESOURO", "CDB", "LCI", "LCA",
                "FUNDO INVEST", "APLICACAO", "RESGATE", "RENDA FIXA",
                "RENDA VARIAVEL", "CORRETORA"
            ]
        },
        {
            categoria: "Transporte",
            palavras: [
                "UBER", "UBER TRIP", "99", "99POP", "99 PAY", "TAXI",
                "CABIFY", "BUSER", "BLABLACAR", "METRO", "CPTM",
                "BILHETE UNICO", "TOP TRANSPORTE", "SPTRANS", "ONIBUS",
                "ESTACIONAMENTO", "ZONA AZUL", "SEM PARAR", "CONECTCAR",
                "VELOE", "PEDAGIO"
            ]
        },
        {
            categoria: "Combustível",
            palavras: [
                "POSTO", "POSTO DE GASOLINA", "AUTO POSTO", "SHELL", "IPIRANGA",
                "PETROBRAS", "ALE", "RAIZEN", "GASOLINA", "ETANOL",
                "DIESEL", "COMBUSTIVEL", "ABASTECIMENTO", "KMV", "PREMMIA"
            ]
        },
        {
            categoria: "Alimentação",
            palavras: [
                "IFOOD", "AIQFOME", "RAPPI", "UBER EATS", "RESTAURANTE",
                "LANCHONETE", "PADARIA", "PIZZARIA", "HAMBURGUERIA", "BURGER",
                "MCDONALDS", "MC DONALDS", "BURGER KING", "SUBWAY", "BOBS",
                "KFC", "GIRAFFAS", "HABIBS", "OUTBACK", "MADERO",
                "STARBUCKS", "CAFETERIA", "CAFE", "LANCHES", "DELIVERY"
            ]
        },
        {
            categoria: "Mercado",
            palavras: [
                "MERCADO", "SUPERMERCADO", "HIPERMERCADO", "MINIMERCADO", "ATACADAO",
                "ASSAI", "CARREFOUR", "EXTRA", "PAO DE ACUCAR", "DIA", "BIG",
                "BOMPRECO", "NAGUMO", "SONDA", "ZAFFARI", "MUFFATO", "ANGELONI",
                "TENDA", "ROLDAO", "SAMS CLUB", "OXXO", "HORTIFRUTI", "ACOGUE",
                "SACOLAO", "FEIRA", "MERCEARIA"
            ]
        },
        {
            categoria: "Farmácia",
            palavras: [
                "FARMACIA", "DROGARIA", "DROGA", "DROGASIL", "DROGA RAIA",
                "RAIA", "DROGARIA SAO PAULO", "PACHECO", "PAGUE MENOS",
                "PANVEL", "ULTRAFARMA", "ONOFRE", "MEDICAMENTO", "REMEDIO",
                "MANIPULACAO"
            ]
        },
        {
            categoria: "Assinaturas",
            palavras: [
                "NETFLIX", "SPOTIFY", "AMAZON PRIME", "PRIME VIDEO", "DISNEY",
                "DISNEY PLUS", "DISNEY+", "STAR PLUS", "STAR+", "HBO", "MAX",
                "GLOBOPLAY", "PARAMOUNT", "APPLE", "APPLE MUSIC", "ICLOUD",
                "GOOGLE ONE", "YOUTUBE PREMIUM", "MICROSOFT 365", "OFFICE 365",
                "XBOX", "GAME PASS", "PLAYSTATION", "ADOBE", "CANVA", "CHATGPT",
                "OPENAI", "ASSINATURA", "SUBSCRIPTION"
            ]
        },
        {
            categoria: "Cartão de crédito",
            palavras: [
                "FATURA", "CARTAO", "PAGAMENTO FATURA", "PAGTO FATURA",
                "FATURA CARTAO", "MASTERCARD", "VISA", "ELO", "AMEX", 
                "ITAUCARD", "BRADESCO CARTOES",
                "SANTANDER CARTOES", "C6 BANK CARTAO", "INTER CARTAO"
            ]
        },
        {
            categoria: "Contas e moradia",
            palavras: [
                "ALUGUEL", "CONDOMINIO", "IPTU", "SABESP", "ENEL", "CPFL",
                "LIGHT", "CEMIG", "COPEL", "ENERGIA", "LUZ", "AGUA", "GAS",
                "COMGAS", "ULTRAGAZ", "SUPERGASBRAS"
            ]
        },
        {
            categoria: "Internet e telefone",
            palavras: [
                "VIVO", "CLARO", "TIM", "OI", "NET", "SKY", "ALGAR", "INTERNET",
                "BANDA LARGA", "TELEFONE", "CELULAR", "FIBRA", "TV ASSINATURA",
                "TELECOM"
            ]
        },
        {
            categoria: "Saúde",
            palavras: [
                "HOSPITAL", "CLINICA", "LABORATORIO", "EXAME", "CONSULTA", "MEDICO",
                "DENTISTA", "ODONTO", "PSICOLOGO", "PSIQUIATRA", "FISIOTERAPIA",
                "PLANO DE SAUDE", "UNIMED", "AMIL", "SULAMERICA", "BRADESCO SAUDE",
                "HAPVIDA"
            ]
        },
        {
            categoria: "Educação",
            palavras: [
                "ESCOLA", "FACULDADE", "UNIVERSIDADE", "CURSO", "MENSALIDADE",
                "EDUCACAO", "ENSINO", "ALURA", "UDEMY", "COURSERA", "HOTMART",
                "KIWIFY", "EDUZZ", "LIVRARIA", "LIVRO", "MATERIAL ESCOLAR"
            ]
        },
        {
            categoria: "Lazer",
            palavras: [
                "CINEMA", "INGRESSO", "TEATRO", "SHOW", "EVENTO", "EVENTIM",
                "TICKETMASTER", "SYMPLA", "BAR", "ACADEMIA", "SMART FIT", "BLUEFIT",
                "HOTEL", "POUSADA", "AIRBNB", "BOOKING"
            ]
        },
        {
            categoria: "Compras",
            palavras: [
                "AMAZON", "MERCADO LIVRE", "MERCADOLIVRE", "SHOPEE", "SHEIN",
                "ALIEXPRESS", "MAGAZINE LUIZA", "MAGALU", "AMERICANAS", "SUBMARINO",
                "CASAS BAHIA", "PONTO FRIO", "KABUM", "FAST SHOP", "SHOPTIME",
                "CENTAURO", "DECATHLON", "RENNER", "RIACHUELO", "CEA", "C&A",
                "ZARA", "NETSHOES", "DAFITI", "COMPRA ONLINE"
            ]
        },
        {
            categoria: "Transferâncias",
            palavras: [
                "PIX ENVIADO", "PIX TRANSFERENCIA", "TRANSFERENCIA", "TED", "DOC",
                "TEF", "TRANSF", "ENVIO PIX", "PAGAMENTO PIX", "DEBITO PIX",
                "PIX DEBITO", "TRANSFERIDO PARA", "TRANSFERENCIA PARA"
            ]
        },
        {
            categoria: "Tarifas bancárias",
            palavras: [
                "TARIFA", "TARIFA BANCARIA", "CESTA", "CESTA SERVICOS", "ANUIDADE",
                "JUROS", "MULTA", "IOF", "ENCARGO", "SAQUE", "TARIFA SAQUE",
                "MANUTENCAO CONTA", "PACOTE SERVICOS"
            ]
        }
    ];

    for (let i = 0; i < regrasCategoria.length; i++) {
        const regra = regrasCategoria[i];

        for (let j = 0; j < regra.palavras.length; j++) {
            const palavraNormalizada = normalizarTextoExtrato(regra.palavras[j]);

            if (texto.includes(palavraNormalizada)) {
                return regra.categoria;
            }
        }
    }

    if (tipo === "Receita") {
        return "Outros";
    }

    return "Outros";
}

function normalizarTextoExtrato(texto) {
    if (!texto) {
        return "";
    }

    return texto
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();
}

function limparDescricaoExtrato(texto) {
  if (!texto) {
    return "";
  }

  return String(texto)
    .replace(/\s+/g, " ")
    .trim();
}

/* ==================================================
   MODAL DE PREVIA
================================================== */

function abrirModalPreviewExtrato() {
    const modal = document.getElementById("modalPreviewExtrato");

    if (!modal) {
        console.error("Modal modalPreviewExtrato nao encontrado.");
        return;
    }

    modal.classList.remove("hidden");
}

function fecharModalPreviewExtrato() {
    const modal = document.getElementById("modalPreviewExtrato");

    if (!modal) {
        console.error("Modal modalPreviewExtrato nao encontrado.");
        return;
    }

    modal.classList.add("hidden");
}

/* ==================================================
   EXIBICAO DA TABELA
================================================== */

function exibirPreviewExtrato() {
  const tbody = document.getElementById("previewExtratoTableBody");
  const cardsContainer = document.getElementById("previewExtratoCards");

  if (!tbody) {
    console.error("Tabela previewExtratoTableBody nao encontrada.");
    return;
  }

  tbody.innerHTML = "";

  if (cardsContainer) {
    cardsContainer.innerHTML = "";
  }

  if (!movimentacoesImportadasTemporarias || movimentacoesImportadasTemporarias.length === 0) {
    const trVazio = document.createElement("tr");
    const tdVazio = document.createElement("td");

    tdVazio.colSpan = 6;
    tdVazio.textContent = "Nenhuma movimentacao encontrada no arquivo.";

    trVazio.appendChild(tdVazio);
    tbody.appendChild(trVazio);

    if (cardsContainer) {
      cardsContainer.textContent = "Nenhuma movimentação encontrada no arquivo.";
    }

    return;
  }

  

  const fragmentoTabela = document.createDocumentFragment();
  const fragmentoCards = document.createDocumentFragment();

  for (let i = 0; i < movimentacoesImportadasTemporarias.length; i++) {
    const movimentacao = movimentacoesImportadasTemporarias[i];

    const tr = document.createElement("tr");

    if (movimentacao.salarioDuplicado) {
      tr.classList.add("linha-alerta-importacao-forte");
    }

    if (modoEdicaoImportacaoExtrato) {
      montarLinhaEditavelExtrato(tr, movimentacao, i);
    } else {
      montarLinhaVisualizacaoExtrato(tr, movimentacao, i);
    }

    fragmentoTabela.appendChild(tr);

    if (movimentacao.salarioDuplicado) {
      fragmentoTabela.appendChild(criarLinhaAvisoSalarioDuplicado(movimentacao));
    }

    if (cardsContainer) {
      fragmentoCards.appendChild(criarCardPreviewExtrato(movimentacao, i));
    }
  }

  tbody.appendChild(fragmentoTabela);

  if (cardsContainer) {
    cardsContainer.appendChild(fragmentoCards);
  }
}

function criarCardPreviewExtrato(movimentacao, index) {
  const card = document.createElement("div");
  card.className = "preview-extrato-card";

  if (movimentacao.salarioDuplicado) {
    card.classList.add("preview-extrato-card-alerta");
  }

  const topo = document.createElement("div");
  topo.className = "preview-extrato-card-topo";

  const data = document.createElement("span");
  data.textContent = movimentacao.data;

  const valor = document.createElement("strong");
  valor.textContent = formatarValorPreviewExtrato(movimentacao.valor);
  valor.className = movimentacao.valor >= 0 ? "valor-receita" : "valor-despesa";

  topo.appendChild(data);
  topo.appendChild(valor);

  const descricao = document.createElement("div");
  descricao.className = "preview-extrato-card-descricao";
  descricao.textContent =
      resumirDescricaoExtrato(movimentacao.descricao);

  const meta = document.createElement("div");
  meta.className = "preview-extrato-card-meta";
  meta.textContent = `${movimentacao.tipo} • ${movimentacao.categoria}`;

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "btn-excluir-preview";
  botaoExcluir.textContent = "Excluir";

  botaoExcluir.addEventListener("click", function() {
    excluirMovimentacaoImportada(index);
  });

  card.appendChild(topo);
  card.appendChild(descricao);
  card.appendChild(meta);
  card.appendChild(botaoExcluir);

  if (movimentacao.salarioDuplicado && movimentacao.avisoImportacao) {
    const aviso = document.createElement("div");
    aviso.className = "aviso-importacao-salario-full";
    aviso.textContent = movimentacao.avisoImportacao;
    card.appendChild(aviso);
  }

  return card;
}

function resumirDescricaoExtrato(texto) {

    if (!texto) {
        return "";
    }

    if (texto.length <= 80) {
        return texto;
    }

    return texto.substring(0, 80) + "...";
}

function montarLinhaVisualizacaoExtrato(tr, movimentacao, index) {
  const tdData = document.createElement("td");
  const tdDescricao = document.createElement("td");
  const tdValor = document.createElement("td");
  const tdTipo = document.createElement("td");
  const tdCategoria = document.createElement("td");
  const tdAcao = document.createElement("td");

  tdData.textContent = movimentacao.data;
  tdDescricao.textContent = movimentacao.descricao;
  tdValor.textContent = formatarValorPreviewExtrato(movimentacao.valor);
  tdTipo.textContent = movimentacao.tipo;
  tdCategoria.textContent = movimentacao.categoria;

  if (movimentacao.valor >= 0) {
    tdValor.classList.add("valor-receita");
  } else {
    tdValor.classList.add("valor-despesa");
  }

  tdCategoria.classList.add("categoria-sugerida");

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "btn-excluir-preview";
  botaoExcluir.textContent = "Excluir";

  botaoExcluir.addEventListener("click", function () {
    excluirMovimentacaoImportada(index);
  });

  tdAcao.appendChild(botaoExcluir);

  tr.appendChild(tdData);
  tr.appendChild(tdDescricao);
  tr.appendChild(tdValor);
  tr.appendChild(tdTipo);
  tr.appendChild(tdCategoria);
  tr.appendChild(tdAcao);
}

function montarLinhaEditavelExtrato(tr, movimentacao, index) {
  const tdData = document.createElement("td");
  const tdDescricao = document.createElement("td");
  const tdValor = document.createElement("td");
  const tdTipo = document.createElement("td");
  const tdCategoria = document.createElement("td");

  const inputData = criarInputEdicaoExtrato(movimentacao.data);
  inputData.addEventListener("change", function () {
    atualizarCampoMovimentacaoImportada(index, "data", inputData.value);
  });

  const inputDescricao = criarInputEdicaoExtrato(movimentacao.descricao);
  inputDescricao.addEventListener("change", function () {
    atualizarCampoMovimentacaoImportada(index, "descricao", inputDescricao.value);
  });

  const inputValor = criarInputEdicaoExtrato(formatarNumeroParaInputExtrato(movimentacao.valor));
  inputValor.addEventListener("change", function () {
    atualizarCampoMovimentacaoImportada(index, "valor", inputValor.value);
  });

  const selectTipo = document.createElement("select");
  selectTipo.className = "preview-edit-select";

  adicionarOpcaoSelect(selectTipo, "Receita", "Receita");
  adicionarOpcaoSelect(selectTipo, "Despesa", "Despesa");

  selectTipo.value = movimentacao.tipo || "Despesa";

  selectTipo.addEventListener("change", function () {
    atualizarCampoMovimentacaoImportada(index, "tipo", selectTipo.value);
  });

  const selectCategoria = document.createElement("select");
  selectCategoria.className = "preview-edit-select";

  const categorias = obterCategoriasExtrato();

  for (let i = 0; i < categorias.length; i++) {
    adicionarOpcaoSelect(selectCategoria, categorias[i], categorias[i]);
  }

  selectCategoria.value = movimentacao.categoria || "Outros";

  selectCategoria.addEventListener("change", function () {
    atualizarCampoMovimentacaoImportada(index, "categoria", selectCategoria.value);
  });

  tdData.appendChild(inputData);
  tdDescricao.appendChild(inputDescricao);
  tdValor.appendChild(inputValor);
  tdTipo.appendChild(selectTipo);
  tdCategoria.appendChild(selectCategoria);


const tdAcao = document.createElement("td");

const botaoExcluir = document.createElement("button");
botaoExcluir.type = "button";
botaoExcluir.className = "btn-excluir-preview";
botaoExcluir.textContent = "Excluir";

botaoExcluir.addEventListener("click", function () {
  sincronizarEdicoesVisiveis();
  excluirMovimentacaoImportada(index);
});

tdAcao.appendChild(botaoExcluir);

tr.appendChild(tdData);
tr.appendChild(tdDescricao);
tr.appendChild(tdValor);
tr.appendChild(tdTipo);
tr.appendChild(tdCategoria);
tr.appendChild(tdAcao);
}

function criarInputEdicaoExtrato(valor) {
  const input = document.createElement("input");

  input.type = "text";
  input.className = "preview-edit-input";
  input.value = valor || "";

  return input;
}

function adicionarOpcaoSelect(select, valor, texto) {
  const option = document.createElement("option");

  option.value = valor;
  option.textContent = texto;

  select.appendChild(option);
}

function formatarNumeroParaInputExtrato(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function obterCategoriasExtrato() {
  return [
    "Salário",
    "VR",
    "VA",
    "VT",
    "Assinaturas",
    "Aluguel",
    "Água",
    "Luz",
    "Internet",
    "Mercado",
    "Farmácia",
    "Combustível",
    "Transporte",
    "Cartão de crédito",
    "Saúde",
    "Lazer",
    "Educação",
    "Filha",
    "Investimentos",
    "Reembolso",
    "PIX recebido",
    "Transferências",
    "Tarifas bancárias",
    "Compras",
    "Contas e moradia",
    "Internet e telefone",
    "Outros"
  ];
}

function adicionarOpcaoSelect(select, valor, texto) {
    const option = document.createElement("option");

    option.value = valor;
    option.textContent = texto;

    select.appendChild(option);
}

/* ==================================================
   EDICAO DOS DADOS IMPORTADOS
================================================== */

function atualizarCampoMovimentacaoImportada(index, campo, valor) {
  if (!movimentacoesImportadasTemporarias[index]) {
    return;
  }

  if (campo === "valor") {
    const valorNumerico = converterValorBrasileiroParaNumero(valor);

    movimentacoesImportadasTemporarias[index].valor = valorNumerico;
    movimentacoesImportadasTemporarias[index].tipo = identificarTipoMovimentacao(
      valorNumerico,
      movimentacoesImportadasTemporarias[index].tipo
    );

    return;
  }

  movimentacoesImportadasTemporarias[index][campo] = valor;
}

function alternarEdicaoExtrato() {
  if (!movimentacoesImportadasTemporarias || movimentacoesImportadasTemporarias.length === 0) {
    alert("Nenhuma movimentacao disponivel para editar.");
    return;
  }

  if (modoEdicaoImportacaoExtrato) {
    sincronizarEdicoesVisiveis();
    modoEdicaoImportacaoExtrato = false;
    atualizarTextoBotaoEdicaoExtrato();
    exibirPreviewExtrato();
    return;
  }

  modoEdicaoImportacaoExtrato = true;
  atualizarTextoBotaoEdicaoExtrato();
  exibirPreviewExtrato();
}

function sincronizarEdicoesVisiveis() {
  const linhas = document.querySelectorAll("#previewExtratoTableBody tr");

  linhas.forEach(function(linha, index) {
    const campos = linha.querySelectorAll("input, select");

    if (!movimentacoesImportadasTemporarias[index]) {
      return;
    }

    if (campos[0]) {
      movimentacoesImportadasTemporarias[index].data = campos[0].value;
    }

    if (campos[1]) {
      movimentacoesImportadasTemporarias[index].descricao = campos[1].value;
    }

    if (campos[2]) {
      movimentacoesImportadasTemporarias[index].valor =
        converterValorBrasileiroParaNumero(campos[2].value);
    }

    if (campos[3]) {
      movimentacoesImportadasTemporarias[index].tipo = campos[3].value;
    }

    if (campos[4]) {
      movimentacoesImportadasTemporarias[index].categoria = campos[4].value;
    }
  });
}

function atualizarTextoBotaoEdicaoExtrato() {
  const botao = document.getElementById("botaoEditarExtrato");

  if (!botao) {
    return;
  }

  if (modoEdicaoImportacaoExtrato) {
    botao.textContent = "Concluir edição";
  } else {
    botao.textContent = "Editar dados";
  }
}

function recusarImportacaoExtrato() {
    movimentacoesImportadasTemporarias = [];
    modoEdicaoImportacaoExtrato = false;
    atualizarTextoBotaoEdicaoExtrato();

    const inputExtrato = document.getElementById("extratoCsvInput");
    const nomeArquivoExtrato = document.getElementById("nomeArquivoExtrato");

    if (inputExtrato) {
        inputExtrato.value = "";
    }

    if (nomeArquivoExtrato) {
        nomeArquivoExtrato.textContent = "Nenhum arquivo selecionado";
    }

    fecharModalPreviewExtrato();
}

async function confirmarImportacaoExtrato() {
  if (!movimentacoesImportadasTemporarias || movimentacoesImportadasTemporarias.length === 0) {
    alert("Nenhuma movimentação disponível para importar.");
    return;
  }

  const user = await garantirUsuarioFinanceiro();

  if (!user) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  if (modoEdicaoImportacaoExtrato) {
    sincronizarEdicoesVisiveis();
  }

  const salariosDuplicados = movimentacoesImportadasTemporarias.filter(function(movimentacao) {
  return movimentacao.salarioDuplicado === true;
});

if (salariosDuplicados.length > 0) {
  const meses = salariosDuplicados
    .map(function(item) {
      return obterAnoMesDaDataExtrato(item.data);
    })
    .filter(function(item, index, array) {
      return item && array.indexOf(item) === index;
    })
    .join(", ");

  const confirmarSalarioDuplicado = confirm(
    "O salario do mes " +
    meses +
    " ja foi registrado automaticamente. Deseja importar esse valor mesmo assim?"
  );

  if (!confirmarSalarioDuplicado) {
    return;
  }
}

  const lancamentosParaInserir = movimentacoesImportadasTemporarias
    .filter(function(movimentacao) {
      return movimentacao.data && movimentacao.descricao && Number(movimentacao.valor) !== 0;
    })
    .map(function(movimentacao) {
      const tipoNormalizado = movimentacao.tipo === "Receita" ? "receita" : "despesa";

      return {
        user_id: user.id,
        tipo: tipoNormalizado,
        categoria: movimentacao.categoria || "Outros",
        descricao: movimentacao.descricao || movimentacao.categoria || "Lançamento importado",
        valor: Math.abs(Number(movimentacao.valor || 0)),
        data_lancamento: converterDataExtratoParaISO(movimentacao.data),
        recorrente: false,
        origem: "importado"
      };
    });

  if (!lancamentosParaInserir.length) {
    alert("Nenhum lançamento válido encontrado para importar.");
    return;
  }

  const { error } = await window.supabaseClient
    .from("financial_transactions")
    .insert(lancamentosParaInserir);

  if (error) {
    console.error("Erro ao importar extrato:", error);
    alert("Erro ao importar extrato: " + error.message);
    return;
  }

  movimentacoesImportadasTemporarias = [];
  modoEdicaoImportacaoExtrato = false;
  atualizarTextoBotaoEdicaoExtrato();

  const inputExtrato = document.getElementById("extratoCsvInput");
  const nomeArquivoExtrato = document.getElementById("nomeArquivoExtrato");

  if (inputExtrato) {
    inputExtrato.value = "";
  }

  if (nomeArquivoExtrato) {
    nomeArquivoExtrato.textContent = "Nenhum arquivo selecionado";
  }

  fecharModalPreviewExtrato();

  await carregarDashboardFinanceiroReal();

  alert(lancamentosParaInserir.length + " lançamentos importados com sucesso.");
}
/* ==================================================
   FUNCOES AUXILIARES
================================================== */

function converterDataExtratoParaISO(dataTexto) {
  if (!dataTexto) {
    return new Date().toISOString().slice(0, 10);
  }

  const dataLimpa = String(dataTexto).trim();

  if (dataLimpa.includes("/")) {
    const partes = dataLimpa.split("/");

    const dia = partes[0];
    const mes = partes[1];
    const ano = partes[2];

    if (dia && mes && ano) {
      return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    }
  }

  if (dataLimpa.includes("-")) {
    return dataLimpa.slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function formatarValorPreviewExtrato(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


async function marcarAvisosDuplicidadeSalario(movimentacoes) {
  const user = await garantirUsuarioFinanceiro();

  if (!user) {
    return;
  }

  const mesesVerificados = {};

  for (let i = 0; i < movimentacoes.length; i++) {
    const movimentacao = movimentacoes[i];

    const categoriaNormalizada = normalizarTextoExtrato(movimentacao.categoria);
    const tipoNormalizado = normalizarTextoExtrato(movimentacao.tipo);

    const ehSalario =
      categoriaNormalizada === "SALARIO" &&
      tipoNormalizado === "RECEITA";

    if (!ehSalario) {
      continue;
    }

    const anoMes = obterAnoMesDaDataExtrato(movimentacao.data);

    if (!anoMes) {
      continue;
    }

    if (mesesVerificados[anoMes] === undefined) {
      mesesVerificados[anoMes] = await existeSalarioAutomaticoNoMes(user.id, anoMes);
    }

    if (mesesVerificados[anoMes]) {
      movimentacao.salarioDuplicado = true;
      movimentacao.avisoImportacao =
        "Salário do mês " +
        anoMes +
        " ja foi registrado automaticamente. Confirme se deseja importar este valor novamente.";
    }
  }
}

async function existeSalarioAutomaticoNoMes(userId, anoMes) {
  const inicioMes = anoMes + "-01";
  const fimMes = obterUltimoDiaDoAnoMes(anoMes);

  const { data, error } = await window.supabaseClient
    .from("financial_transactions")
    .select("id, categoria, origem, referencia_auto, data_lancamento")
    .eq("user_id", userId)
    .eq("tipo", "receita")
    .eq("categoria", "Salário")
    .gte("data_lancamento", inicioMes)
    .lte("data_lancamento", fimMes);

  if (error) {
    console.error("Erro ao verificar salario automatico:", error);
    return false;
  }

  if (!data || !data.length) {
    return false;
  }

  return data.some(function(item) {
    const referencia = item.referencia_auto || "";

    return (
      item.origem === "automatico" ||
      referencia.includes("salario")
    );
  });
}


function obterAnoMesDaDataExtrato(dataTexto) {
  if (!dataTexto) {
    return "";
  }

  const dataLimpa = String(dataTexto).trim();

  if (dataLimpa.includes("/")) {
    const partes = dataLimpa.split("/");

    const mes = partes[1];
    const ano = partes[2];

    if (mes && ano) {
      return ano + "-" + String(mes).padStart(2, "0");
    }
  }

  if (dataLimpa.includes("-")) {
    return dataLimpa.slice(0, 7);
  }

  return "";
}

function obterUltimoDiaDoAnoMes(anoMes) {
  const partes = anoMes.split("-");
  const ano = Number(partes[0]);
  const mes = Number(partes[1]);

  const ultimoDia = new Date(ano, mes, 0).getDate();

  return (
    ano +
    "-" +
    String(mes).padStart(2, "0") +
    "-" +
    String(ultimoDia).padStart(2, "0")
  );
}


function criarLinhaAvisoSalarioDuplicado(movimentacao) {
  const trAviso = document.createElement("tr");
  trAviso.className = "linha-aviso-salario-duplicado";

  const tdAviso = document.createElement("td");
  tdAviso.colSpan = 6;

  const aviso = document.createElement("div");
  aviso.className = "aviso-importacao-salario-full";

  aviso.textContent =
    movimentacao.avisoImportacao ||
    "ATENCAO: O salario deste mes ja foi registrado automaticamente. Confirme se deseja importar este valor novamente.";

  tdAviso.appendChild(aviso);
  trAviso.appendChild(tdAviso);

  return trAviso;
}

function excluirMovimentacaoImportada(index) {
  if (!movimentacoesImportadasTemporarias[index]) {
    return;
  }

  const confirmarExclusao = confirm("Deseja remover este item da importacao?");

  if (!confirmarExclusao) {
    return;
  }

  movimentacoesImportadasTemporarias.splice(index, 1);

  if (movimentacoesImportadasTemporarias.length === 0) {
    modoEdicaoImportacaoExtrato = false;
    atualizarTextoBotaoEdicaoExtrato();
  }

  exibirPreviewExtrato();
}

window.abrirSeletorExtrato = function abrirSeletorExtrato() {
  const inputExtrato = document.getElementById("extratoCsvInput");

  if (!inputExtrato) {
    console.error("Campo extratoCsvInput nao encontrado.");
    return;
  }

  inputExtrato.click();
};

function normalizarDataExtrato(dataTexto) {
  if (!dataTexto) {
    return "";
  }

  const dataLimpa = String(dataTexto).trim();

  if (dataLimpa.includes("/")) {
    const partes = dataLimpa.split("/");

    if (partes.length === 3) {
      const dia = partes[0].padStart(2, "0");
      const mes = partes[1].padStart(2, "0");
      const ano = partes[2];

      return `${dia}/${mes}/${ano}`;
    }
  }

  if (dataLimpa.includes("-")) {
    const partes = dataLimpa.split("-");

    if (partes[0].length === 4) {
      return `${partes[2].padStart(2, "0")}/${partes[1].padStart(2, "0")}/${partes[0]}`;
    }

    if (partes.length === 3) {
      return `${partes[0].padStart(2, "0")}/${partes[1].padStart(2, "0")}/${partes[2]}`;
    }
  }

  return dataLimpa;
}
