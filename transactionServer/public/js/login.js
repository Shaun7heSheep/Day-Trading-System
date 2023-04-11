const form = document.getElementById("userIdForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const userID = document.getElementById("userID").value;
    axios.post("/daytrading/users", {
        userID: userID,
        amount: 0
    })
    .then(function(res) {
        const { userID, balance } = res.data;
        window.location.replace(`/daytrading/${userID}/trading?balance=${balance}`);
    })
    .catch((err) => {
        console.error(`Axios error: ${err}`)
    })
    
})

