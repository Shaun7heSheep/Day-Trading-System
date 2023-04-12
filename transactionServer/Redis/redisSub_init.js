const redis = require("redis");
const redis_addr = process.env.REDIS_ADDR || "localhost";
const redis_port = process.env.REDIS_PORT || 6378;
const redisclient = redis.createClient({socket: {host: redis_addr, port: redis_port}});

redisclient.connect();
 
redisclient.on("ready", () => {
    console.log("Connected to Redis-Sub and ready to use!");
});
  
redisclient.on("error", (err) => {
    console.log(err);
});

redisclient.on("end", (err) => {
     console.log("Disconnected from Redis");
});

module.exports = redisclient