const net = require("net");
const cache = require("../Redis/redis_init");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");

exports.getStockPrice = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("QUOTE", request, numDoc.value);

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
        var arr = response.split(",");
        const stockObj = {
          price: Number(arr[0]),
          quoteTime: arr[3],
          cryptoKey: arr[4]
        };
        // cache stock price
        cache.set(symbol,JSON.stringify(stockObj));
        resolve(stockObj);
      });
      client.on("error", (err) => {
        reject(err);
      });
    } else {
      const stockObj = JSON.parse(stockPrice);
      resolve(stockObj);
    }
    // store quoteserver response for logging
    logController.logQuoteServer(userID, symbol, stockObj.price, stockObj.quoteTime, stockObj.cryptoKey, transactionNum);
  });
}
