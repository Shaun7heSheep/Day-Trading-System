var net = require('net');

var client = net.createConnection({
    host: 'quoteserve.seng.uvic.ca',
    port: 4444
})

client.on('connect', () => {
    console.log('Connected to server');
    client.write("ABC,jsmith\n");
})


client.on('data', (data) => {
    console.log('Received data from server ');
    console.log(data.toString('utf-8'));
});

client.on('end', function() {
    console.log('Disconnected');
});