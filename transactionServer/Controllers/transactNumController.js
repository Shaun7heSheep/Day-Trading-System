const cache = require("../Redis/redis_init")

exports.getNextTransactNum = async () => {
    return await cache.incr('transactionNum')
}