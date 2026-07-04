const STORAGE_KEYS = {

    STARTING_BALANCE: "financehub_starting_balance",

    INCOMES: "financehub_incomes",

    EXPENSES: "financehub_expenses"
};

let incomes = [];
let expenses = [];
let expensePieChart = null;
let incomePieChart = null;
let balanceChart = null;

function formatBRL(value){

    return Number(value).toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );
}

function saveStartingBalance(){

    const value =
        Number(
            document.getElementById(
                "startingBalance"
            ).value || 0
        );

    localStorage.setItem(
        STORAGE_KEYS.STARTING_BALANCE,
        value
    );

    recalculateDashboard();
}

function getStartingBalance(){

    return Number(
        localStorage.getItem(
            STORAGE_KEYS.STARTING_BALANCE
        ) || 0
    );
}

function addIncome(){

    const category =
        document.getElementById(
            "incomeCategory"
        ).value;

    const value =
        Number(
            document.getElementById(
                "incomeValue"
            ).value
        );

    const date =
        document.getElementById(
            "incomeDate"
        ).value;

    if(!value || value <= 0){

        alert("Informe um valor válido.");

        return;
    }

    incomes.push({

        id: Date.now(),

        category,

        value,

        date

    });

    persistData();

    renderIncomeTable();

    recalculateDashboard();

    clearIncomeForm();
}

function addExpense(){

    const category =
        document.getElementById(
            "expenseCategory"
        ).value;

    const value =
        Number(
            document.getElementById(
                "expenseValue"
            ).value
        );

    const date =
        document.getElementById(
            "expenseDate"
        ).value;

    if(!value || value <= 0){

        alert("Informe um valor válido.");

        return;
    }

    expenses.push({

        id: Date.now(),

        category,

        value,

        date

    });

    persistData();

    renderExpenseTable();

    recalculateDashboard();

    clearExpenseForm();
}

function clearIncomeForm(){

    document.getElementById(
        "incomeValue"
    ).value = "";

}

function clearExpenseForm(){

    document.getElementById(
        "expenseValue"
    ).value = "";

}

function persistData(){

    localStorage.setItem(

        STORAGE_KEYS.INCOMES,

        JSON.stringify(incomes)
    );

    localStorage.setItem(

        STORAGE_KEYS.EXPENSES,

        JSON.stringify(expenses)
    );
}

function loadData(){

    incomes =
        JSON.parse(
            localStorage.getItem(
                STORAGE_KEYS.INCOMES
            ) || "[]"
        );

    expenses =
        JSON.parse(
            localStorage.getItem(
                STORAGE_KEYS.EXPENSES
            ) || "[]"
        );
}

function removeIncome(id){

    incomes =
        incomes.filter(
            item => item.id !== id
        );

    persistData();

    renderIncomeTable();

    recalculateDashboard();
}

function removeExpense(id){

    expenses =
        expenses.filter(
            item => item.id !== id
        );

    persistData();

    renderExpenseTable();

    recalculateDashboard();
}

function renderIncomeTable(){

    const tbody =
        document.getElementById(
            "incomeTable"
        );

    tbody.innerHTML = "";

    incomes
        .sort(
            (a,b) => b.id - a.id
        )
        .forEach(item => {

            const row =
            document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${item.category}
                </td>

                <td class="receita">
                    ${formatBRL(item.value)}
                </td>

                <td>
                    ${item.date || "-"}
                </td>

                <td>

                    <button
                        class="btn"
                        onclick="removeIncome(${item.id})">

                        Excluir

                    </button>

                </td>
            `;

            tbody.appendChild(row);

        });
}

function renderExpenseTable(){

    const tbody =
        document.getElementById(
            "expenseTable"
        );

    tbody.innerHTML = "";

    expenses
        .sort(
            (a,b)=> b.id - a.id
        )
        .forEach(item => {

            const row =
            document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${item.category}
                </td>

                <td class="despesa">
                    ${formatBRL(item.value)}
                </td>

                <td>
                    ${item.date || "-"}
                </td>

                <td>

                    <button
                        class="btn"
                        onclick="removeExpense(${item.id})">

                        Excluir

                    </button>

                </td>
            `;

            tbody.appendChild(row);

        });
}

function recalculateDashboard(){

    const startingBalance =
        getStartingBalance();

    const totalIncome =
        incomes.reduce(
            (sum,item)=>sum + item.value,
            0
        );

    const totalExpenses =
        expenses.reduce(
            (sum,item)=>sum + item.value,
            0
        );

    const currentBalance =
        startingBalance +
        totalIncome -
        totalExpenses;

    document.getElementById(
        "currentBalance"
    ).textContent =
        formatBRL(currentBalance);

    document.getElementById(
        "totalIncome"
    ).textContent =
        formatBRL(totalIncome);

    document.getElementById(
        "totalExpenses"
    ).textContent =
        formatBRL(totalExpenses);

    document.getElementById(
        "monthlyIncome"
    ).textContent =
        formatBRL(totalIncome);

    document.getElementById(
        "monthlyExpense"
    ).textContent =
        formatBRL(totalExpenses);

    document.getElementById(
        "monthlyDifference"
    ).textContent =
        formatBRL(
            totalIncome -
            totalExpenses
        );

    const savingsRate =
        totalIncome > 0
        ?
        (
            (
                totalIncome -
                totalExpenses
            )
            / totalIncome
        ) * 100
        :
        0;

    document.getElementById(
        "savingPercentage"
    ).textContent =
        `${savingsRate.toFixed(1)}%`;

    document.getElementById(
        "savingsRate"
    ).textContent =
        `${savingsRate.toFixed(1)}%`;

        
    renderIncomeCategories();
    renderExpenseCategories();

    drawExpensePieChart();
    drawIncomePieChart();
    drawBalanceChart();


}

function drawExpensePieChart(){

    const data = window.expenseCategoryData || {};

    const labels = Object.keys(data);

    const values = Object.values(data);

    const ctx =
        document
        .getElementById("expensePieChart")
        .getContext("2d");

    if(expensePieChart){
        expensePieChart.destroy();
    }

    expensePieChart =
        new Chart(ctx, {

            type:"pie",

            data:{

                labels,

                datasets:[{

                    data: values,

                    backgroundColor:[
                        "#EF4444",
                        "#F97316",
                        "#FACC15",
                        "#22C55E",
                        "#3B82F6",
                        "#8B5CF6",
                        "#EC4899",
                        "#14B8A6"
                    ]
                }]
            },

            options:{
                responsive:true,
                plugins:{
                    legend:{
                        position:"bottom"
                    }
                }
            }
        });
}

function drawIncomePieChart(){

    const data = window.incomeCategoryData || {};

    const labels = Object.keys(data);

    const values = Object.values(data);

    const ctx =
        document
        .getElementById("incomePieChart")
        .getContext("2d");

    if(incomePieChart){
        incomePieChart.destroy();
    }

    incomePieChart =
        new Chart(ctx, {

            type:"pie",

            data:{

                labels,

                datasets:[{

                    data: values,

                    backgroundColor:[

                        "#16A34A",
                        "#0284C7",
                        "#820AD1",
                        "#F28C28",
                        "#22C55E",
                        "#14B8A6"

                    ]

                }]
            },

            options:{

                responsive:true,

                plugins:{

                    legend:{
                        position:"bottom"
                    }
                }
            }
        });
}

function drawBalanceChart(){

    const startingBalance =
        getStartingBalance();

    const dates = [];

    const balances = [];

    let runningBalance =
        startingBalance;

    const transactions = [];

    incomes.forEach(item => {

        transactions.push({

            date:item.date,

            value:item.value

        });

    });

    expenses.forEach(item => {

        transactions.push({

            date:item.date,

            value:-item.value

        });

    });

    transactions.sort((a,b)=>
        new Date(a.date)
        -
        new Date(b.date)
    );

    transactions.forEach(item=>{

        runningBalance += item.value;

        dates.push(item.date || "Sem data");

        balances.push(runningBalance);

    });

    const ctx =
        document
        .getElementById("balanceChart")
        .getContext("2d");

    if(balanceChart){
        balanceChart.destroy();
    }

    balanceChart =
        new Chart(ctx,{

            type:"line",

            data:{

                labels:dates,

                datasets:[{

                    label:"Saldo",

                    data:balances,

                    borderColor:"#003B71",

                    backgroundColor:"rgba(0,59,113,.15)",

                    fill:true,

                    tension:.4

                }]
            },

            options:{

                responsive:true,

                maintainAspectRatio:false
            }
        });
}

function renderIncomeCategories(){

    const categories = {};

    incomes.forEach(item => {

        if(!categories[item.category]){

            categories[item.category] = 0;
        }

        categories[item.category] += item.value;

    });

    window.incomeCategoryData =
        categories;
}

function renderExpenseCategories(){

    const categories = {};

    expenses.forEach(item => {

        if(!categories[item.category]){

            categories[item.category] = 0;
        }

        categories[item.category] += item.value;

    });

    window.expenseCategoryData =
        categories;
}

function getFinanceStatistics(){

    const totalIncome =
        incomes.reduce(
            (sum,item)=>sum + item.value,
            0
        );

    const totalExpenses =
        expenses.reduce(
            (sum,item)=>sum + item.value,
            0
        );

    const balance =
        getStartingBalance()
        +
        totalIncome
        -
        totalExpenses;

    return {

        balance,

        totalIncome,

        totalExpenses
    };
}

async function synchronizeOpenFinance(){

    console.log(
        "Integração Open Finance ainda não implementada."
    );

}

function classifyTransaction(description){

    const text =
        description.toLowerCase();

    if(text.includes("enel"))
        return "Luz";

    if(text.includes("sabesp"))
        return "Água";

    if(text.includes("vivo"))
        return "Internet";

    if(text.includes("claro"))
        return "Internet";

    if(text.includes("netflix"))
        return "Assinaturas";

    if(text.includes("spotify"))
        return "Assinaturas";

    if(text.includes("ifood"))
        return "Restaurante";

    if(text.includes("uber"))
        return "Transporte";

    if(text.includes("99"))
        return "Transporte";

    if(text.includes("droga"))
        return "Farmácia";

    if(text.includes("farmacia"))
        return "Farmácia";

    if(text.includes("carrefour"))
        return "Mercado";

    if(text.includes("extra"))
        return "Mercado";

    if(text.includes("assai"))
        return "Mercado";

    if(text.includes("atacadao"))
        return "Mercado";

    return "Outros";
}

function initializeFinanceHub(){

    loadData();

    document.getElementById(
        "startingBalance"
    ).value =
        getStartingBalance();

    renderIncomeTable();

    renderExpenseTable();

    recalculateDashboard();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeFinanceHub
);

function resetStartingBalance(){

    if(
        !confirm(
            "Deseja realmente zerar o saldo inicial?"
        )
    ){
        return;
    }

    // Salva explicitamente zero
    localStorage.setItem(
        STORAGE_KEYS.STARTING_BALANCE,
        0
    );

    // Atualiza campo
    document.getElementById(
        "startingBalance"
    ).value = 0;

    // Atualiza dashboard
    recalculateDashboard();

    console.log(
        "Saldo inicial resetado."
    );
}