/**
 * @jsx React.DOM
 */

var React = require('react');
	React.initializeTouchEvents(true);

var CapetownApp = require('./components/CapetownApp.react');

window.React = React; // React DevTools won't work without this

React.renderComponent(
  <CapetownApp />,
  document.getElementById('capetownapp')
);