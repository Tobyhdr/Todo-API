var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 1133;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API root');
});

app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {}; //This will become an object for the query, a WHERE component of the query

	//The two if clauses build the WHERE object to be used in the database query below
	if (query.hasOwnProperty('completed') && query.completed == 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed == 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.trim().length > 0) {
		where.description = { $like: '%' + query.q + '%' };
	}

	//Make query
	db.todo.findAll({where: where}).then(function (todos){ //findAll is passed the where object,
		//todos in "function (todos)" is then the array of objects generated by the where search criteria
		//These function calls basically create the variable that gets output, replacing "var todos = xxx"
		//Would an alternative be "then res.json(this)"?? Probably not. Haven't seen this in node.js
		res.json(todos);
	}, function() {
		res.status(500).send();
	});

});

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	
	// db.todo.findById(todoId).then(function (todo) {
	// 	res.json(todo.toJSON());
	// }).catch(function(e) {
	// 	res.status(400).json(e);
	// 	console.log('No todo with that id!');
	// }); MY SOLUTION
	//Andrews's solution...
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
});

app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function (todo) {
		req.user.addTodo(todo).then(function (){
			return todo.reload();
		}).then(function (todo) {
			res.json(todo.toJSON());
		});
	}, function(e) {
		res.status(400).json(e);
	});
});

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted) { //delete returns number of rows deleted
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with that id'
			});
		} else {
			res.status(204).send();
		}
	}, function() {
		res.status(500).send();
	});

});

app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};
	var todoId = parseInt(req.params.id, 10);

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function (todo){
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	},
	function() {
		res.status(500).send();
	});

});

app.post('/users', function (req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.users.create(body).then(function (user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(400).json(e);
	});
});

app.post('/users/login', function (req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.users.authenticate(body).then(function (user){
		var token = user.generateToken('authentication');

		if (token) {
			res.header('Auth', token).json(user.toPublicJSON());
		} else {
			res.status(401).send();
		}
	}, function (e) {
		res.status(401).send(e);
	});
});

db.sequelize.sync({force: true}).then(function() {
	app.listen(PORT, function() {
	console.log('Express listening on ' + PORT + '!');
	});
});