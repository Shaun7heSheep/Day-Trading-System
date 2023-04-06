const net = require("net");
const redis = require("redis");
const redis_addr = process.env.REDIS_ADDR || "redis";
const redis_port = process.env.REDIS_PORT || 6379;

// for caching stock price
const cache = redis.createClient({socket: {host: redis_addr, port: redis_port}});
cache.connect();

/*const redis_node_1 = process.env.REDIS_NODE_1;
const redis_node_2 = process.env.REDIS_NODE_2;
const cluster = redis.createCluster({
    rootNodes:[
        {url: redis_node_1},
        {url: redis_node_2}
    ]
})*/

redisclient.connect();
//cluster.connect();

// for publishing stock price
const publisher = redisclient.duplicate();
publisher.connect();

// for listening to request
const subscriber = redisclient.duplicate();
subscriber.connect();

subscriber.subscribe("subscriptions", async (message) => {
    var request = message.toString("utf-8");
    const [command, userId, stockSymbol] = request.split(" ");

    var sub_key = `sub_${stockSymbol}`;
    if (command === "SUBSCRIBE") {
        cache.incr(sub_key);
        console.log(`${stockSymbol} subs +1`);
    } else {
        cache.decr(sub_key);
        console.log(`${stockSymbol} subs -1`);
    }
});


setInterval(async () => {
    const subscriptions = await cache.keys('sub_*');
    if (subscriptions.length > 0) {
        Promise.all(
            subscriptions.map(async (sub_key) => {
                var subscribers = await cache.get(sub_key);
                if (subscribers > 0) {
                    var key_arr = sub_key.split('_')
                    var symbol = key_arr[1];

                    const client = net.createConnection({
                        //host: "quoteserve.seng.uvic.ca",
                        host: "10.0.0.46",
                        port: 4444,
                    });
                    client.on("connect", () => {
                        const quoteCommand = `${symbol},subServer\n`;
                        client.write(quoteCommand);
                    });

                    client.on("data", async (data) => {
                        var response = data.toString("utf-8");
                        var arr = response.split(",");
                        cache.set(symbol, response, { EX: 60 });
                        publisher.publish(symbol, arr[0]);
                        console.log(`publish ${symbol} price: ${arr[0]}`);
                    });
                    client.on("error", (err) => {
                        console.log(err)
                    });
                } else {
                    cache.del(sub_key)
                }
            })
        )
    }
}, 10000);