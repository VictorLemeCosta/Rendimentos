window.abrirEditorFinanceiro = function abrirEditorFinanceiro(campoFoco = null) {
  const editor = document.getElementById("financialEditorSection");

  if (!editor) {
    return;
  }

  editor.classList.remove("hidden");

  setTimeout(() => {
    editor.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    if (campoFoco) {
      const campo = document.getElementById(campoFoco);

      if (campo) {
        campo.focus();
      }
    }
  }, 100);
};

window.fecharEditorFinanceiro = function fecharEditorFinanceiro() {
  const editor = document.getElementById("financialEditorSection");

  if (!editor) {
    return;
  }

  editor.classList.add("hidden");
};

window.mostrarCampoVr = function mostrarCampoVr() {
  const blocoVr = document.getElementById("vrEditorBlock");
  const botaoVr = document.getElementById("btnAdicionarVr");

  if (blocoVr) {
    blocoVr.classList.remove("hidden");
  }

  if (botaoVr) {
    botaoVr.classList.add("hidden");
  }
};

window.mostrarCampoVa = function mostrarCampoVa() {
  const blocoVa = document.getElementById("vaEditorBlock");
  const botaoVa = document.getElementById("btnAdicionarVa");

  if (blocoVa) {
    blocoVa.classList.remove("hidden");
  }

  if (botaoVa) {
    botaoVa.classList.add("hidden");
  }
};

window.mostrarCampoVt = function mostrarCampoVt() {
  const blocoVt = document.getElementById("vtEditorBlock");
  const botaoVt = document.getElementById("btnAdicionarVt");

  if (blocoVt) {
    blocoVt.classList.remove("hidden");
  }

  if (botaoVt) {
    botaoVt.classList.add("hidden");
  }
};

window.removerVr = function removerVr() {
  const blocoVr = document.getElementById("vrEditorBlock");
  const botaoVr = document.getElementById("btnAdicionarVr");

  setValueIfExists("editValorVr", "");
  setValueIfExists("editFornecedorVr", "outro");

  if (blocoVr) {
    blocoVr.classList.add("hidden");
  }

  if (botaoVr) {
    botaoVr.classList.remove("hidden");
  }
};

window.removerVa = function removerVa() {
  const blocoVa = document.getElementById("vaEditorBlock");
  const botaoVa = document.getElementById("btnAdicionarVa");

  setValueIfExists("editValorVa", "");
  setValueIfExists("editFornecedorVa", "outro");

  if (blocoVa) {
    blocoVa.classList.add("hidden");
  }

  if (botaoVa) {
    botaoVa.classList.remove("hidden");
  }
};

window.removerVt = function removerVt() {
  const blocoVt = document.getElementById("vtEditorBlock");
  const botaoVt = document.getElementById("btnAdicionarVt");

  setValueIfExists("editValorVt", "");
  setValueIfExists("editEstadoTransporte", "");
  setValueIfExists("editCidadeTransporte", "");
  setValueIfExists("editFornecedorVt", "outro");

  const cidadeSelect = document.getElementById("editCidadeTransporte");
  const fornecedorSelect = document.getElementById("editFornecedorVt");

  if (cidadeSelect) {
    cidadeSelect.innerHTML = `<option value="">Selecione a cidade</option>`;
  }

  if (fornecedorSelect) {
    fornecedorSelect.innerHTML = `<option value="outro">Outro</option>`;
  }

  if (blocoVt) {
    blocoVt.classList.add("hidden");
  }

  if (botaoVt) {
    botaoVt.classList.remove("hidden");
  }
};

window.adicionarBeneficioIndex = function adicionarBeneficioIndex(nome = "", valor = "") {
  const container = document.getElementById("outrosBeneficiosEditor");

  if (!container) {
    return;
  }

  const row = document.createElement("div");
  row.className = "beneficio-editor-row";

  row.innerHTML = `
    <input type="text" class="beneficio-editor-nome" placeholder="Nome do benefício" value="${nome}">
    <input type="number" class="beneficio-editor-valor" placeholder="Valor" step="0.01" value="${valor}">
    <button type="button" class="remove-button" onclick="this.parentElement.remove()">Remover</button>
  `;

  container.appendChild(row);
};

function normalizarHorario(valor) {
  if (!valor) {
    return "";
  }

  return String(valor).slice(0, 5);
}

function setValueIfExists(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function preencherEditorFinanceiro(dados) {
  const financeiro = dados.financialProfile || {};

  setValueIfExists("editSalarioBruto", financeiro.salario_bruto || 0);
  setValueIfExists("editValorVr", financeiro.valor_vr || "");
  setValueIfExists("editValorVa", financeiro.valor_va || "");

  setValueIfExists("editBancoSalario", financeiro.banco_salario || "outro");
  setValueIfExists("editFornecedorVr", financeiro.fornecedor_vr || "outro");
  setValueIfExists("editFornecedorVa", financeiro.fornecedor_va || "outro");

  setValueIfExists("editValeTransportePercentual", financeiro.vale_transporte_percentual || 0);
  setValueIfExists("editHoraInicio", normalizarHorario(financeiro.hora_inicio || "09:00"));
  setValueIfExists("editHoraFim", normalizarHorario(financeiro.hora_fim || "18:00"));

  setValueIfExists("editValorVt", financeiro.valor_vt || "");
  setValueIfExists("editEstadoTransporte", financeiro.estado_transporte || "");

  if (financeiro.estado_transporte) {
  window.atualizarCidadesTransporte();
  setValueIfExists("editCidadeTransporte", financeiro.cidade_transporte || "");
  }

  if (financeiro.cidade_transporte) {
    window.atualizarCartoesTransporte();
    setValueIfExists("editFornecedorVt", financeiro.fornecedor_vt || "outro");
  }

  if (Number(financeiro.valor_vt || 0) > 0) {
    window.mostrarCampoVt();
  }

  if (Number(financeiro.valor_vr || 0) > 0) {
    window.mostrarCampoVr();
  }

  if (Number(financeiro.valor_va || 0) > 0) {
    window.mostrarCampoVa();
  }

  renderizarBeneficiosExtras(dados.benefits || []);
}

function getNumberFromInput(id) {
  const element = document.getElementById(id);

  if (!element || element.value === "") {
    return 0;
  }

  return Number(element.value);
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

    window.adicionarBeneficioIndex(nome, valor);
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

window.salvarDadosFinanceirosIndex = async function salvarDadosFinanceirosIndex() {
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
  const valorVt = getNumberFromInput("editValorVt");

  const payload = {
    user_id: user.id,

    salario_bruto: salarioBruto,
    salario_liquido: calcularSalarioLiquidoEstimadoIndex(),

    valor_vr: valorVr,
    valor_va: valorVa,
    valor_vt: valorVt,
    valor_vr_va: valorVr + valorVa,

    banco_salario: document.getElementById("editBancoSalario")?.value || "outro",
    fornecedor_vr: document.getElementById("editFornecedorVr")?.value || "outro",
    fornecedor_va: document.getElementById("editFornecedorVa")?.value || "outro",
    fornecedor_vt: document.getElementById("editFornecedorVt")?.value || "outro",

    estado_transporte: document.getElementById("editEstadoTransporte")?.value || null,
    cidade_transporte: document.getElementById("editCidadeTransporte")?.value || null,

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

  await carregarDadosUsuario();

  const configAtualizada = obterConfiguracaoFinanceiraUsuario();

  if (configAtualizada && window.aplicarDadosUsuarioNoPainel) {
    window.aplicarDadosUsuarioNoPainel(configAtualizada);
  }

  window.fecharEditorFinanceiro();

};

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

const transportePorRegiao = {
  SP: {
    "São Paulo": ["Bilhete Único", "TOP", "Outro"],
    "Grande São Paulo": ["TOP", "Bilhete Único", "Outro"],
    "Campinas": ["Bilhete Único Campinas", "Outro"],
    "Santos": ["Cartão BR Mobilidade", "Outro"],
    "Outra cidade": ["Outro"]
  },
  RJ: {
    "Rio de Janeiro": ["Riocard Mais", "Outro"],
    "Niterói": ["Riocard Mais", "Outro"],
    "Outra cidade": ["Outro"]
  },
  MG: {
    "Belo Horizonte": ["Cartão BHBUS", "Ótimo", "Outro"],
    "Outra cidade": ["Outro"]
  },
  PR: {
    "Curitiba": ["Cartão Transporte URBS", "Outro"],
    "Outra cidade": ["Outro"]
  },
  SC: {
    "Florianópolis": ["Cartão Passe Rápido", "Outro"],
    "Outra cidade": ["Outro"]
  },
  RS: {
    "Porto Alegre": ["Cartão TRI", "Outro"],
    "Outra cidade": ["Outro"]
  },
  OUTRO: {
    "Outra cidade": ["Outro"]
  }
};

window.atualizarCidadesTransporte = function atualizarCidadesTransporte() {
  const estado = document.getElementById("editEstadoTransporte")?.value || "";
  const cidadeSelect = document.getElementById("editCidadeTransporte");
  const fornecedorSelect = document.getElementById("editFornecedorVt");

  if (!cidadeSelect || !fornecedorSelect) {
    return;
  }

  cidadeSelect.innerHTML = `<option value="">Selecione a cidade</option>`;
  fornecedorSelect.innerHTML = `<option value="outro">Outro</option>`;

  const cidades = transportePorRegiao[estado];

  if (!cidades) {
    return;
  }

  Object.keys(cidades).forEach((cidade) => {
    const option = document.createElement("option");
    option.value = cidade;
    option.textContent = cidade;
    cidadeSelect.appendChild(option);
  });
};

window.atualizarCartoesTransporte = function atualizarCartoesTransporte() {
  const estado = document.getElementById("editEstadoTransporte")?.value || "";
  const cidade = document.getElementById("editCidadeTransporte")?.value || "";
  const fornecedorSelect = document.getElementById("editFornecedorVt");

  if (!fornecedorSelect) {
    return;
  }

  fornecedorSelect.innerHTML = `<option value="outro">Outro</option>`;

  const cartoes = transportePorRegiao[estado]?.[cidade] || ["Outro"];

  cartoes.forEach((cartao) => {
    const value = normalizarValorSelect(cartao);

    const option = document.createElement("option");
    option.value = value;
    option.textContent = cartao;
    fornecedorSelect.appendChild(option);
  });
};

function normalizarValorSelect(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

console.log("profileEditor carregado:", {
  abrirEditorFinanceiro: typeof window.abrirEditorFinanceiro,
  mostrarCampoVt: typeof window.mostrarCampoVt,
  atualizarCidadesTransporte: typeof window.atualizarCidadesTransporte,
  salvarDadosFinanceirosIndex: typeof window.salvarDadosFinanceirosIndex
});