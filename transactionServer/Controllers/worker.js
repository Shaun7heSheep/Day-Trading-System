const { parentPort } = require("worker_threads");
const net = require("net");

if (parentPort) {
    parentPort.on("message", (message) => {
        // console.log(`Received message from main thread `, message)
        setInterval(() => {
            const client = net.createConnection({
                host: "quoteserve.seng.uvic.ca",
                port: 4444,
            });
            client.on("connect", () => {
                console.log("Connected to quoteserver");
                client.write(message);
            });

            client.on("data", (data) => {
                var response = data.toString("utf-8");
                var arr = response.split(",");
                const currentStockPrice = arr[0];
                parentPort.postMessage(currentStockPrice);
            });
            client.on("error", (err) => {
                console.log("error")
            });
        }, 2000)
    })
} else {
    console.log("could not connect to parent thread");
}
