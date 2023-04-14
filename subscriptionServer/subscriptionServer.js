const net = require("net");
const redis = require("redis");
const redisSub_addr = process.env.REDISSUB_ADDR || "localhost";
const redisSub_port = process.env.REDISSUB_PORT || 6378;
const redis_addr = process.env.REDIS_ADDR || "localhost";
const redis_port = process.env.REDIS_PORT || 6379;

const quoteserver_addr = process.env.QUOTESERVER_ADDR || '10.0.0.46';
const quoteserver_port = process.env.QUOTESERVER_PORT || 4444;

// for caching stock price
const cache = redis.createClient({socket: {host: redis_addr, port: redis_port}});
cache.connect();

// for caching number of subscribers
const cacheSub = redis.createClient({socket: {host: redisSub_addr, port: redisSub_port}});
cacheSub.connect();

// for publishing stock price
const publisher = cacheSub.duplicate();
publisher.connect();


setInterval(async () => {
    const subscriptions = await cacheSub.keys('sub_*');
    if (subscriptions.length > 0) {
        Promise.all(
            subscriptions.map(async (sub_key) => {
                var subscribers = await cacheSub.get(sub_key);
                if (subscribers > 0) {
                    var key_arr = sub_key.split('_')
                    var symbol = key_arr[1];

                    const client = net.createConnection({
                        //host: "quoteserve.seng.uvic.ca",
                        host: quoteserver_addr,
                        port: quoteserver_port
                    });
                    client.on("connect", () => {
                        const quoteCommand = `${symbol},subServer\n`;
                        client.write(quoteCommand);
                    });
                    client.on("error", (err) => {
                        console.log(err);
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
}, 45000);