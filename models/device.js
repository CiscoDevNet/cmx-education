var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// our Model file for the Device
var DeviceSchema = new Schema(
	{
    	macAddress: {
    		type: String,
    		required: true,
    		unique: true
    	},
    	phoneNumber: {
    		type: String,
    		required: true
    	},
    	userId: { 
    		type: String,
    		required: true
    	}
	}
);

module.exports = mongoose.model('Device', DeviceSchema);
