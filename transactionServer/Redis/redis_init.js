const redis = require("redis");
const redisclient = redis.createClient({});

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