const form = document.getElementById("symbolForm");
const userID = document.title;

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const symbol = document.getElementById("symbol").value;

    window.location.replace(`/daytrading/${userID}/trading/${symbol}`);
})

