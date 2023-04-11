## Set up Sharding using Docker Containers

### Config servers
Start config servers (3 member replica set)
```
docker-compose -f config-server/docker-compose.yaml up -d
```
Initiate replica set
```
mongosh localhost:40001 (cfgsrv1 - Config Server)
```
```
rs.initiate(
  {
    _id: "cfgrs",
    configsvr: true,
    members: [
      { _id : 0, host : "cfgsvr1:27017" },
      { _id : 1, host : "cfgsvr2:27017" },
    ]
  }
)

rs.status()
```

### Shard 1 servers
Start shard 1 servers (3 member replicas set)
```
docker-compose -f shard1/docker-compose.yaml up -d
```
Initiate replica set
```
mongosh localhost:50001 (shard1svr1 - Shard)
```
```
rs.initiate(
  {
    _id: "shard1rs",
    members: [
      { _id : 0, host : "shard1svr1:27017" },
      { _id : 1, host : "shard1svr2:27017" }
    ]
  }
)

rs.status()
```

### Mongos Router
Start mongos query router
```
docker-compose -f mongos/docker-compose.yaml up -d
```

### Add shard to the cluster
Connect to mongos
```
mongosh localhost:60000 (mongos Router)
```
Add shard
```
mongos> sh.addShard("shard1rs/shard1svr1:27017,shard1svr2:27017")
mongos> sh.status()
```
## Adding another shard
### Shard 2 servers
Start shard 2 servers (3 member replicas set)
```
docker-compose -f shard2/docker-compose.yaml up -d
```
Initiate replica set
```
mongosh localhost:50004
```
```
rs.initiate(
  {
    _id: "shard2rs",
    members: [
      { _id : 0, host : "shard2svr1:27017" },
      { _id : 1, host : "shard2svr2:27017" }
    ]
  }
)

rs.status()
```
### Add shard to the cluster
Connect to mongos
```
mongosh localhost:60000
```
Add shard
```
mongos> sh.addShard("shard2rs/shard2svr1:27017,shard2svr2:27017")
mongos> sh.status()
```

### Create shard indexes (shard keys)
Connect to mongos
```
mongosh localhost:60000
```
Add shard key
```
mongos> sh.shardCollection('seng468db.users', {_id: 'hashed'})
mongos> sh.shardCollection('seng468db.stockaccounts',{userID: 'hashed'})
mongos> sh.shardCollection('seng468db.transactions',{userID: 'hashed'})
mongos> sh.status()
```