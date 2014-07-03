/**
 * @jsx React.DOM
 */

var React = require('react');

var Slider = React.createClass({
	handleChange: function(e) {
	    this.props.onSliderChange({data: e.target.value});
	},
	updateBubble: function(e) {
		return true;
	},
	render: function() {
		return (
			<input type="range" 
				   min="100"
				   max="5000"
				   step="100"
				   ref="slider"
				   onChange={this.updateBubble}
				   onMouseUp={this.handleChange} />
		)
	}
});

module.exports = Slider;
