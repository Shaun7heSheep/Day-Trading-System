const form = document.getElementById("symbolForm");
const userID = document.title;

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const symbol = document.getElementById("symbol").value;

    axios.get(`/daytrading/stockaccount?userID=${userID}&symbol=${symbol}`)
    .then(function (response) {
        const { quantity } = response.data;
        window.location.replace(`/daytrading/${userID}/trading/${symbol}?quantity=${quantity}`);
    })
    .catch((err) => {
        console.error(`Axios error: ${err}`)
    })
})

