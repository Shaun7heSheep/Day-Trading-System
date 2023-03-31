const net = require("net");
const cache = require("../Redis/redis_init");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");

exports.getStockPrice = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("QUOTE", request, numDoc);

  try {
    quoteData = await this.getQuote(request.body.user_id, request.body.symbol, numDoc);
    response.status(200).send(quoteData);
  } catch (error) {
    response.status(500).send(error);
  }
};

// Connect to QuoteServer and get quote
exports.getQuote = (userID, symbol, transactionNum) => {
  return new Promise(async (resolve, reject) => {
    // get stock price in cache
    var stockCached = await cache.get(symbol);
    if (!stockCached) {
      const client = net.createConnection({
        host: "quoteserve.seng.uvic.ca",
        port: 4444,
      });
      client.on("connect", () => {
        client.write(`${symbol},${userID}\n`);
      });
      client.on("data", async (data) => {
        var response = data.toString("utf-8");
        resolve(response);

        var arr = response.split(",");
        // cache stock price
        cache.setEx(symbol, 60, response);
        // store quoteserver response for logging
        logController.logQuoteServer(userID, symbol, arr[0], arr[3], arr[4], transactionNum);
      });
      client.on("error", (err) => {
        reject(err);
      });
    } else {
      resolve(stockCached);
      var arr = stockCached.split(",")
      logController.logQuoteServer(userID, symbol, arr[0], arr[3], arr[4], transactionNum);
    }
  });
}
