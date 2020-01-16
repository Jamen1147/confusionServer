const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	image: {
		type: String,
		required: true
	},
	abbr: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		required: true
	},
	featured: {
		type: Boolean,
		default: false
	}
});

const Leaders = mongoose.model('Leader', leaderSchema);
module.exports = Leaders;
