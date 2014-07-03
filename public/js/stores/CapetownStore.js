/**
 * CapetownStore
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var CapetownConstants = require('../constants/CapetownConstants');
var merge = require('react/lib/merge');

var CHANGE_EVENT = 'change';

var _distance = 0;
var _mapClickedObj = {};

function setDistance(value) {
	_distance = value;
}

function setMapClickedObject(object) {
	console.log('setMapClickedObject:', object);
	_mapClickedObj = object;
}


var CapetownStore = merge(EventEmitter.prototype, {
	getDistance: function() {
		return _distance;
	},
	getMapClickedObject: function() {
		return _mapClickedObj;
	},
	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},
	addChangeListener: function(callback) {
	    this.on(CHANGE_EVENT, callback);
	},
	removeChangeListener: function(callback) {
	    this.removeListener(CHANGE_EVENT, callback);
	}
});

AppDispatcher.register(function(payload) {

	var action = payload.action;
	var text;

	switch(action.actionType) {
		case CapetownConstants.CLICK_MAP:
			setMapClickedObject(action.text);
			break;
		case CapetownConstants.SET_DISTANCE:
			setDistance(action.text);
			break;
		default:
			return true;
	}
	CapetownStore.emitChange();
	return true;
});


module.exports = CapetownStore;