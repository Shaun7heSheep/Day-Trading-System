document.getElementById("summary-link").addEventListener("click", function(event) {
    event.preventDefault();
    
    axios.post("/daytrading/display_summary", {
        userID: userID
    })
    .then(function(res) {
        const { transactions } = res.data;
        
        axios.post(`/daytrading/${userID}/middle`, {
            transactions: transactions
        })
        .then(function(res) {
            window.location.href = document.getElementById('summary-link').getAttribute('href');
        })
    })
});
  
document.addEventListener("DOMContentLoaded", function () {
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    dropdownToggle.addEventListener("click", function () {
        const dropdownMenu = dropdownToggle.nextElementSibling;
        if (dropdownMenu.style.display === "block") {
            dropdownMenu.style.display = "none";
        } else {
            dropdownMenu.style.display = "block";
        }
    });
});