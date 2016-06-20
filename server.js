var express = require('express');
var app = express();
var PORT = process.env.PORT || 1133;
var todos =[{
	id: 1,
	description: 'Meet Annette for lunch',
	completed: false
}, {
	id: 2,
	description: 'Poo on loo',
	completed: false
}, {
	id: 3,
	description: 'Clean loo',
	completed: true
}];

app.get('/', function (req, res) {
	res.send('Todo API root');
});

app.get('/todos', function (req, res) {
	res.json(todos);
});

app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo;

	todos.forEach(function (todo) {
		if (todoId === todo.id) {
			matchedTodo = todo;
		}
	});

	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}

});

app.listen(PORT, function () {
	console.log('Express listening on ' + PORT + '!');
});