const fs = require('fs');
const axios = require('axios');

const FILE_PATH = 'user2.txt';

// axios.delete("http://localhost:3000/users");
// axios.delete("http://localhost:3000/transactions");
// axios.delete("http://localhost:3000/dump");
fs.readFile(FILE_PATH, 'utf8', async (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const lines = data.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
        const [first, ...args] = lines[i].trim().split(',');
        const command = first.split(/[\s]+/)[1];

        try {
            switch (command) {
                case 'ADD':
                    await axios.post("http://localhost:3000/users", { userID: args[0], amount: args[1] });
                    break;
                case 'QUOTE':
                    await axios.get(`http://localhost:3000/quote`, {
                        data: {
                            user_id: args[0],
                            symbol: args[1]
                        }
                    });
                    break;
                case 'BUY':
                    await axios.post('http://localhost:3000/buy', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case 'COMMIT_BUY':
                    await axios.post('http://localhost:3000/commit_buy', { userID: args[0] });
                    break;
                case "CANCEL_BUY":
                    await axios.post('http://localhost:3000/cancel_buy', { userID: args[0] });
                    break;
                case "SELL":
                    await axios.post('http://localhost:3000/sell', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case "COMMIT_SELL":
                    await axios.post('http://localhost:3000/commit_sell', { userID: args[0] });
                    break;
                case "CANCEL_SELL":
                    await axios.post('http://localhost:3000/cancel_sell', { userID: args[0] });
                    break;
                case "SET_BUY_AMOUNT":
                    await axios.post('http://localhost:3000/set-buy-amount', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case "CANCEL_SET_BUY":
                    await axios.post('http://localhost:3000/cancel-set-buy', { userID: args[0], symbol: args[1] });
                    break;
                case "SET_BUY_TRIGGER":
                    await axios.post('http://localhost:3000/set-buy-trigger', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case "SET_SELL_AMOUNT":
                    await axios.post('http://localhost:3000/set-sell-amount', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case "SET_SELL_TRIGGER":
                    await axios.post('http://localhost:3000/set-sell-trigger', { userID: args[0], symbol: args[1], amount: args[2] });
                    break;
                case "CANCEL_SET_SELL":
                    await axios.post('http://localhost:3000/cancel-set-sell', { userID: args[0], symbol: args[1] });
                    break;
                case "DUMPLOG":
                    await axios.get('http://localhost:3000/dump');
                    break;
                case "DISPLAY_SUMMARY":
                    await axios.get('http://localhost:3000/display_summary', { userID: args[0] });
                    break;
                default:
                    console.warn(`Unknown command: ${command}`);
                    break;
            }
        } catch (err) {
            console.error(`Error sending command ${command}: ${err.message}`);
        }
    }
});
