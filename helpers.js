const net = require('net');

const logModel = require("./Models/log");

module.exports = {
    // log user command
    logUserCmd: async function(cmd, request) {
        switch (cmd) {
        case "ADD":
            logModel.create({
            userCommand:{
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
    },

    // get stock price from quote server
    getQuote: function(userID, symbol) {
        return new Promise((resolve, reject) => {
        const client = net.createConnection({
            host: 'quoteserve.seng.uvic.ca',
            port: 4444
        })
        client.on('connect', () => {client.write(`${symbol},${userID}\n`)})
        client.on('data', (data) => {
            var response = data.toString('utf-8')
            resolve(response);
            var arr = response.split(',');
    
            // store quoteserver response for logging
            logModel.create({
            quoteServer: {
                timestamp: Date.now(),
                price: arr[0],
                username: userID,
                stockSymbol: symbol,
                quoteServerTime: arr[3],
                cryptoKey: arr[4]
            }
            })
        })
        client.on('error', (err) => {reject(err)})
        })
    }
}