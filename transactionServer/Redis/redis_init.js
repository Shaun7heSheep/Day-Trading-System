const redis = require("redis");
const redisclient = redis.createClient({
    ports: 6379,
    host: "127.0.0.1"
});

console.log("abc")

redisclient.on("connect", () => {
    console.log("Connecting to Redis.......");
});
 
redisclient.on("ready", () => {
    console.log("Connected to Redis and ready to use!");
});
  
redisclient.on("error", (err) => {
    console.log("Error in the Connection to Redis");
});

// redisclient.on("end", (err) => {
//     console.log("Disconnected from Redis");
// });

process.on('SIGINT', () => {
    redisclient.quit();
});

module.exports = redisclient