const userCmdModel = require("../Models/userCommand");
const quoteServerModel = require("../Models/quoteServer");
const accTransactModel = require("../Models/accountTransaction");
const transactNumModel = require("../Models/transactNum");

// log user command
exports.logUserCmnd = async (cmd, request, transactionNum) => {
    switch (cmd) {
        case "ADD":
            userCmdModel.create({
                timestamp: { $t: Date.now() },
                server: { $t: 'own-server' },
                transactionNum: { $t: transactionNum },
                command: { $t: cmd },
                username: { $t: request.body.userID },
                funds: { $t: request.body.balance }
            })
            break;
        case "QUOTE":
            userCmdModel.create({
                timestamp: { $t: Date.now() },
                server: { $t: 'own-server' },
                transactionNum: { $t: transactionNum },
                command: { $t: cmd },
                username: { $t: request.query.user_id },
                stockSymbol: { $t: request.query.symbol }
            })
            break;
        case "SET_BUY_AMOUNT": case "SET_BUY_TRIGGER": case "BUY": case "SELL": case "COMMIT_BUY": case "COMMIT_SELL": case "SET_SELL_AMOUNT": case "SET_SELL_TRIGGER":
            userCmdModel.create({
                timestamp: { $t: Date.now() },
                server: { $t: 'own-server' },
                transactionNum: { $t: transactionNum },
                command: { $t: cmd },
                username: { $t: request.body.userID },
                stockSymbol: { $t: request.body.symbol },
                funds: { $t: request.body.balance }
            })
            break;
        case "CANCEL_SET_BUY": case "CANCEL_SET_SELL":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                transactionNum: {$t: transactionNum},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                funds: {$t:request.body.amount}
            })
            break;
        case "DISPLAY_SUMMARY":
            userCmdModel.create({
                timestamp: { $t: Date.now() },
                server: { $t: 'own-server' },
                transactionNum: { $t: transactionNum },
                command: { $t: cmd },
                username: { $t: request.query.user_id },
            })
            break;
    }
};

exports.logUserCmnd2 = async (cmd, userID, amount, transactionNum) => {
    switch (cmd) {
        case "COMMIT_BUY": case "COMMIT_SELL":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                transactionNum: {$t: transactionNum},
                command: {$t:cmd},
                username: {$t:userID},
                funds: {$t:amount}
            })
            break;
    }
};


// log quoteServer
exports.logQuoteServer = async (userID, symbol, price, quoteTime, cryptoK, transactionNum) => {
    quoteServerModel.create({
        timestamp: { $t: Date.now() },
        price: { $t: price },
        username: { $t: userID },
        transactionNum: { $t: transactionNum },
        stockSymbol: { $t: symbol },
        quoteServerTime: { $t: quoteTime },
        cryptoKey: { $t: cryptoK }
    })
}

// log Account Transactions
exports.logTransactions = async (action, userID, funds, transactionNum) => {
    accTransactModel.create({
        timestamp: {$t: Date.now()},
        server: {$t:'own-server'},
        transactionNum: {$t: transactionNum},
        action: {$t:action},
        username: {$t:userID},
        funds: {$t:funds}
    })
}

exports.deleteAllLog = async (request, response) => {
    await userCmdModel.deleteMany({});
    await accTransactModel.deleteMany({});
    await quoteServerModel.deleteMany({});
    await transactNumModel.deleteMany({});
    response.status(200).send("All logs deleted");
};
