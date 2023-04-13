const userID = document.title.split(' ')[0];
const action = document.title.split(' ')[1].toLowerCase();
const symbol = document.title.split(' ')[2];
const amount = document.getElementById("amount").textContent.trim().split(": ")[1];
const quantity = document.getElementById("quantity").textContent;


let secondsLeft = 60;
const timerElement = document.getElementById("timer");
const commitButton = document.querySelector('button[name="commit"]');
const cancelButton = document.querySelector('button[name="cancel"]');

const countdown = setInterval(() => {
  if (secondsLeft === 0) {
    axios.post(`/daytrading/${action}`, {
        userID: userID,
        symbol: symbol,
        amount: amount
    })
    .then((res) => {
        const { symbol, amount, price } = res.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}/commit${action}?amount=${amount}&price=${price}`);
    })
  } else {
    timerElement.textContent = `Time until new price: ${secondsLeft} second${secondsLeft > 1 ? 's' : ''}`;
    secondsLeft--;
  }
}, 1000);

commitButton.addEventListener("click", (event) => {
    event.preventDefault();
    axios.post(`/daytrading/commit_${action}`, {
        userID: userID
    })
    .then((res) => {
        const { numOfShares, balance } = res.data;
        let updatedQuantity = 0;
        if (action === "buy") {
            updatedQuantity = Number(quantity) + numOfShares;
        } else if (action === "sell") {
            updatedQuantity = Number(quantity) - numOfShares;
        }
        
        window.location.replace(`/daytrading/${userID}/trading/${symbol}?quantity=${updatedQuantity}&balance=${balance}`);
    })
});

cancelButton.addEventListener("click", (event) => {
    event.preventDefault();
    axios.post(`/daytrading/cancel_${action}`, {
        userID: userID
    })
    .then(() => {
        window.location.replace(`/daytrading/${userID}/trading/${symbol}`);
    })
})