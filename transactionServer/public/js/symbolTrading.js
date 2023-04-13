const userID = document.title;
const symbolElement = document.getElementById("symbol");
const symbol = symbolElement.textContent.trim();
const quantity = document.getElementById("quantity").textContent;
const balance = document.getElementById("balance").textContent;


const buyForm = document.getElementById("buy-form");
buyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const buyAmount = document.getElementById("buy").value;
    axios.post("/daytrading/buy", {
        userID: userID,
        symbol: symbol,
        amount: buyAmount
    })
    .then((res) => {
        const { symbol, amount, price } = res.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}/commitbuy?amount=${amount}&price=${price}&quantity=${quantity}`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

const sellForm = document.getElementById("sell-form");
sellForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const sellNumberOfShares = document.getElementById("sell").value;
    axios.post("/daytrading/sell", {
        userID: userID,
        symbol: symbol,
        amount: sellNumberOfShares
    })
    .then((res) => {
        const { symbol, amount, price } = res.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}/commitsell?amount=${amount}&price=${price}&quantity=${quantity}`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

const setBuyForm = document.getElementById("set-buy-form");
setBuyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const setBuyAmount = document.getElementById("set-buy").value;
    axios.post("/daytrading/set-buy-amount", {
        userID: userID,
        symbol: symbol,
        amount: setBuyAmount
    })
    .then((res) => {
        const { updatedBalance } = res.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}?balance=${updatedBalance}`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

const setSellForm = document.getElementById("set-sell-form");
setSellForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const setSellAmount = document.getElementById("set-sell").value;
    axios.post("/daytrading/set-sell-amount", {
        userID: userID,
        symbol: symbol,
        amount: setSellAmount
    })
    .then((res) => {
        const { updatedQuantity } = res.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}?quantity=${updatedQuantity}`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

const triggerBuyForm = document.getElementById("trigger-buy-form");
triggerBuyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const triggerBuyAmount = document.getElementById("trigger-buy").value;
    document.getElementById("buy").textContent = `${triggerBuyAmount}`;
    axios.post("/daytrading/set-buy-trigger", {
        userID: userID,
        symbol: symbol,
        amount: triggerBuyAmount
    })
    .then(async (res) => {
        const { message } = res.data;
        await showAlert(message);
        window.location.replace(`/daytrading/${userID}/trading`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

const triggerSellForm = document.getElementById("trigger-sell-form");
triggerSellForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const triggerSellAmount = document.getElementById("trigger-sell").value;
    document.getElementById("sell").textContent = `${triggerSellAmount}`;
    axios.post("/daytrading/set-sell-trigger", {
        userID: userID,
        symbol: symbol,
        amount: triggerSellAmount
    })
    .then(async (res) => {
        const { message, balance } = res.data;
        console.log(`Second testing: ${balance}`)
        await showAlert(message);
        window.location.replace(`/daytrading/${userID}/trading?balance=${balance}`);
    })
    .catch((error) => {
        alert(error.response.data)
    })
})

function showAlert(message) {
    return new Promise(function(resolve, reject) {
        window.alert(message);
        resolve();
    });
}

function removeRow(button, actionElement) {
    const action = actionElement.trim();
    axios.post(`/daytrading/cancel-set-${action}`, {
        symbol: symbol,
        userID: userID
    })
    .then((res) => {
        if (action === "buy") {
            const { updatedBalance } = res.data;
            window.location.replace(`/daytrading/${userID}/trading/${symbol}?balance=${updatedBalance}`);
        } else if (action ==="sell") {
            const { updatedQuantity } = res.data;
            window.location.replace(`/daytrading/${userID}/trading/${symbol}?quantity=${updatedQuantity}`);
        }
    })
}



