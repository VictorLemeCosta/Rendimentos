let investmentUser = null;
let investmentAssets = [];
let investmentTransactions = [];

let btcBRLPrice = 0;
let btcUSDPrice = 0;

let investmentTypeChartInstance = null;
let investmentGainLossChartInstance = null;
let investmentEvolutionChartInstance = null;

const variableIncomeTypes = ["FII", "Ação", "ETF", "BDR"];
const fixedIncomeTypes = ["Renda fixa"];
const cryptoTypes = ["Bitcoin", "Cripto"];

function formatBRLInvestment(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatUSDInvestment(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function formatPercentInvestment(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")}%`;
}

function setInvestmentText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

async function carregarInvestimentos() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  investmentUser = user;

  await carregarAtivosInvestimento();
  await carregarMovimentacoesInvestimento();
  await atualizarCotacaoBitcoin();

  preencherDatasPadraoInvestimentos();
  atualizarCamposInvestimento();

  renderizarBitcoin();
  renderizarResumoGeralInvestimentos();
  renderizarTabelaTodosInvestimentos();
  renderizarRendaVariavel();
  renderizarRendaFixa();
  renderizarOutrosInvestimentos();
  renderizarHistoricoMovimentacoes();
  preencherSelectInvestimentosExistentes();

  renderizarGraficoDistribuicaoPorTipo();
  renderizarGraficoGanhoPerda();
  renderizarGraficoEvolucaoPatrimonial();
}

async function carregarAtivosInvestimento() {
  const { data, error } = await window.supabaseClient
    .from("investment_assets")
    .select("*")
    .eq("user_id", investmentUser.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar investimentos:", error);
    investmentAssets = [];
    return;
  }

  investmentAssets = data || [];
}

async function carregarMovimentacoesInvestimento() {
  const { data, error } = await window.supabaseClient
    .from("investment_transactions")
    .select("*")
    .eq("user_id", investmentUser.id)
    .order("data_movimento", { ascending: false });

  if (error) {
    console.error("Erro ao carregar movimentações:", error);
    investmentTransactions = [];
    return;
  }

  investmentTransactions = data || [];
}

async function atualizarCotacaoBitcoin() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd"
    );

    const data = await response.json();

    btcBRLPrice = Number(data?.bitcoin?.brl || 0);
    btcUSDPrice = Number(data?.bitcoin?.usd || 0);
  } catch (error) {
    console.error("Erro ao buscar cotação do Bitcoin:", error);
    btcBRLPrice = 0;
    btcUSDPrice = 0;
  }
}

function preencherDatasPadraoInvestimentos() {
  const hoje = new Date().toISOString().slice(0, 10);
  const dataInput = document.getElementById("investmentMovementDate");

  if (dataInput && !dataInput.value) {
    dataInput.value = hoje;
  }
}

window.atualizarCamposInvestimento = function atualizarCamposInvestimento() {
  const operation = document.getElementById("investmentOperation")?.value || "adicionar";
  const type = document.getElementById("investmentType")?.value || "Bitcoin";

  const allFields = document.querySelectorAll(".investment-field");

  allFields.forEach((field) => {
    field.classList.remove("hidden");
  });

  const existingField = document.querySelector(".investment-existing-field");
  const nameField = document.querySelector(".investment-name-field");
  const tickerField = document.querySelector(".investment-ticker-field");
  const institutionField = document.querySelector(".investment-institution-field");
  const quantityField = document.querySelector(".investment-quantity-field");
  const investedValueField = document.querySelector(".investment-invested-value-field");
  const estimatedValueField = document.querySelector(".investment-estimated-value-field");
  const dateField = document.querySelector(".investment-date-field");
  const noteField = document.querySelector(".investment-note-field");

  if (operation === "adicionar") {
    if (existingField) {
      existingField.classList.add("hidden");
    }

    if (estimatedValueField) {
      estimatedValueField.classList.add("hidden");
    }
  }

  if (operation === "remover") {
    if (nameField) nameField.classList.add("hidden");
    if (tickerField) tickerField.classList.add("hidden");
    if (institutionField) institutionField.classList.add("hidden");
    if (estimatedValueField) estimatedValueField.classList.add("hidden");
  }

  if (operation === "atualizar_valor") {
    if (nameField) nameField.classList.add("hidden");
    if (tickerField) tickerField.classList.add("hidden");
    if (institutionField) institutionField.classList.add("hidden");
    if (quantityField) quantityField.classList.add("hidden");
    if (investedValueField) investedValueField.classList.add("hidden");
  }

  if (operation === "rendimento") {
    if (nameField) nameField.classList.add("hidden");
    if (tickerField) tickerField.classList.add("hidden");
    if (institutionField) institutionField.classList.add("hidden");
    if (quantityField) quantityField.classList.add("hidden");
    if (estimatedValueField) estimatedValueField.classList.add("hidden");
  }

  if (type === "Bitcoin") {
    if (institutionField) {
      institutionField.classList.add("hidden");
    }

    if (tickerField) {
      tickerField.classList.add("hidden");
    }

    if (operation === "adicionar" && nameField) {
      nameField.classList.add("hidden");
    }
  }

  if (type === "Renda fixa") {
    if (tickerField) {
      tickerField.classList.add("hidden");
    }

    if (quantityField) {
      quantityField.classList.add("hidden");
    }
  }

  if (type === "Fundo" || type === "Previdência" || type === "Outros") {
    if (tickerField) {
      tickerField.classList.add("hidden");
    }
  }

  if (dateField) {
    dateField.classList.remove("hidden");
  }

  if (noteField) {
    noteField.classList.remove("hidden");
  }
};

function preencherSelectInvestimentosExistentes() {
  const select = document.getElementById("investmentExistingAsset");

  if (!select) {
    return;
  }

  select.innerHTML = `<option value="">Selecione um investimento</option>`;

  investmentAssets.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;

    const ticker = item.ticker ? ` - ${item.ticker}` : "";
    option.textContent = `${item.nome}${ticker}`;

    select.appendChild(option);
  });
}

function encontrarAtivoBitcoin() {
  return investmentAssets.find((item) => {
    const ticker = String(item.ticker || "").toUpperCase();
    const nome = String(item.nome || "").toLowerCase();
    const tipo = String(item.tipo || "");

    return ticker === "BTC" || nome.includes("bitcoin") || tipo === "Bitcoin";
  });
}

function obterSaldoBTC() {
  const btc = encontrarAtivoBitcoin();

  if (!btc) {
    return 0;
  }

  return Number(btc.quantidade || 0);
}

function calcularValorEstimadoAtivo(item) {
  const tipo = String(item.tipo || "");
  const ticker = String(item.ticker || "").toUpperCase();
  const quantidade = Number(item.quantidade || 0);

  if ((tipo === "Bitcoin" || ticker === "BTC") && btcBRLPrice > 0) {
    return quantidade * btcBRLPrice;
  }

  return Number(item.valor_atual || item.valor_aplicado || 0);
}

function calcularValorInvestidoTotal() {
  return investmentAssets.reduce((sum, item) => {
    return sum + Number(item.valor_aplicado || 0);
  }, 0);
}

function calcularValorEstimadoTotal() {
  return investmentAssets.reduce((sum, item) => {
    return sum + calcularValorEstimadoAtivo(item);
  }, 0);
}

function calcularAportesDoMes() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  return investmentTransactions
    .filter((item) => {
      if (item.tipo !== "aporte") {
        return false;
      }

      const data = new Date(item.data_movimento + "T00:00:00");

      return data.getFullYear() === ano && data.getMonth() === mes;
    })
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

function renderizarResumoGeralInvestimentos() {
  const totalInvestido = calcularValorInvestidoTotal();
  const valorEstimado = calcularValorEstimadoTotal();
  const ganhoPerda = valorEstimado - totalInvestido;
  const rentabilidade = totalInvestido > 0 ? (ganhoPerda / totalInvestido) * 100 : 0;

  const cripto = investmentAssets
    .filter((item) => cryptoTypes.includes(item.tipo))
    .reduce((sum, item) => sum + calcularValorEstimadoAtivo(item), 0);

  const rendaVariavel = investmentAssets
    .filter((item) => variableIncomeTypes.includes(item.tipo))
    .reduce((sum, item) => sum + calcularValorEstimadoAtivo(item), 0);

  setInvestmentText("investmentTotalInvested", formatBRLInvestment(totalInvestido));
  setInvestmentText("investmentEstimatedValue", formatBRLInvestment(valorEstimado));
  renderizarCardGanhoPerda("investmentGainLoss", ganhoPerda, rentabilidade);

  setInvestmentText("investmentMainCategory", obterMaiorCategoriaInvestimentos());
  setInvestmentText("investmentMonthContributions", formatBRLInvestment(calcularAportesDoMes()));
  setInvestmentText("investmentAssetCount", investmentAssets.length);
  setInvestmentText("investmentCryptoValue", formatBRLInvestment(cripto));
  setInvestmentText("investmentVariableIncomeValue", formatBRLInvestment(rendaVariavel));
}

function renderizarCardGanhoPerda(elementId, ganhoPerda, percentual) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  const isPositive = ganhoPerda > 0;
  const isNegative = ganhoPerda < 0;

  let className = "investment-neutral";
  let sinal = "";

  if (isPositive) {
    className = "investment-positive";
    sinal = "+";
  }

  if (isNegative) {
    className = "investment-negative";
  }

  element.classList.remove("investment-positive", "investment-negative", "investment-neutral");
  element.classList.add(className);

  element.innerHTML = `
    <div>${formatBRLInvestment(ganhoPerda)}</div>
    <small>${sinal}${formatPercentInvestment(percentual)}</small>
  `;
}

function renderizarBitcoin() {
  const saldoBTC = obterSaldoBTC();
  const valorBRL = saldoBTC * btcBRLPrice;
  const valorUSD = saldoBTC * btcUSDPrice;

  setInvestmentText("btcPriceBRL", btcBRLPrice > 0 ? formatBRLInvestment(btcBRLPrice) : "--");
  setInvestmentText("btcPriceUSD", btcUSDPrice > 0 ? formatUSDInvestment(btcUSDPrice) : "--");

  setInvestmentText("btcBalance", `${saldoBTC.toFixed(8)} BTC`);
  setInvestmentText("btcBRL", formatBRLInvestment(valorBRL));
  setInvestmentText("btcUSD", formatUSDInvestment(valorUSD));
  setInvestmentText("cryptoPatrimony", formatBRLInvestment(valorBRL));
}

window.salvarMovimentoInvestimento = async function salvarMovimentoInvestimento() {
  if (!investmentUser) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const operation = document.getElementById("investmentOperation").value;
  const type = document.getElementById("investmentType").value;

  if (operation === "adicionar") {
    await adicionarInvestimentoOuAporte(type);
    return;
  }

  if (operation === "remover") {
    await removerOuVenderInvestimento();
    return;
  }

  if (operation === "atualizar_valor") {
    await atualizarValorEstimadoInvestimento();
    return;
  }

  if (operation === "rendimento") {
    await registrarRendimentoInvestimento();
    return;
  }
};

async function adicionarInvestimentoOuAporte(type) {
  let assetId = document.getElementById("investmentExistingAsset")?.value || "";

  let nome = document.getElementById("investmentName")?.value.trim() || "";
  let ticker = document.getElementById("investmentTicker")?.value.trim() || "";
  let instituicao = document.getElementById("investmentInstitution")?.value.trim() || "";
  const quantidade = Number(document.getElementById("investmentQuantity")?.value || 0);
  const valorInvestido = Number(document.getElementById("investmentInvestedValue")?.value || 0);
  const data = document.getElementById("investmentMovementDate")?.value;
  const observacao = document.getElementById("investmentNote")?.value.trim() || "";

  if (type === "Bitcoin") {
    nome = "Bitcoin";
    ticker = "BTC";
    instituicao = "";
  }

  if (!data) {
    alert("Preencha a data.");
    return;
  }

  if (quantidade <= 0 && type !== "Renda fixa") {
    alert("Preencha a quantidade.");
    return;
  }

  if (valorInvestido <= 0) {
    alert("Preencha o valor investido.");
    return;
  }

  let asset = null;

  if (assetId) {
    asset = investmentAssets.find((item) => item.id === assetId);
  }

  if (!asset && type === "Bitcoin") {
    asset = encontrarAtivoBitcoin();
  }

  if (!asset) {
    if (!nome) {
      alert("Preencha o nome do investimento.");
      return;
    }

    const { data: createdAsset, error: createError } = await window.supabaseClient
      .from("investment_assets")
      .insert({
        user_id: investmentUser.id,
        nome,
        tipo: type,
        instituicao,
        ticker,
        quantidade,
        valor_aplicado: valorInvestido,
        valor_atual: type === "Bitcoin" && btcBRLPrice > 0 ? quantidade * btcBRLPrice : valorInvestido,
        data_compra: data,
        status: "ativo",
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("Erro ao criar investimento:", createError);
      alert("Erro ao criar investimento: " + createError.message);
      return;
    }

    asset = createdAsset;
  } else {
    const novaQuantidade = Number(asset.quantidade || 0) + quantidade;
    const novoInvestido = Number(asset.valor_aplicado || 0) + valorInvestido;

    const novoValorEstimado = asset.tipo === "Bitcoin" && btcBRLPrice > 0
      ? novaQuantidade * btcBRLPrice
      : Number(asset.valor_atual || asset.valor_aplicado || 0) + valorInvestido;

    const { error: updateError } = await window.supabaseClient
      .from("investment_assets")
      .update({
        quantidade: novaQuantidade,
        valor_aplicado: novoInvestido,
        valor_atual: novoValorEstimado,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", asset.id);

    if (updateError) {
      console.error("Erro ao atualizar investimento:", updateError);
      alert("Erro ao atualizar investimento: " + updateError.message);
      return;
    }
  }

  await registrarMovimentacao({
    assetId: asset.id,
    tipo: "aporte",
    valor: valorInvestido,
    quantidade,
    data,
    observacao
  });

  limparFormularioInvestimentos();
  await carregarInvestimentos();
}

async function removerOuVenderInvestimento() {
  const assetId = document.getElementById("investmentExistingAsset")?.value;
  const quantidade = Number(document.getElementById("investmentQuantity")?.value || 0);
  const valor = Number(document.getElementById("investmentInvestedValue")?.value || 0);
  const data = document.getElementById("investmentMovementDate")?.value;
  const observacao = document.getElementById("investmentNote")?.value.trim() || "";

  if (!assetId) {
    alert("Selecione um investimento existente.");
    return;
  }

  if (!data) {
    alert("Preencha a data.");
    return;
  }

  if (quantidade <= 0 && valor <= 0) {
    alert("Preencha a quantidade ou o valor a remover.");
    return;
  }

  const asset = investmentAssets.find((item) => item.id === assetId);

  if (!asset) {
    alert("Investimento não encontrado.");
    return;
  }

  const novaQuantidade = Math.max(0, Number(asset.quantidade || 0) - quantidade);
  const novoInvestido = Math.max(0, Number(asset.valor_aplicado || 0) - valor);

  const novoValorEstimado = asset.tipo === "Bitcoin" && btcBRLPrice > 0
    ? novaQuantidade * btcBRLPrice
    : Math.max(0, Number(asset.valor_atual || 0) - valor);

  const { error } = await window.supabaseClient
    .from("investment_assets")
    .update({
      quantidade: novaQuantidade,
      valor_aplicado: novoInvestido,
      valor_atual: novoValorEstimado,
      atualizado_em: new Date().toISOString()
    })
    .eq("id", asset.id);

  if (error) {
    console.error("Erro ao remover investimento:", error);
    alert("Erro ao remover investimento: " + error.message);
    return;
  }

  await registrarMovimentacao({
    assetId,
    tipo: "resgate",
    valor,
    quantidade,
    data,
    observacao
  });

  limparFormularioInvestimentos();
  await carregarInvestimentos();
}

async function atualizarValorEstimadoInvestimento() {
  const assetId = document.getElementById("investmentExistingAsset")?.value;
  const novoValor = Number(document.getElementById("investmentEstimatedManualValue")?.value || 0);
  const data = document.getElementById("investmentMovementDate")?.value;
  const observacao = document.getElementById("investmentNote")?.value.trim() || "";

  if (!assetId) {
    alert("Selecione um investimento existente.");
    return;
  }

  if (novoValor <= 0) {
    alert("Preencha o valor estimado agora.");
    return;
  }

  const { error } = await window.supabaseClient
    .from("investment_assets")
    .update({
      valor_atual: novoValor,
      atualizado_em: new Date().toISOString()
    })
    .eq("id", assetId);

  if (error) {
    console.error("Erro ao atualizar valor estimado:", error);
    alert("Erro ao atualizar valor estimado: " + error.message);
    return;
  }

  await registrarMovimentacao({
    assetId,
    tipo: "ajuste",
    valor: novoValor,
    quantidade: 0,
    data,
    observacao: observacao || "Atualização manual de valor estimado"
  });

  limparFormularioInvestimentos();
  await carregarInvestimentos();
}

async function registrarRendimentoInvestimento() {
  const assetId = document.getElementById("investmentExistingAsset")?.value;
  const valor = Number(document.getElementById("investmentInvestedValue")?.value || 0);
  const data = document.getElementById("investmentMovementDate")?.value;
  const observacao = document.getElementById("investmentNote")?.value.trim() || "";

  if (!assetId) {
    alert("Selecione um investimento existente.");
    return;
  }

  if (valor <= 0) {
    alert("Preencha o valor do rendimento.");
    return;
  }

  const asset = investmentAssets.find((item) => item.id === assetId);

  if (!asset) {
    alert("Investimento não encontrado.");
    return;
  }

  const novoValorEstimado = Number(asset.valor_atual || asset.valor_aplicado || 0) + valor;

  const { error } = await window.supabaseClient
    .from("investment_assets")
    .update({
      valor_atual: novoValorEstimado,
      atualizado_em: new Date().toISOString()
    })
    .eq("id", assetId);

  if (error) {
    console.error("Erro ao registrar rendimento:", error);
    alert("Erro ao registrar rendimento: " + error.message);
    return;
  }

  await registrarMovimentacao({
    assetId,
    tipo: "rendimento",
    valor,
    quantidade: 0,
    data,
    observacao
  });

  limparFormularioInvestimentos();
  await carregarInvestimentos();
}

async function registrarMovimentacao({ assetId, tipo, valor, quantidade, data, observacao }) {
  const { error } = await window.supabaseClient
    .from("investment_transactions")
    .insert({
      user_id: investmentUser.id,
      asset_id: assetId,
      tipo,
      valor: Number(valor || 0),
      quantidade: Number(quantidade || 0),
      data_movimento: data || new Date().toISOString().slice(0, 10),
      observacao
    });

  if (error) {
    console.error("Erro ao registrar movimentação:", error);
    alert("Investimento salvo, mas houve erro ao registrar movimentação: " + error.message);
  }
}

function limparFormularioInvestimentos() {
  const ids = [
    "investmentExistingAsset",
    "investmentName",
    "investmentTicker",
    "investmentInstitution",
    "investmentQuantity",
    "investmentInvestedValue",
    "investmentEstimatedManualValue",
    "investmentNote"
  ];

  ids.forEach((id) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });

  preencherDatasPadraoInvestimentos();
}

window.removerInvestimento = async function removerInvestimento(id) {
  const confirmacao = confirm("Deseja remover este investimento?");

  if (!confirmacao) {
    return;
  }

  const { error } = await window.supabaseClient
    .from("investment_assets")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao remover investimento:", error);
    alert("Erro ao remover investimento: " + error.message);
    return;
  }

  await carregarInvestimentos();
};

function renderizarTabelaTodosInvestimentos() {
  const tbody = document.getElementById("investmentAssetsTableBody");

  if (!tbody) {
    return;
  }

  if (!investmentAssets.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">Nenhum investimento cadastrado ainda.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = investmentAssets.map((item) => criarLinhaInvestimentoCompleta(item, true)).join("");
}

function criarLinhaInvestimentoCompleta(item, incluirAcao) {
  const investido = Number(item.valor_aplicado || 0);
  const estimado = calcularValorEstimadoAtivo(item);
  const ganhoPerda = estimado - investido;

  return `
    <tr>
      <td>${item.nome || "-"}</td>
      <td>${item.tipo || "-"}</td>
      <td>${item.instituicao || "-"}</td>
      <td>${item.ticker || "-"}</td>
      <td>${Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
      <td>${formatBRLInvestment(investido)}</td>
      <td>${formatBRLInvestment(estimado)}</td>
      <td>${formatBRLInvestment(ganhoPerda)}</td>
      ${
        incluirAcao
          ? `<td><button type="button" class="remove-button" onclick="removerInvestimento('${item.id}')">Remover</button></td>`
          : ""
      }
    </tr>
  `;
}

function renderizarRendaVariavel() {
  const items = investmentAssets.filter((item) => variableIncomeTypes.includes(item.tipo));

  const investido = somarInvestido(items);
  const estimado = somarEstimado(items);
  const ganhoPerda = estimado - investido;

  setInvestmentText("variableIncomeInvested", formatBRLInvestment(investido));
  setInvestmentText("variableIncomeEstimated", formatBRLInvestment(estimado));
  setInvestmentText("variableIncomeGainLoss", formatBRLInvestment(ganhoPerda));
  setInvestmentText("variableIncomeAssetCount", items.length);

  const tbody = document.getElementById("variableIncomeTableBody");

  if (!tbody) {
    return;
  }

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6">Nenhum ativo de renda variável cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const investidoItem = Number(item.valor_aplicado || 0);
    const estimadoItem = calcularValorEstimadoAtivo(item);
    const ganhoPerdaItem = estimadoItem - investidoItem;

    return `
      <tr>
        <td>${item.ticker || item.nome || "-"}</td>
        <td>${item.tipo || "-"}</td>
        <td>${Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
        <td>${formatBRLInvestment(investidoItem)}</td>
        <td>${formatBRLInvestment(estimadoItem)}</td>
        <td>${formatBRLInvestment(ganhoPerdaItem)}</td>
      </tr>
    `;
  }).join("");
}

function renderizarRendaFixa() {
  const items = investmentAssets.filter((item) => fixedIncomeTypes.includes(item.tipo));

  const investido = somarInvestido(items);
  const estimado = somarEstimado(items);
  const ganhoPerda = estimado - investido;

  setInvestmentText("fixedIncomeInvested", formatBRLInvestment(investido));
  setInvestmentText("fixedIncomeEstimated", formatBRLInvestment(estimado));
  setInvestmentText("fixedIncomeGainLoss", formatBRLInvestment(ganhoPerda));
  setInvestmentText("fixedIncomeAssetCount", items.length);

  const tbody = document.getElementById("fixedIncomeTableBody");

  if (!tbody) {
    return;
  }

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6">Nenhuma aplicação de renda fixa cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const investidoItem = Number(item.valor_aplicado || 0);
    const estimadoItem = calcularValorEstimadoAtivo(item);
    const ganhoPerdaItem = estimadoItem - investidoItem;

    return `
      <tr>
        <td>${item.nome || "-"}</td>
        <td>${item.instituicao || "-"}</td>
        <td>${formatBRLInvestment(investidoItem)}</td>
        <td>${formatBRLInvestment(estimadoItem)}</td>
        <td>${item.data_compra ? new Date(item.data_compra + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</td>
        <td>${formatBRLInvestment(ganhoPerdaItem)}</td>
      </tr>
    `;
  }).join("");
}

function renderizarOutrosInvestimentos() {
  const items = investmentAssets.filter((item) => {
    return !variableIncomeTypes.includes(item.tipo) &&
      !fixedIncomeTypes.includes(item.tipo) &&
      item.tipo !== "Bitcoin";
  });

  const tbody = document.getElementById("otherInvestmentsTableBody");

  if (!tbody) {
    return;
  }

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7">Nenhum outro investimento cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const investido = Number(item.valor_aplicado || 0);
    const estimado = calcularValorEstimadoAtivo(item);
    const ganhoPerda = estimado - investido;

    return `
      <tr>
        <td>${item.nome || "-"}</td>
        <td>${item.tipo || "-"}</td>
        <td>${item.instituicao || "-"}</td>
        <td>${Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
        <td>${formatBRLInvestment(investido)}</td>
        <td>${formatBRLInvestment(estimado)}</td>
        <td>${formatBRLInvestment(ganhoPerda)}</td>
      </tr>
    `;
  }).join("");
}

function somarInvestido(items) {
  return items.reduce((sum, item) => sum + Number(item.valor_aplicado || 0), 0);
}

function somarEstimado(items) {
  return items.reduce((sum, item) => sum + calcularValorEstimadoAtivo(item), 0);
}

function renderizarHistoricoMovimentacoes() {
  const tbody = document.getElementById("investmentTransactionsTableBody");

  if (!tbody) {
    return;
  }

  if (!investmentTransactions.length) {
    tbody.innerHTML = `<tr><td colspan="7">Nenhuma movimentação registrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = investmentTransactions.map((item) => {
    const asset = investmentAssets.find((assetItem) => assetItem.id === item.asset_id);

    return `
      <tr>
        <td>${new Date(item.data_movimento + "T00:00:00").toLocaleDateString("pt-BR")}</td>
        <td>${asset?.nome || "-"}</td>
        <td>${asset?.tipo || "-"}</td>
        <td>${capitalizarInvestment(item.tipo)}</td>
        <td>${Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
        <td>${formatBRLInvestment(item.valor)}</td>
        <td>${item.observacao || "-"}</td>
      </tr>
    `;
  }).join("");
}

function capitalizarInvestment(texto) {
  if (!texto) {
    return "";
  }

  const valor = String(texto).trim();

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function renderizarGraficoDistribuicaoPorTipo() {
  const canvas = document.getElementById("investmentTypePieChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const grupos = {};

  investmentAssets.forEach((item) => {
    const tipo = item.tipo || "Outros";
    const valor = calcularValorEstimadoAtivo(item);

    if (!grupos[tipo]) {
      grupos[tipo] = 0;
    }

    grupos[tipo] += valor;
  });

  const labels = Object.keys(grupos);
  const values = Object.values(grupos);

  if (investmentTypeChartInstance) {
    investmentTypeChartInstance.destroy();
  }

  investmentTypeChartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderizarGraficoGanhoPerda() {
  const canvas = document.getElementById("investmentGainLossChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const labels = investmentAssets.map((item) => item.ticker || item.nome || "-");
  const values = investmentAssets.map((item) => {
    return calcularValorEstimadoAtivo(item) - Number(item.valor_aplicado || 0);
  });

  if (investmentGainLossChartInstance) {
    investmentGainLossChartInstance.destroy();
  }

  investmentGainLossChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Ganho/Perda",
          data: values
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function renderizarGraficoEvolucaoPatrimonial() {
  const canvas = document.getElementById("investmentEvolutionChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const transacoesOrdenadas = [...investmentTransactions].sort((a, b) => {
    return new Date(a.data_movimento) - new Date(b.data_movimento);
  });

  const labels = [];
  const valores = [];
  let acumulado = 0;

  transacoesOrdenadas.forEach((item) => {
    const valor = Number(item.valor || 0);

    if (item.tipo === "aporte" || item.tipo === "rendimento") {
      acumulado += valor;
    }

    if (item.tipo === "resgate") {
      acumulado -= valor;
    }

    if (item.tipo === "ajuste") {
      acumulado = valor;
    }

    labels.push(new Date(item.data_movimento + "T00:00:00").toLocaleDateString("pt-BR"));
    valores.push(acumulado);
  });

  if (!labels.length) {
    labels.push(new Date().toLocaleDateString("pt-BR"));
    valores.push(calcularValorEstimadoTotal());
  }

  if (investmentEvolutionChartInstance) {
    investmentEvolutionChartInstance.destroy();
  }

  investmentEvolutionChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Valor estimado da carteira",
          data: valores,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function obterMaiorCategoriaInvestimentos() {
  if (!investmentAssets.length) {
    return "-";
  }

  const categorias = {};

  investmentAssets.forEach((item) => {
    const tipo = item.tipo || "Outros";
    const valor = calcularValorEstimadoAtivo(item);

    if (!categorias[tipo]) {
      categorias[tipo] = 0;
    }

    categorias[tipo] += valor;
  });

  const categoriasOrdenadas = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1]);

  const [maiorCategoria, maiorValor] = categoriasOrdenadas[0];

  if (!maiorCategoria || maiorValor <= 0) {
    return "-";
  }

  return maiorCategoria;
}