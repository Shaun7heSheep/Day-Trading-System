const net = require("net");
const redis = require("redis");
const subscriptionModel = require("./Model/subscriptionModel");
const cache = require("../transactionServer/Redis/redis_init")
const publisher = redis.createClient({
    host: "localhost",
    port: 6379,
});
publisher.connect();

// Create a server
const server = net.createServer((socket) => {
    // Quote every stock in the dict every 10 seconds
    setInterval(async () => {
        const subscriptions = await cache.keys('sub_*');
        if (subscriptions.length > 0) {
            Promise.all(
                subscriptions.map(async (sub_key) => {
                    var subscribers = await cache.get(sub_key);
                    if (subscribers > 0) {
                        var key_arr = sub_key.split('_')
                        var symbol = key_arr[0];

                        const client = net.createConnection({
                            host: "quoteserve.seng.uvic.ca",
                            port: 4444,
                        });
                        client.on("connect", () => {
                            const quoteCommand = `${symbol},XIANYAO\n`;
                            client.write(quoteCommand);
                        });

                        client.on("data", async (data) => {
                            var response = data.toString("utf-8");
                            var arr = response.split(",");
                            cache.set(symbol, response, { EX: 60 });
                            publisher.publish(symbol, arr[0]);
                        });
                        client.on("error", (err) => {
                            console.log("error")
                        });
                    }
                })
            )
        }
    }, 10000);

    // Listen for data from client
    socket.on("data", (data) => {
        var response = data.toString("utf-8");
        const [command, userId, stockSymbol] = response.split(" ");

        var sub_key = `sub_${stockSymbol}`;
        if (command === "SUBSCRIBE") {
            cache.incr(sub_key);
        } else {
            cache.decr(sub_key);
        }
    });
});

server.listen(4000, () => {
    console.log("Server listening on port 4000");
});
