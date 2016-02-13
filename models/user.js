var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var logger = require(__base + 'configs/logger');

// our Model file for the User
var UserSchema = new Schema(
	{
    	userId: {
    		type: String,
    		required: true,
    		unique: true
    	},
    	password: {
    		type: String,
    		required: true
    	},
        role: {
            type: String,
            required: true
        },
        userName: {
            type: String
        }
	}
);

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
