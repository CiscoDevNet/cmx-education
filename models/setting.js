var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// our Model file for Settings
var SettingSchema = new Schema(
	{
    	twilioPhone: {
    		type: String,
    		unique: true
    	},
    	twilioSid: {
    		type: String,
    		unique: true
    	},
        twilioToken: {
            type: String,
            unique: true
        },
        cmxHost: {
            type: String,
            unique: true
        },
    	cmxPort: {
    		type: Number
    	},
		cmxUser: {
    		type: String
    	},
		cmxPassword: {
    		type: String
    	}
	}
);

module.exports = mongoose.model('Setting', SettingSchema);
