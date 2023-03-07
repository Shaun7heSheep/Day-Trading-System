const transactionNumModel = require("../Models/transactNum")

exports.getNextTransactNum = () => {
    return new Promise((resolve, reject) => {
        try {
            var docs = transactionNumModel.findOneAndUpdate(
                {_id: "Count"},
                {$inc:{value:1}},
                {new:true, upsert:true}
            )
            resolve(docs)
        } catch (error) {
            reject(error)
        }
    })
}