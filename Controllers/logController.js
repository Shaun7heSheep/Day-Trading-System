const userCmdModel = require("../Models/userCommand");
const quoteServerModel = require("../Models/quoteServer");
const accTransactModel = require("../Models/accountTransaction");

// log user command
exports.logUserCmnd = async (cmd, request, transactionNum) => {
    switch (cmd) {
        case "ADD":
            userCmdModel.create({
                timestamp: {$t: Date.now()},
                server: {$t:'own-server'},
                transactionNum: {$t: transactionNum},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                funds: {$t:request.body.balance}
            })
            break;
        case "QUOTE":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                transactionNum: {$t: transactionNum},
                command: {$t:cmd},
                username: {$t:request.query.user_id},
                stockSymbol: {$t:request.query.symbol}
            })
            break;
        case "BUY" || "SELL" || "COMMIT_BUY" || "COMMIT_SELL":
            userCmdModel.create({
                timestamp: {$t:Date.now()},
                server: {$t:'own-server'},
                transactionNum: {$t: transactionNum},
                command: {$t:cmd},
                username: {$t:request.body.userID},
                funds: {$t:request.body.amount}
            })
            break;
    }
};

exports.logUserCmnd2 = async (cmd, userID, amount, transactionNum) => {
    switch (cmd) {
        case "COMMIT_BUY" || "COMMIT_SELL":
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
exports.logQuoteServer = async (userID,symbol,price,quoteTime,cryptoK,transactionNum) => {
    quoteServerModel.create({
        timestamp: {$t:Date.now()},
        price: {$t:price},
        username: {$t:userID},
        transactionNum:{$t:transactionNum},
        stockSymbol: {$t:symbol},
        quoteServerTime: {$t:quoteTime},
        cryptoKey: {$t:cryptoK}
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