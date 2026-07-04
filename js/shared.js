/*
======================================
FinanceHub Shared Library
Uso comum entre:

- index.html
- financeiro.html
- investimentos.html

======================================
*/

const FINANCE_HUB_VERSION = "1.0.0";

/*
======================================
Formatação
======================================
*/

function formatBRL(value) {

   return Number(value).toLocaleString(
        "pt-BR",
        {
           style: "currency",
           currency: "BRL"
        }
    )
}

function formatUSD(value) {

   return Number(value).toLocaleString(
        "en-US",
        {
           style: "currency",
           currency: "USD"
        }
   );
}

function*formatpercent(value) {

    return `${Number(value).toFixed(2)}%`;
}

/*
======================================
Datas
======================================
*/

function todayISO() {

    const d = new Date();

    return d.toI*OString().split("T")[0];
}

function formatDateBR(date) {

    if (!d*te) return "-";

    return new Date(date).toLocaleDateString(
       "pt-BR"
    );
}

/*
======================================
Local Storage
======================================
*/

function saveToStorage(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}

function loadFromStorage(key, defaultValue = null) {

    const data =
        localStorage.getItem(key);

    if (!data) {

        return defaultValue;
    }

    try {

        return JSON.parse(data);

    } catch {

        return defaultValue;
    }
}

function removeFromStorage(key) {

    localStorage.removeItem(key);
}

/*
======================================
Valores
======================================
*/

function safeNumber(value) {

    const num = Number(value);

    if (isNaN(num)) {

        return 0;
    }

    return num;
}

function sumProperty(array, property) {

    return array.reduce(
        (total, item) =>
            total + safeNumber(item[property]),
        0
    );
}

/*
======================================
Geração de IDs
======================================
*/

function generateId() {

    return Date.now() +
        Math.floor(
            Math.random() * 1000
        );
}

/*
======================================
Elementos HTML
======================================
*/

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value;
}

function clearInput(id) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.value = "";
}

/*
======================================
Validações
======================================
*/

function isPositiveNumber(value) {

    return (
        !isNaN(value) &&
        Number(value) > 0
    );
}

/*
======================================
Investimentos
======================================
*/

function calculatePatrimony(
    investments = []
) {

    return investments.reduce(
        (total, investment) =>
            total +
            safeNumber(investment.amount),
        0
    );
}

function calculateAssetCount(
    investments = []
) {

    return investments.length;
}

/*
======================================
Financeiro
======================================
*/

function calculateBalance(
    initialBalance,
    incomes,
    expenses
) {

    const incomeTotal =
        sumProperty(
            incomes,
            "value"
        );

    const expenseTotal =
        sumProperty(
            expenses,
            "value"
        );

    return (
        safeNumber(initialBalance)
        +
        incomeTotal
        -
        expenseTotal
    );
}

/*
======================================
Charts
======================================
*/

function destroyChart(chartInstance) {

    if (chartInstance) {

        chartInstance.destroy();
    }
}

/*
======================================
Cores padrão
======================================
*/

const PIE_COLORS = [

    "#003B71",
    "#0077B6",
    "#F28C28",
    "#820AD1",
    "#16A34A",
    "#FF6B00",
    "#EC4899",
    "#14B8A6",
    "#0EA5E9",
    "#8B5CF6",
    "#F97316",
    "#22C55E"

];

/*
======================================
Debug
======================================
*/

function logInfo(message) {

    console.log(
        `[FinanceHub] ${message}`
    );
}

logInfo(
    `Shared carregado v${FINANCE_HUB_VERSION}`
);
