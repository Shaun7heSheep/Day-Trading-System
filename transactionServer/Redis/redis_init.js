const redis = require("redis");
const redis_addr = process.env.REDIS_ADDR || "redis";
const redis_port = process.env.REDIS_PORT || 6379;
const redisclient = redis.createClient({socket: {host: redis_addr, port: redis_port}});

redisclient.connect();

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