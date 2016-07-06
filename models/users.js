var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('users', {
		email:  {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function (value){ //For "set" see "default". "value" is the name of the property
			//whose default behaviour is being amended in the "set" code, i.e. "password".
				var salt = bcrypt.genSaltSync(10); //Generates a random 10-character salt
				var hashedPassword = bcrypt.hashSync(value, salt); //Salt password here
				//Next three lines either validates data (password) or writes to the DB
				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function (users, options) {
				if (typeof users.email === 'string' && users.email.trim().length > 0) {
					users.email = users.email.toLowerCase();
				}
			}
		},
		classMethods: {
			authenticate: function (body) {
				return new Promise(function (resolve, reject) {
					if (typeof body.email == 'string' && typeof body.password == 'string') {
						user.findOne({
							where: {
								email: body.email
							}
						}).then(function(user) {
							if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
								return reject();
							} else {
								resolve(user);
							}
						}, function(e) {
							reject(e);
						});
					} else {
						return reject();
					}
				})
			},
			findByToken: function (token) {
				return new Promise(function (resolve, reject) {
					try {
						var decodedJWT = jwt.verify(token, 'qwertz890');
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then(function (user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function (e){
							reject(e);
						})
					} catch (e) {
						reject(e);
					}
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function () {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			},
			generateToken: function (type) {
				if (!_.isString(type)) {
					return undefined;
				}

				try {
					var stringData = JSON.stringify({id: this.get('id'), type: type});
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString();
					var token = jwt.sign({
						token: encryptedData
					}, 'qwertz890');

					return token;
				} catch (e) {
					console.error(e);
					return undefined;
				}
			}
		}
	});

	return user;
};