const redis = require("redis");
const redis_addr = process.env.REDIS_ADDR || "redis";
const redis_port = process.env.REDIS_PORT || 6379;
const redisclient = redis.createClient({socket: {host: redis_addr, port: redis_port}});

/*const redis_node_1 = process.env.REDIS_NODE_1;
const redis_node_2 = process.env.REDIS_NODE_2;
const redis_node_3 = process.env.REDIS_NODE_3;
const redis_node_4 = process.env.REDIS_NODE_4;
const redis_node_5 = process.env.REDIS_NODE_5;
const redis_node_6 = process.env.REDIS_NODE_6;
const cluster = redis.createCluster({
    rootNodes:[
        {url: redis_node_1},
        {url: redis_node_2},
        {url: redis_node_3},
        {url: redis_node_4},
        {url: redis_node_5},
        {url: redis_node_6}
    ]
})*/

redisclient.connect();
//cluster.connect();

redisclient.on("connect", () => {
    console.log("Connecting to Redis.......");
});
 
redisclient.on("ready", () => {
    console.log("Connected to Redis and ready to use!");
});
  
redisclient.on("error", (err) => {
    console.log("Error in the Connection to Redis");
});

redisclient.on("end", (err) => {
     console.log("Disconnected from Redis");
});

module.exports = redisclient