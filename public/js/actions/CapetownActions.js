/**
 * CapetownActions
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var CapetownConstants = require('../constants/CapetownConstants');


var CapetownActions = {

	setDistance: function(value) {
		// console.log('CapetownActions.setDistance:', value);
		AppDispatcher.handleViewAction({
			actionType: CapetownConstants.SET_DISTANCE,
			text: value
		});
	},

	mapClick: function(data) {
		console.log('CapetownActions.mapClick:', data);
		AppDispatcher.handleViewAction({
			actionType: CapetownConstants.CLICK_MAP,
			text: data
		});
	}

};

module.exports = CapetownActions;