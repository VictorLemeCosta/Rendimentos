function preencherEditorFinanceiro(dados) {
  const financeiro = dados.financialProfile || {};

  const salarioInput = document.getElementById("editSalarioBruto");
  const vrInput = document.getElementById("editValorVr");
  const vaInput = document.getElementById("editValorVa");

  if (salarioInput) {
    salarioInput.value = financeiro.salario_bruto || 0;
  }

  if (vrInput) {
    vrInput.value = financeiro.valor_vr || "";
  }

  if (vaInput) {
    vaInput.value = financeiro.valor_va || "";
  }

  setValueIfExists("editBancoSalario", financeiro.banco_salario || "outro");
  setValueIfExists("editFornecedorVr", financeiro.fornecedor_vr || "outro");
  setValueIfExists("editFornecedorVa", financeiro.fornecedor_va || "outro");
  setValueIfExists("editValeTransportePercentual", financeiro.vale_transporte_percentual || 0);
  setValueIfExists("editHoraInicio", financeiro.hora_inicio || "09:00");
  setValueIfExists("editHoraFim", financeiro.hora_fim || "18:00");

  if (Number(financeiro.valor_vr || 0) > 0) {
    mostrarCampoVr();
  }

  if (Number(financeiro.valor_va || 0) > 0) {
    mostrarCampoVa();
  }

  renderizarBeneficiosExtras(dados.benefits || []);
}

function setValueIfExists(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function getNumberFromInput(id) {
  const element = document.getElementById(id);

  if (!element || element.value === "") {
    return 0;
  }

  return Number(element.value);
}

function mostrarCampoVr() {
  document.getElementById("vrEditorBlock")?.classList.remove("hidden");
  document.getElementById("btnAdicionarVr")?.classList.add("hidden");
}

function mostrarCampoVa() {
  document.getElementById("vaEditorBlock")?.classList.remove("hidden");
  document.getElementById("btnAdicionarVa")?.classList.add("hidden");
}

function adicionarBeneficioIndex(nome = "", valor = "") {
  const container = document.getElementById("outrosBeneficiosEditor");

  if (!container) {
    return;
  }

  const row = document.createElement("div");
  row.className = "dynamic-row beneficio-editor-row";

  row.innerHTML = `
    <input type="text" class="beneficio-editor-nome" placeholder="Nome do benefício" value="${nome}">
    <input type="number" class="beneficio-editor-valor" placeholder="Valor" step="0.01" value="${valor}">
    <button type="button" class="remove-button" onclick="this.parentElement.remove()">Remover</button>
  `;

  container.appendChild(row);
}

function renderizarBeneficiosExtras(beneficios) {
  const container = document.getElementById("outrosBeneficiosEditor");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  beneficios.forEach((beneficio) => {
    const nome = beneficio.nome || "";
    const valor = Number(beneficio.valor || 0);

    if (nome === "VR" || nome === "VA") {
      return;
    }

    adicionarBeneficioIndex(nome, valor);
  });
}

function coletarBeneficiosExtrasIndex() {
  const nomes = document.querySelectorAll(".beneficio-editor-nome");
  const valores = document.querySelectorAll(".beneficio-editor-valor");

  const beneficios = [];

  nomes.forEach((nomeInput, index) => {
    const nome = nomeInput.value.trim();
    const valor = valores[index].value ? Number(valores[index].value) : 0;

    if (nome && valor > 0) {
      beneficios.push({
        nome,
        valor
      });
    }
  });

  return beneficios;
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
    user_id: user.id,

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
    .upsert(payload, {
      onConflict: "user_id"
    });

  if (error) {
    console.error("Erro ao atualizar financial_profile:", error);
    alert("Erro ao salvar alterações: " + error.message);
    return;
  }

  await salvarBeneficiosExtrasIndex(user.id);

  alert("Dados atualizados com sucesso!");

  await carregarDadosUsuario();
}

async function salvarBeneficiosExtrasIndex(userId) {
  const beneficiosExtras = coletarBeneficiosExtrasIndex();

  const { error: deleteError } = await window.supabaseClient
    .from("user_benefits")
    .delete()
    .eq("user_id", userId)
    .neq("nome", "VR")
    .neq("nome", "VA");

  if (deleteError) {
    console.error("Erro ao remover benefícios antigos:", deleteError);
    alert("Erro ao atualizar benefícios: " + deleteError.message);
    return;
  }

  if (beneficiosExtras.length === 0) {
    return;
  }

  const payload = beneficiosExtras.map((beneficio) => ({
    user_id: userId,
    nome: beneficio.nome,
    valor: beneficio.valor
  }));

  const { error: insertError } = await window.supabaseClient
    .from("user_benefits")
    .insert(payload);

  if (insertError) {
    console.error("Erro ao inserir benefícios:", insertError);
    alert("Erro ao salvar benefícios: " + insertError.message);
  }
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