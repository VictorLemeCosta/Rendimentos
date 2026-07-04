const STORAGE_KEYS_INVEST = {

    BTC_BALANCE: "financehub_btc_balance",

    INVESTMENTS: "financehub_investments"
};

let btcBalance = 0.00341412;

let BTC_BRL_PRICE =
    parseFloat(
        localStorage.getItem("btcPrice")
    ) || 600000;

let BTC_USD_PRICE =
    parseFloat(
        localStorage.getItem("btcUsdPrice")
    ) || 110000;

let investments = [

    {
        ticker: "MXRF12",
        type: "FII",
        quantity: 1,
        amount: 21.60
    },

    {
        ticker: "BTLG11",
        type: "FII",
        quantity: 1,
        amount: 97.76
    },

    {
        ticker: "MXRF11",
        type: "FII",
        quantity: 5,
        amount: 32.00
    }

];

let investmentChart = null;

function saveInvestments() {

    saveToStorage(
        STORAGE_KEYS_INVEST.BTC_BALANCE,
        btcBalance
    );

    saveToStorage(
        STORAGE_KEYS_INVEST.INVESTMENTS,
        investments
    );
}

function loadInvestments() {

    const storedBTC =
        loadFromStorage(
            STORAGE_KEYS_INVEST.BTC_BALANCE,
            btcBalance
        );

    const storedInvestments =
        loadFromStorage(
            STORAGE_KEYS_INVEST.INVESTMENTS,
            investments
        );

    btcBalance =
        safeNumber(storedBTC);

    investments =
        storedInvestments || [];
}


function formatBRL(value){

    return Number(value).toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );
}

function formatUSD(value){

    return Number(value).toLocaleString(
        "en-US",
        {
            style:"currency",
            currency:"USD"
        }
    );
}

function addBTC(){

    const value =
        Number(
            document.getElementById(
                "btcAdd"
            ).value || 0
        );

    btcBalance += value;

    saveInvestments();

    refreshInvestmentDashboard();

    document.getElementById(
        "btcAdd"
    ).value = "";
}

function removeBTC(){

    const value =
        Number(
            document.getElementById(
                "btcRemove"
            ).value || 0
        );

    btcBalance -= value;

    if(btcBalance < 0){

        btcBalance = 0;
    }

    saveInvestments();

    refreshInvestmentDashboard();

    document.getElementById(
        "btcRemove"
    ).value = "";
}

function refreshBitcoin(){

    document.getElementById(
        "btcBalance"
    ).textContent =
        btcBalance.toFixed(8) + " BTC";

    const btcBRL =
        btcBalance *
        BTC_BRL_PRICE;

    const btcUSD =
        btcBalance *
        BTC_USD_PRICE;

    document.getElementById(
        "btcBRL"
    ).textContent =
        formatBRL(btcBRL);

    document.getElementById(
        "btcUSD"
    ).textContent =
        formatUSD(btcUSD);

    document.getElementById(
        "cryptoPatrimony"
    ).textContent =
        formatBRL(btcBRL);

document.getElementById(
    "btcPriceBRL"
).textContent =
    formatBRL(BTC_BRL_PRICE);

document.getElementById(
    "btcPriceUSD"
).textContent =
    formatUSD(BTC_USD_PRICE);

}

function addInvestment(){

    const ticker =
        document.getElementById(
            "newTicker"
        ).value;

    const type =
        document.getElementById(
            "newType"
        ).value;

    const quantity =
        Number(
            document.getElementById(
                "newQuantity"
            ).value
        );

    const amount =
        Number(
            document.getElementById(
                "newAmount"
            ).value
        );

    if(!ticker || amount <= 0){

        return;
    }

    investments.push({

    id: generateId(),

    ticker,

    type,

    quantity: safeNumber(quantity),

    amount: safeNumber(amount)
});

    saveInvestments();

    renderInvestments();

    refreshInvestmentDashboard();

    clearInvestmentForm();
}

function clearInvestmentForm(){

    document.getElementById(
        "newTicker"
    ).value = "";

    document.getElementById(
        "newQuantity"
    ).value = "";

    document.getElementById(
        "newAmount"
    ).value = "";
}

function renderInvestments(){

    const tbody =
        document.getElementById(
            "investmentTable"
        );

    tbody.innerHTML = "";

    investments.forEach(item => {

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>${item.ticker}</td>

            <td>${item.type}</td>

            <td>${item.quantity}</td>

            <td>${formatBRL(item.amount)}</td>

        `;

        tbody.appendChild(tr);
    });
}

function refreshInvestmentDashboard(){

    refreshBitcoin();

    const totalInvested =
    calculatePatrimony(
        investments
    );

document.getElementById(
    "assetCount"
).textContent =
    calculateAssetCount(
        investments
    );


    drawInvestmentChart();
}


function drawInvestmentChart(){

    const ctx =
        document
        .getElementById(
            "investmentPieChart"
        )
        .getContext("2d");

    destroyChart(
    investmentChart
);

    investmentChart =
        new Chart(ctx, {

            type:"pie",

            data:{

                labels:
                    investments.map(
                        i => i.ticker
                    ),

                datasets:[{

                    data:
                        investments.map(
                            i => i.amount
                        ),

                    backgroundColor: PIE_COLORS

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


function initializeInvestments(){

    loadInvestments();

    renderInvestments();

    refreshInvestmentDashboard();
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeInvestments();

        await updateBTCPrice();

        setInterval(
            async () => {

                await updateBTCPrice();

            },
            60000
        );

    }
);

async function updateBTCPrice(){

    try{

        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd"
        );

        const data = await response.json();

        localStorage.setItem(
            "btcPrice",
            data.bitcoin.brl
        );

        localStorage.setItem(
            "btcUsdPrice",
            data.bitcoin.usd
        );

        BTC_BRL_PRICE = data.bitcoin.brl;
BTC_USD_PRICE = data.bitcoin.usd;

console.log(
    "NOVA VARIAVEL:",
    BTC_BRL_PRICE
);
        
        console.log(
    "API:",
    data.bitcoin.brl
);

        console.log(
            "CONST:",
            BTC_BRL_PRICE
        );


        refreshInvestmentDashboard();

    }catch(error){

        console.error(
            "Erro ao atualizar cotação BTC",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeInvestments();

        await updateBTCPrice();

        setInterval(
            updateBTCPrice,
            60000
        );

    }
);