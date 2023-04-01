const form = document.getElementById("userIdForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const userID = document.getElementById("userID").value;
    window.location.replace(`/daytrading/${userID}/trading`);
})

