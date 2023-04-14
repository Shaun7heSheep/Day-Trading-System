const form = document.getElementById("dumplogForm");
const userID = document.title;

form.addEventListener("submit", function (event) {
    event.preventDefault();
    const filename = document.getElementById("dumplog").value;
    if (userID === "admin") {
        window.location.replace(`/daytrading/dump?filename=${filename}`);
    } else {
        window.location.replace(`/daytrading/dump?userID=${userID}&filename=${filename}`);
    }
})

