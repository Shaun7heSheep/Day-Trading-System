const redis = require('redis');

const cache = redis.createClient();

exports.getNextTransactNum = async () => {
    return await cache.incr('transactionNum');
}