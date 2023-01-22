const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

server.listen(process.env.PORT || 3000, () => {
    console.log('Server start');
});

app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: '\public'
    });
});

app.use(express.static('public'));