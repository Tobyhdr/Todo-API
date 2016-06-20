var express = require('express');
var app = express();
var PORT = process.env.PORT || 1133;

app.get('/', function (req, res) {
	res.send('Todo API root');
});

app.listen(PORT, function () {
	console.log('Express listening on ' + PORT + '!');
});