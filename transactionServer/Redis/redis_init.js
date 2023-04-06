const redis = require("redis");
//const redis_addr = process.env.REDIS_ADDR || "redis";
//const redis_port = process.env.REDIS_PORT || 6379;
//const redisclient = redis.createClient({socket: {host: redis_addr, port: redis_port}});

const redis_node_1 = process.env.REDIS_NODE_1;
const redis_node_2 = process.env.REDIS_NODE_2;
const cluster = redis.createCluster({
    rootNodes:[
        {url: redis_node_1},
        {url: redis_node_2}
    ]
})

//redisclient.connect();
cluster.connect();

cluster.on("connect", () => {
    console.log("Connecting to Redis Cluster.......");
});
 
cluster.on("ready", () => {
    console.log("Connected to Redis Cluster and ready to use!");
});
  
cluster.on("error", (err) => {
    console.log("Error in the Connection to Redis");
});

 cluster.on("end", (err) => {
     console.log("Disconnected from Redis");
});

module.exports = cluster