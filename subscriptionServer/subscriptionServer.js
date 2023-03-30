const net = require("net");
const redis = require("redis");
const publisher = redis.createClient({
    host: "localhost",
    port: 6379,
});

const subscriptions = {};
// Create a server
const server = net.createServer((socket) => {
    publisher.connect();
    // Quote every stock in the dict every 10 seconds
    setInterval(() => {
        console.log(`Checking: ${Object.keys(subscriptions).length}`);
        if (Object.keys(subscriptions).length > 0) {

            Object.keys(subscriptions).forEach((symbol) => {
                const client = net.createConnection({
                    host: "quoteserve.seng.uvic.ca",
                    port: 4444,
                });
                client.on("connect", () => {
                    console.log("Connected to quoteserver");
                    const quoteCommand = `${symbol},XIANYAO\n`;
                    client.write(quoteCommand);
                });

                client.on("data", async (data) => {
                    var response = data.toString("utf-8");
                    var arr = response.split(",");
                    const currentStockPrice = arr[0];
                    await publisher.publish(symbol, currentStockPrice)
                });
                client.on("error", (err) => {
                    console.log("error")
                });

            });
        }
    }, 10000);

    // Listen for data from client
    socket.on("data", (data) => {
        var response = data.toString("utf-8");
        const [command, userId, stockSymbol] = response.split(" ");

        if (command === "SUBSCRIBE") {
            if (subscriptions[stockSymbol]) {
                console.log(`${stockSymbol} +1 in dict`);
                subscriptions[stockSymbol] += 1;
            } else {
                console.log(`${stockSymbol} inserted in dict`);
                subscriptions[stockSymbol] = 1;
            }
        } else {
            if (subscriptions[stockSymbol]) {
                console.log(`${stockSymbol} -1 in dict`);
                subscriptions[stockSymbol] -= 1;
                console.log(`${stockSymbol}: ${subscriptions[stockSymbol]}`);
                if (subscriptions[stockSymbol] <= 0) {
                    console.log(`${stockSymbol} removed in dict`);
                    delete subscriptions[stockSymbol];
                }
            } else {
                socket.write(`No subscription for ${stockSymbol}`);
            }
        }
    });
});

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});
