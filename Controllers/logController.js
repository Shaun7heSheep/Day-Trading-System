const userCmdModel = require("../Models/userCommand");
const quoteServerModel = require("../Models/quoteServer");

// log user command
exports.logUserCmnd = async (cmd, request) => {
    switch (cmd) {
        case "ADD":
            userCmdModel.create({
                timestamp: {$t: Date.now()},
                server: {$t:'own-server'},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                funds: {$t:request.body.balance}
            })
            break;
        case "QUOTE":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                stockSymbol: {$t:request.body.symbol}
            })
            break;
        case "BUY" || "SELL" || "COMMIT_BUY" || "COMMIT_SELL":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                stockSymbol: {$t:request.body.symbol},
                funds: {$t:request.body.balance}
            })
            break;
    }
};


// log quoteServer
exports.logQuoteServer = async (userID,symbol,price,quoteTime,cryptoK) => {
    quoteServerModel.create({
        timestamp: {$t:Date.now()},
        price: {$t:price},
        username: {$t:userID},
        stockSymbol: {$t:symbol},
        quoteServerTime: {$t:quoteTime},
        cryptoKey: {$t:cryptoK}
    })
}