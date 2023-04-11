# This is Readme

## Instructions to run the project (packages, dependencies, ...)

Docker network: `docker network create seng468`

MongoDB sharding:
    - cd to mongodb folder and run docker-compose up for Mongo config servers and shards containers
    - follow instructions in 'set-up-replica.md' to setup Mongo replica
    - shards Router container is within docker-compose in the root directory
    - make sure to run docker-compose file in root directory to spin up the Router then add shards
    - commands for add shards (and shard keys) is also in the 'set-up-replica.md' 

NodeJS Version: 16x

Redis Keys:
    - For user's balance: `${userId}:balance` 
    - For stocks price: `${symbol}`