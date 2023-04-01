const form = document.getElementById("userIdForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const userID = document.getElementById("userID").value;
    const amount = document.getElementById("amount").value;
    axios.post("/users", {
        userID: userID,
        amount: amount
    })
        .then(function (res) {
            const { userID, balance } = res.data;
            window.location.replace(`/daytrading/home?userID=${userID}&balance=${balance}`);
        })
        .catch((err) => {
            console.error(`Axios error: ${err.response.data}`)
        })
})

