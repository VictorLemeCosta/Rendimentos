let incomeItems = [];

let financeRuntimeConfig = {
  salarioBruto: 0,
  salarioLiquido: 0,
  valorVr: 0,
  valorVa: 0,
  outrosBeneficios: [],
  jornadaTipo: "SEG_SEX",
  horaInicio: "09:00",
  horaFim: "18:00",
  diasTrabalho: [1, 2, 3, 4, 5]
};

const CLT_CONFIG = {
  salary: 0,
  defaultDependents: 0,
  dependentDeduction: 189.59,
  simplifiedDeductionLimit: 607.20
};

function toNumber(value) {
  return Number(value || 0);
}

function getWorkStartMinutes() {
  return horarioParaMinutos(financeRuntimeConfig.horaInicio || "09:00");
}

function getWorkEndMinutes() {
  return horarioParaMinutos(financeRuntimeConfig.horaFim || "18:00");
}

function getWorkSecondsPerDay() {
  const start = getWorkStartMinutes();
  const end = getWorkEndMinutes();

  return Math.max(0, (end - start) * 60);
}

function getWorkHoursPerDay() {
  return getWorkSecondsPerDay() / 3600;
}

function isWorkDay(date) {
  const day = date.getDay();
  const diasTrabalho = financeRuntimeConfig.diasTrabalho || [1, 2, 3, 4, 5];

  return diasTrabalho.includes(day);
}

function montarIncomeItemsFromConfig(config) {
  const items = [];

  if (toNumber(config.salarioBruto) > 0) {
    items.push({
      id: "salary",
      name: "Salário",
      amount: toNumber(config.salarioBruto),
      method: "Rendimento cadastrado",
      className: "nubank",
      emoji: "💜"
    });
  }

  if (toNumber(config.valorVr) > 0) {
    items.push({
      id: "vr",
      name: "VR",
      amount: toNumber(config.valorVr),
      method: "Benefício cadastrado",
      className: "caju",
      emoji: "🍊"
    });
  }

  if (toNumber(config.valorVa) > 0) {
    items.push({
      id: "va",
      name: "VA",
      amount: toNumber(config.valorVa),
      method: "Benefício cadastrado",
      className: "caju",
      emoji: "🛒"
    });
  }

  const outrosBeneficios = config.outrosBeneficios || [];

  outrosBeneficios.forEach((beneficio, index) => {
    const nome = beneficio.nome || `Benefício ${index + 1}`;
    const valor = toNumber(beneficio.valor);

    if (valor > 0 && nome !== "VR" && nome !== "VA") {
      items.push({
        id: `beneficio_${index}`,
        name: nome,
        amount: valor,
        method: "Benefício adicional",
        className: "nubank",
        emoji: "➕"
      });
    }
  });

  return items;
}

function aplicarDadosUsuarioNoPainel(config) {
  financeRuntimeConfig = {
    ...financeRuntimeConfig,
    ...config,
    salarioBruto: toNumber(config.salarioBruto),
    salarioLiquido: toNumber(config.salarioLiquido),
    valorVr: toNumber(config.valorVr),
    valorVa: toNumber(config.valorVa),
    diasTrabalho: config.diasTrabalho || [1, 2, 3, 4, 5],
    horaInicio: config.horaInicio || "09:00",
    horaFim: config.horaFim || "18:00"
  };

  CLT_CONFIG.salary = financeRuntimeConfig.salarioBruto;

  incomeItems = montarIncomeItemsFromConfig(financeRuntimeConfig);

  refreshAll();
}

    const INSS_TABLE_2026 = [
      { limit: 1621.00, rate: 0.075 },
      { limit: 2902.84, rate: 0.09 },
      { limit: 4354.27, rate: 0.12 },
      { limit: 8475.55, rate: 0.14 }
    ];

    const IRRF_TABLE_2026 = [
      { min: 0, max: 2428.80, rate: 0, deduction: 0 },
      { min: 2428.81, max: 2826.65, rate: 0.075, deduction: 182.16 },
      { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 394.16 },
      { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 675.49 },
      { min: 4664.69, max: Infinity, rate: 0.275, deduction: 908.73 }
    ];

    function formatBRL(value) {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    }

    function formatBRLPrecise(value) {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      });
    }

    function isBusinessDay(date) {
  return isWorkDay(date);
}

    function getBusinessDaysInMonth(year, month) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      let businessDays = 0;

      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, month, day);

        if (isBusinessDay(date)) {
          businessDays++;
        }
      }

      return businessDays;
    }

    function getBusinessDaysInCurrentMonth() {
      const now = new Date();
      return getBusinessDaysInMonth(now.getFullYear(), now.getMonth());
    }

    function getRates(amount, year = new Date().getFullYear(), month = new Date().getMonth()) {
  const businessDays = getBusinessDaysInMonth(year, month);
  const workHoursPerDay = getWorkHoursPerDay();

  if (businessDays <= 0 || workHoursPerDay <= 0) {
    return {
      second: 0,
      minute: 0,
      hour: 0,
      day: 0,
      month: amount
    };
  }

  const perDay = amount / businessDays;
  const perHour = perDay / workHoursPerDay;
  const perMinute = perHour / 60;
  const perSecond = perMinute / 60;

  return {
    second: perSecond,
    minute: perMinute,
    hour: perHour,
    day: perDay,
    month: amount
  };
}

    function renderSummary() {
      const total = incomeItems.reduce((sum, item) => sum + item.amount, 0);
      const now = new Date();
      const rates = getRates(total, now.getFullYear(), now.getMonth());

      document.getElementById("totalMonthly").textContent = formatBRL(rates.month);
      document.getElementById("totalDaily").textContent = formatBRL(rates.day);
      document.getElementById("totalHourly").textContent = formatBRL(rates.hour);
      document.getElementById("totalSecond").textContent = formatBRLPrecise(rates.second);
    }

    function renderCards() {
      const container = document.getElementById("incomeCards");
      const now = new Date();

      container.innerHTML = "";

      incomeItems.forEach(item => {
        const rates = getRates(item.amount, now.getFullYear(), now.getMonth());

        const card = document.createElement("article");
        card.className = `income-card ${item.className}`;

        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="income-title">${item.emoji} ${item.name}</div>
              <div class="method">${item.method}</div>
            </div>

            <div class="monthly-value">${formatBRL(item.amount)}</div>
          </div>

          <div class="rates">
            <div class="rate-box">
              <div class="rate-label">Segundo</div>
              <div class="rate-value">${formatBRLPrecise(rates.second)}</div>
            </div>

            <div class="rate-box">
              <div class="rate-label">Minuto</div>
              <div class="rate-value">${formatBRL(rates.minute)}</div>
            </div>

            <div class="rate-box">
              <div class="rate-label">Hora</div>
              <div class="rate-value">${formatBRL(rates.hour)}</div>
            </div>

            <div class="rate-box">
              <div class="rate-label">Dia útil</div>
              <div class="rate-value">${formatBRL(rates.day)}</div>
            </div>

            <div class="rate-box">
              <div class="rate-label">Mês</div>
              <div class="rate-value">${formatBRL(rates.month)}</div>
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    }

    function getSecondsWorkedToday(now) {
  if (!isBusinessDay(now)) {
    return 0;
  }

  const startMinutes = getWorkStartMinutes();
  const endMinutes = getWorkEndMinutes();

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60;

  const totalSecondsDay = getWorkSecondsPerDay();

  if (currentMinutes < startMinutes) {
    return 0;
  }

  if (currentMinutes >= endMinutes) {
    return totalSecondsDay;
  }

  return Math.floor((currentMinutes - startMinutes) * 60);
}

    function getCompletedBusinessDaysBeforeToday(now) {
      const year = now.getFullYear();
      const month = now.getMonth();
      const today = now.getDate();

      let count = 0;

      for (let day = 1; day < today; day++) {
        const date = new Date(year, month, day);

        if (isBusinessDay(date)) {
          count++;
        }
      }

      return count;
    }

    function getSecondsWorkedInCurrentMonth(now) {
  const completedBusinessDays = getCompletedBusinessDaysBeforeToday(now);
  const todaySeconds = getSecondsWorkedToday(now);

  return completedBusinessDays * getWorkSecondsPerDay() + todaySeconds;
}

    function getWorkStatus(now) {
  const status = document.getElementById("workStatus");

  if (!status) {
    return;
  }

  if (!isBusinessDay(now)) {
    status.textContent = "Fora da jornada cadastrada";
    status.className = "status paused";
    return;
  }

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const startMinutes = getWorkStartMinutes();
  const endMinutes = getWorkEndMinutes();

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    status.textContent = "Acumulando agora";
    status.className = "status active";
  } else {
    status.textContent = "Fora do expediente";
    status.className = "status paused";
  }
}

    function calculateINSS(salary) {
      let contribution = 0;
      let previousLimit = 0;
      const salaryBase = Math.min(salary, INSS_TABLE_2026[INSS_TABLE_2026.length - 1].limit);

      for (const bracket of INSS_TABLE_2026) {
        if (salaryBase > previousLimit) {
          const taxableAmount = Math.min(salaryBase, bracket.limit) - previousLimit;
          contribution += taxableAmount * bracket.rate;
          previousLimit = bracket.limit;
        }
      }

      return contribution;
    }

    function calculateBaseIRRF(salary, inss, dependents, pension, simplifiedMode) {
      const dependentDeduction = dependents * CLT_CONFIG.dependentDeduction;
      const legalDeductions = inss + dependentDeduction + pension;

      let deductionUsed = legalDeductions;

      if (simplifiedMode === "auto") {
        deductionUsed = Math.max(legalDeductions, CLT_CONFIG.simplifiedDeductionLimit);
      }

      return Math.max(salary - deductionUsed, 0);
    }

    function calculateIRRF(base) {
      const bracket = IRRF_TABLE_2026.find(item => base >= item.min && base <= item.max);

      if (!bracket || bracket.rate === 0) {
        return 0;
      }

      const standardTax = Math.max((base * bracket.rate) - bracket.deduction, 0);
      const reduction = calculateIRRFReduction(base);

      return Math.max(standardTax - reduction, 0);
    }

    function calculateIRRFReduction(base) {
      if (base <= 5000) {
        return 312.89;
      }

      if (base > 5000 && base <= 7350) {
        return Math.max(978.62 - (0.133145 * base), 0);
      }

      return 0;
    }

    function calculateCLT(year = new Date().getFullYear(), month = new Date().getMonth()) {
      const salary = CLT_CONFIG.salary;

      const dependents = Number(document.getElementById("dependentsInput")?.value || CLT_CONFIG.defaultDependents);
      const pension = Number(document.getElementById("pensionInput")?.value || 0);
      const healthCopay = Number(document.getElementById("healthCopayInput")?.value || 0);
      const transportRate = Number(document.getElementById("transportInput")?.value || 0);
      const simplifiedMode = document.getElementById("simplifiedInput")?.value || "auto";

      const inss = calculateINSS(salary);
      const baseIRRF = calculateBaseIRRF(salary, inss, dependents, pension, simplifiedMode);
      const irrf = calculateIRRF(baseIRRF);
      const transport = salary * transportRate;

      const netSalary = salary - inss - irrf - transport - healthCopay;

      const benefits = incomeItems
        .filter(item => item.id !== "salary")
        .reduce((sum, item) => sum + item.amount, 0);

      const grossTotal = incomeItems.reduce((sum, item) => sum + item.amount, 0);
      const netTotal = netSalary + benefits;

      const netRates = getRates(netTotal, year, month);

      return {
        salary,
        dependents,
        pension,
        healthCopay,
        transportRate,
        inss,
        baseIRRF,
        irrf,
        transport,
        netSalary,
        benefits,
        grossTotal,
        netTotal,
        netRates
      };
    }

    function renderCLT() {
      const clt = calculateCLT();

      document.getElementById("grossSalaryValue").textContent = formatBRL(clt.salary);
      document.getElementById("inssValue").textContent = `- ${formatBRL(clt.inss)}`;
      document.getElementById("irrfValue").textContent = `- ${formatBRL(clt.irrf)}`;
      document.getElementById("transportValue").textContent = `- ${formatBRL(clt.transport)}`;
      document.getElementById("healthCopayValue").textContent = `- ${formatBRL(clt.healthCopay)}`;
      document.getElementById("netSalaryValue").textContent = formatBRL(clt.netSalary);
      document.getElementById("netTotalValue").textContent = formatBRL(clt.netTotal);
      document.getElementById("netSecondValue").textContent = formatBRLPrecise(clt.netRates.second);
    }

    function updateDailyAccumulator() {
  const now = new Date();
  const secondsWorked = getSecondsWorkedToday(now);
  const secondsPerWorkDay = getWorkSecondsPerDay();

  const progress = secondsPerWorkDay > 0
    ? Math.min((secondsWorked / secondsPerWorkDay) * 100, 100)
    : 0;

  let totalAccumulated = 0;
  let accumulatedByItem = {};

  incomeItems.forEach(item => {
    const rates = getRates(item.amount, now.getFullYear(), now.getMonth());
    const accumulated = rates.second * secondsWorked;

    accumulatedByItem[item.id] = accumulated;
    totalAccumulated += accumulated;
  });

  document.getElementById("accumulatorValue").textContent = formatBRL(totalAccumulated);
  document.getElementById("accSalary").textContent = formatBRL(accumulatedByItem.salary || 0);
  document.getElementById("accVR").textContent = formatBRL(accumulatedByItem.vr || 0);
  document.getElementById("accVA").textContent = formatBRL(accumulatedByItem.va || 0);

  const accHomeElement = document.getElementById("accHome");

  if (accHomeElement) {
    accHomeElement.textContent = formatBRL(accumulatedByItem.home || 0);
  }

  document.getElementById("progressFill").style.width = `${progress}%`;
  document.getElementById("progressPercent").textContent = `${progress.toFixed(1)}%`;

  document.getElementById("currentTime").textContent =
    `Horário atual: ${now.toLocaleTimeString("pt-BR")} | Dias de trabalho no mês: ${getBusinessDaysInCurrentMonth()} | Jornada: ${financeRuntimeConfig.horaInicio} às ${financeRuntimeConfig.horaFim}`;

  getWorkStatus(now);
}

    function updateMonthlyAccumulator() {
  const now = new Date();
  const clt = calculateCLT(now.getFullYear(), now.getMonth());

  const secondsWorkedInMonth = getSecondsWorkedInCurrentMonth(now);
  const totalBusinessDaysMonth = getBusinessDaysInMonth(now.getFullYear(), now.getMonth());
  const totalSecondsMonth = totalBusinessDaysMonth * getWorkSecondsPerDay();

  const monthlyProgress = totalSecondsMonth > 0
    ? Math.min(secondsWorkedInMonth / totalSecondsMonth, 1)
    : 0;

  const estimatedMonthlyNetAccumulated = clt.netTotal * monthlyProgress;

  document.getElementById("monthlyNetAccumulator").textContent = formatBRL(estimatedMonthlyNetAccumulated);

  document.getElementById("monthlyAccumulatorInfo").textContent =
    `Progresso estimado do mês: ${(monthlyProgress * 100).toFixed(1)}% | ${totalBusinessDaysMonth} dias de trabalho | Jornada ${financeRuntimeConfig.horaInicio} às ${financeRuntimeConfig.horaFim}`;
}

    function getMonthLabel(year, month) {
      const date = new Date(year, month, 1);

      return date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
      });
    }

    function renderEstimatedHistory() {
      const tbody = document.getElementById("historyTableBody");
      const now = new Date();

      const rows = [];
      const monthsBack = 12;

      for (let i = 1; i <= monthsBack; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const clt = calculateCLT(year, month);
        const businessDays = getBusinessDaysInMonth(year, month);

        rows.push({
          label: getMonthLabel(year, month),
          grossTotal: clt.grossTotal,
          netTotal: clt.netTotal,
          inss: clt.inss,
          irrf: clt.irrf,
          transport: clt.transport,
          healthCopay: clt.healthCopay,
          businessDays,
          status: "Fechado estimado"
        });
      }

      if (!rows.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9">Nenhum histórico disponível.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = rows.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${formatBRL(item.grossTotal)}</td>
          <td>${formatBRL(item.netTotal)}</td>
          <td>${formatBRL(item.inss)}</td>
          <td>${formatBRL(item.irrf)}</td>
          <td>${formatBRL(item.transport)}</td>
          <td>${formatBRL(item.healthCopay)}</td>
          <td>${item.businessDays}</td>
          <td>${item.status}</td>
        </tr>
      `).join("");
    }

    function setupCLTListeners() {
      const fields = [
        "dependentsInput",
        "pensionInput",
        "healthCopayInput",
        "transportInput",
        "simplifiedInput"
      ];

      fields.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
          element.addEventListener("input", refreshAll);
          element.addEventListener("change", refreshAll);
        }
      });
    }

    function refreshAll() {
      renderSummary();
      renderCards();
      renderCLT();
      updateDailyAccumulator();
      updateMonthlyAccumulator();
      renderEstimatedHistory();
    }

    setupCLTListeners();

window.addEventListener("financeHubDataLoaded", function () {
  const config = obterConfiguracaoFinanceiraUsuario();

  if (!config) {
    return;
  }

  console.log("Dados financeiros carregados no painel:", config);

  aplicarDadosUsuarioNoPainel(config);
});

setInterval(() => {
  updateDailyAccumulator();
  updateMonthlyAccumulator();
}, 1000);

function horarioParaMinutos(horario) {
  const partes = horario.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

function usuarioTrabalhaHoje(dataAtual, config) {
  const diaSemana = dataAtual.getDay();
  return config.diasTrabalho.includes(diaSemana);
}

function calcularProgressoJornadaHoje(config) {
  const agora = new Date();

  if (!usuarioTrabalhaHoje(agora, config)) {
    return {
      trabalhandoHoje: false,
      percentual: 0,
      minutosTrabalhados: 0,
      minutosTotais: 0
    };
  }

  const minutosInicio = horarioParaMinutos(config.horaInicio);
  const minutosFim = horarioParaMinutos(config.horaFim);

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const minutosTotais = Math.max(0, minutosFim - minutosInicio);

  let minutosTrabalhados = minutosAgora - minutosInicio;

  if (minutosTrabalhados < 0) {
    minutosTrabalhados = 0;
  }

  if (minutosTrabalhados > minutosTotais) {
    minutosTrabalhados = minutosTotais;
  }

  const percentual = minutosTotais > 0
    ? minutosTrabalhados / minutosTotais
    : 0;

  return {
    trabalhandoHoje: true,
    percentual,
    minutosTrabalhados,
    minutosTotais
  };
}