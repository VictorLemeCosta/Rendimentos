const incomeItems = [
      {
        id: "salary",
        name: "Salário",
        amount: 6000.00,
        method: "Pago em conta Nubank",
        className: "nubank",
        emoji: "💜"
      },
      {
        id: "vr",
        name: "VR",
        amount: 1617.00,
        method: "Pago no cartão Caju",
        className: "caju",
        emoji: "🍊"
      },
      {
        id: "va",
        name: "VA",
        amount: 174.10,
        method: "Depositado no Nubank",
        className: "nubank",
        emoji: "💜"
      },
      {
        id: "home",
        name: "Auxílio Home Office",
        amount: 150.00,
        method: "Pago em conta Nubank",
        className: "nubank",
        emoji: "🏠"
      }
    ];

    const WORK_START_HOUR = 9;
    const WORK_END_HOUR = 18;
    const WORK_HOURS_PER_DAY = WORK_END_HOUR - WORK_START_HOUR;
    const SECONDS_PER_WORK_DAY = WORK_HOURS_PER_DAY * 60 * 60;

    const CLT_CONFIG = {
      salary: 6000.00,
      defaultDependents: 2,
      dependentDeduction: 189.59,
      simplifiedDeductionLimit: 607.20
    };

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
      const day = date.getDay();
      return day !== 0 && day !== 6;
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
      const perDay = amount / businessDays;
      const perHour = perDay / WORK_HOURS_PER_DAY;
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

      const start = new Date(now);
      start.setHours(WORK_START_HOUR, 0, 0, 0);

      const end = new Date(now);
      end.setHours(WORK_END_HOUR, 0, 0, 0);

      if (now < start) {
        return 0;
      }

      if (now >= end) {
        return SECONDS_PER_WORK_DAY;
      }

      return Math.floor((now - start) / 1000);
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

      return completedBusinessDays * SECONDS_PER_WORK_DAY + todaySeconds;
    }

    function getWorkStatus(now) {
      const status = document.getElementById("workStatus");

      if (!isBusinessDay(now)) {
        status.textContent = "Fora de dia útil";
        status.className = "status paused";
        return;
      }

      const hour = now.getHours();

      if (hour >= WORK_START_HOUR && hour < WORK_END_HOUR) {
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
      const progress = Math.min((secondsWorked / SECONDS_PER_WORK_DAY) * 100, 100);

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
      document.getElementById("accHome").textContent = formatBRL(accumulatedByItem.home || 0);

      document.getElementById("progressFill").style.width = `${progress}%`;
      document.getElementById("progressPercent").textContent = `${progress.toFixed(1)}%`;

      document.getElementById("currentTime").textContent =
        `Horário atual: ${now.toLocaleTimeString("pt-BR")} | Dias úteis no mês: ${getBusinessDaysInCurrentMonth()}`;

      getWorkStatus(now);
    }

    function updateMonthlyAccumulator() {
      const now = new Date();
      const clt = calculateCLT(now.getFullYear(), now.getMonth());

      const secondsWorkedInMonth = getSecondsWorkedInCurrentMonth(now);
      const totalBusinessDaysMonth = getBusinessDaysInMonth(now.getFullYear(), now.getMonth());
      const totalSecondsMonth = totalBusinessDaysMonth * SECONDS_PER_WORK_DAY;

      const monthlyProgress = Math.min(secondsWorkedInMonth / totalSecondsMonth, 1);
      const estimatedMonthlyNetAccumulated = clt.netTotal * monthlyProgress;

      document.getElementById("monthlyNetAccumulator").textContent = formatBRL(estimatedMonthlyNetAccumulated);

      document.getElementById("monthlyAccumulatorInfo").textContent =
        `Progresso estimado do mês: ${(monthlyProgress * 100).toFixed(1)}% | ${totalBusinessDaysMonth} dias úteis | Reset automático no próximo mês`;
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
    refreshAll();

    setInterval(() => {
      updateDailyAccumulator();
      updateMonthlyAccumulator();
    }, 1000);