function preencherEditorFinanceiro(dados) {
  const financeiro = dados.financialProfile || {};

  const salarioInput = document.getElementById("editSalarioBruto");
  const vrInput = document.getElementById("editValorVr");
  const vaInput = document.getElementById("editValorVa");

  const bancoSalarioSelect = document.getElementById("editBancoSalario");
  const fornecedorVrSelect = document.getElementById("editFornecedorVr");
  const fornecedorVaSelect = document.getElementById("editFornecedorVa");

  const valeTransporteSelect = document.getElementById("editValeTransportePercentual");
  const horaInicioInput = document.getElementById("editHoraInicio");
  const horaFimInput = document.getElementById("editHoraFim");

  if (salarioInput) {
    salarioInput.value = financeiro.salario_bruto || 0;
  }

  if (vrInput) {
    vrInput.value = financeiro.valor_vr || 0;
  }

  if (vaInput) {
    vaInput.value = financeiro.valor_va || 0;
  }

  if (bancoSalarioSelect) {
    bancoSalarioSelect.value = financeiro.banco_salario || "outro";
  }

  if (fornecedorVrSelect) {
    fornecedorVrSelect.value = financeiro.fornecedor_vr || "outro";
  }

  if (fornecedorVaSelect) {
    fornecedorVaSelect.value = financeiro.fornecedor_va || "outro";
  }

  if (valeTransporteSelect) {
    valeTransporteSelect.value = financeiro.vale_transporte_percentual || 0;
  }

  if (horaInicioInput) {
    horaInicioInput.value = financeiro.hora_inicio || "09:00";
  }

  if (horaFimInput) {
    horaFimInput.value = financeiro.hora_fim || "18:00";
  }
}

function getNumberFromInput(id) {
  const element = document.getElementById(id);

  if (!element || element.value === "") {
    return 0;
  }

  return Number(element.value);
}

async function salvarDadosFinanceirosIndex() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const salarioBruto = getNumberFromInput("editSalarioBruto");

  if (salarioBruto <= 0) {
    alert("O salário bruto é obrigatório.");
    return;
  }

  const valorVr = getNumberFromInput("editValorVr");
  const valorVa = getNumberFromInput("editValorVa");

  const payload = {
    salario_bruto: salarioBruto,
    salario_liquido: calcularSalarioLiquidoEstimadoIndex(),

    valor_vr: valorVr,
    valor_va: valorVa,
    valor_vr_va: valorVr + valorVa,

    banco_salario: document.getElementById("editBancoSalario")?.value || "outro",
    fornecedor_vr: document.getElementById("editFornecedorVr")?.value || "outro",
    fornecedor_va: document.getElementById("editFornecedorVa")?.value || "outro",

    vale_transporte_percentual: getNumberFromInput("editValeTransportePercentual"),

    hora_inicio: document.getElementById("editHoraInicio")?.value || "09:00",
    hora_fim: document.getElementById("editHoraFim")?.value || "18:00",

    atualizado_em: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from("financial_profile")
    .update(payload)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar financial_profile:", error);
    alert("Erro ao salvar alterações: " + error.message);
    return;
  }

  alert("Dados atualizados com sucesso!");

  await carregarDadosUsuario();
}

function calcularSalarioLiquidoEstimadoIndex() {
  const salarioBruto = getNumberFromInput("editSalarioBruto");
  const vtPercentual = getNumberFromInput("editValeTransportePercentual") / 100;

  if (salarioBruto <= 0) {
    return 0;
  }

  let inss = 0;

  if (typeof calculateINSS === "function") {
    inss = calculateINSS(salarioBruto);
  }

  let irrf = 0;

  if (typeof calculateIRRF === "function") {
    irrf = calculateIRRF(salarioBruto - inss);
  }

  const vt = salarioBruto * vtPercentual;

  return salarioBruto - inss - irrf - vt;
}

window.addEventListener("financeHubDataLoaded", function (event) {
  preencherEditorFinanceiro(event.detail);
});