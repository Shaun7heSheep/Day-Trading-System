const form = document.getElementById("amountForm");
const userID = document.title;

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const amount = document.getElementById("amount").value;
    axios.post("/users", {
        userID: userID,
        amount: amount
    })
    .then(function(res) {
        const { userID, balance } = res.data;
        window.location.replace(`/daytrading/${userID}/addbalance?balance=${balance}`);
    })
    .catch((err) => {
        console.error(`Axios error: ${err}`)
    })
    
})

