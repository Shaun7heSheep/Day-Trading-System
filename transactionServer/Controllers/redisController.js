const cache = require("../Redis/redis_init")

exports.getBalanceInCache = async (userID) => {
    const balance_Key = `${userID}_balance`;
    // get user from Redis cache
    var userBalance = Number(await cache.get(balance_Key));
    if (!userBalance) { // user not in Redis cache
        // get user from DB
        const user = await userModel.findById(userID);
        if (!user) {
            return null
        } else {
            // update cache
            userBalance = user.balance;
            cache.set(balance_Key, userBalance)
            return Number(userBalance)
        }
    } else {
        return userBalance
    }
}