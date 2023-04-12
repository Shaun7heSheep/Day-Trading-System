# This is Readme

## Instructions to run the project (packages, dependencies, ...)

Docker network: `docker network create seng468`

Environment variables:
    - please change quoteServer ADDR and PORT env variables for each of following services inside .env file
        [myapp1 , myapp2 , myapp3 , subscriptionServer]
    - other env variables are working with the current configuration. Only need to change if you modify the associated services

MongoDB sharding:
    - `docker compose -f mongodb/docker-compose.yaml up -d` for Mongo config servers and shards containers
    - follow instructions in 'mongodb/set-up-replica.md' to inititate Mongo replicas
    - shards Router container is within docker-compose in the root directory
    - `docker compose up -d` in root directory to spin up the Router then add shards
    - commands for add shards (and shard keys) is also in the 'mongodb/set-up-replica.md' 

NodeJS Version: 16x

Redis Keys:
    - For user's balance: `${userId}:balance` 
    - For stocks price: `${symbol}`