var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// our Model file for the Pending Device
var PendingDeviceSchema = new Schema(
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
    	},
		confirmationCode: { 
    		type: String,
    		required: true
    	}
	}
);

module.exports = mongoose.model('PendingDevice', PendingDeviceSchema);
