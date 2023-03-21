const fs = require(`fs`);
const axios = require(`axios`);

const FILE_PATH = process.argv[2];
const API_PATH = `http://localhost/seng468/`;

const requestQueue = [];
const maxQueueSize = process.argv[3] || 1;

async function sendRequest(command, args) {
    try {
        switch (command) {
            case `ADD`:
                await axios.post(`${API_PATH}users`, { userID: args[0], amount: args[1] });
                break;
            case `QUOTE`:
                await axios.get(`${API_PATH}quote`, {
                    data: {
                        user_id: args[0],
                        symbol: args[1]
                    }
                });
                break;
            case `BUY`:
                await axios.post(`${API_PATH}buy`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `COMMIT_BUY`:
                await axios.post(`${API_PATH}commit_buy`, { userID: args[0] });
                break;
            case `CANCEL_BUY`:
                await axios.post(`${API_PATH}cancel_buy`, { userID: args[0] });
                break;
            case `SELL`:
                await axios.post(`${API_PATH}sell`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `COMMIT_SELL`:
                await axios.post(`${API_PATH}commit_sell`, { userID: args[0] });
                break;
            case `CANCEL_SELL`:
                await axios.post(`${API_PATH}cancel_sell`, { userID: args[0] });
                break;
            case `SET_BUY_AMOUNT`:
                await axios.post(`${API_PATH}set-buy-amount`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `CANCEL_SET_BUY`:
                await axios.post(`${API_PATH}cancel-set-buy`, { userID: args[0], symbol: args[1] });
                break;
            case `SET_BUY_TRIGGER`:
                await axios.post(`${API_PATH}set-buy-trigger`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `SET_SELL_AMOUNT`:
                await axios.post(`${API_PATH}set-sell-amount`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `SET_SELL_TRIGGER`:
                await axios.post(`${API_PATH}set-sell-trigger`, { userID: args[0], symbol: args[1], amount: args[2] });
                break;
            case `CANCEL_SET_SELL`:
                await axios.post(`${API_PATH}cancel-set-sell`, { userID: args[0], symbol: args[1] });
                break;
            case `DUMPLOG`:
                await axios.get(`${API_PATH}dump`, { data: { filename: args[0] } });
                break;
            case `DISPLAY_SUMMARY`:
                await axios.post(`${API_PATH}display_summary`, { userID: args[0] });
                break;
            default:
                console.warn(`Unknown command: ${command}`);
                break;
        }
    } catch (err) {
        console.error(`Error sending command ${command}: ${err.message}`);
    }
};

fs.readFile(FILE_PATH, `utf8`, async (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const lines = data.trim().split(`\n`);
    for (let i = 0; i < lines.length; i++) {
        const [first, ...args] = lines[i].trim().split(`,`);
        const command = first.split(/[\s]+/)[1];

        console.log(`Transaction: ` + i);

        // If the request queue is full, wait for one of the promises to resolve before sending the next request
        while (requestQueue.length >= maxQueueSize) {
            await Promise.race(requestQueue);
        }

        // Send the request and add it to the queue
        const requestPromise = sendRequest(command, args);
        requestQueue.push(requestPromise);

        // Remove the completed request from the queue
        requestPromise.then(function() {
            const index = requestQueue.indexOf(requestPromise);
            requestQueue.splice(index, 1);
        });
    }

    // Wait for all requests to complete before exiting the function
    await Promise.all(requestQueue);
});
