module.exports = function(sequelize, DataTypes) {
	return sequelize.define('users', {
		email:  {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [7, 100]
			}
		}
	}, {
		hooks: {
			beforeValidate: function (users, options) {
				if (typeof users.email === 'string' && users.email.trim().length > 0) {
					users.email = users.email.toLowerCase();
				}
			}
		}
	});
}