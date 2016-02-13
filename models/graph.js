var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// our Model file for Graphs
var GraphSchema = new Schema(
	{
    	smsMessages: {
    		type: Number,
            default: 0
    	},
    	date: { 
    		type: String
    	}
	}
);

module.exports = mongoose.model('Graph', GraphSchema);