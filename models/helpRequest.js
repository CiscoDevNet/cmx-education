var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// our Model file for the User
var HelpRequestSchema = new Schema(
	{
    	userId: {
    		type: String,
    		required: true
    	},
		macAddress: {
    		type: String,
    		required: true
    	},
		requestId: {
            type: Number,
			required: true,
			unique: true
        },
        requestType: {
            type: String
        }
	}
);

HelpRequestSchema.methods.generateId = function() {
    return new Date().getTime();
};

module.exports = mongoose.model('HelpRequest', HelpRequestSchema);
