/**
 * @jsx React.DOM
 */

/**
 * This component operates as a "Controller-View".  It listens for changes in
 * the CapetownStore and passes the new data to its children.
 */

var Header = require('./Header.react');
var Map = require('./Map.react');
var React = require('react');
var CapetownStore = require('../stores/CapetownStore');

/**
 * Retrieve the current distance data from the CapetownStore
 */
function getDistance() {
  return {
    distance: CapetownStore.getDistance()
  };
}

/**
 * Retrieve the current/most recently clicked object from the CapetownStore
 */
function getMapClick() {
  return {
    mapclick: CapetownStore.getMapClickedObject()
  };
}

/*
 * Compose and render the actual app (the top level component)
 */
var CapetownApp = React.createClass({

  getInitialState: function() {
    return getDistance();
  },

  componentDidMount: function() {
    CapetownStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    CapetownStore.removeChangeListener(this._onChange);
  },

  render: function() {
   return (
      <div>
        <Header />
        <Map distance={this.state.distance} clickedObject={this.state.mapclick} />
      </div>
   );
  },  


  /**
   * Event handler for 'change' events coming from the CapetownStore
   */
  _onChange: function() {
    this.setState(getDistance());
    this.setState(getMapClick())
  }

});

module.exports = CapetownApp;