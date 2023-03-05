const logModel = require("../Models/log");

// log user command
exports.logUserCmnd = async (cmd, request) => {
    switch (cmd) {
        case "ADD":
            logModel.create({
                userCommand: {
                    timestamp: Date.now(),
                    server: 'own-server',
                    command: 'ADD',
                    username: request.body.userID,
                    funds: request.body.balance
                }
            })
            break;
        case "QUOTE":
            logModel.create({
                userCommand:{
                    timestamp: Date.now(),
                    server: 'own-server',
                    command: 'ADD',
                    username: request.body.userID,
                    stockSymbol: request.body.symbol
                }
            })
            break;
    }
};


// log quoteServer
exports.logQuoteServer = async (userID,symbol,price,quoteTime,cryptoK) => {
    logModel.create({
        quoteServer: {
            timestamp: Date.now(),
            price: price,
            username: userID,
            stockSymbol: symbol,
            quoteServerTime: quoteTime,
            cryptoKey: cryptoK
        }
    })
}