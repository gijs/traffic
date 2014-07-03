/**
 * @jsx React.DOM
 */

var React = require('react');
var CapetownActions = require('../actions/CapetownActions');
var Slider = require('./Slider.react');

var ModalTrigger = require('react-bootstrap').ModalTrigger;
var Button = require('react-bootstrap').Button;
var Modal = require('react-bootstrap').Modal;
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;

var key = 1;



var Header = React.createClass({

  getDefaultProps: function() {
    return {
      filterPanelHeight: '110'
    };
  },
  getCurrentUrl: function() {
    return window.location.href.toString();
  },
  _updateSliderValue: function(e) {
    // console.log('updateSliderValue():', e.data);
    CapetownActions.setDistance(e.data);
  },
  render: function() {
    return (
        <div className="FilterPanel navbar navbar-fixed-top" id="filterpanel" style={{height: this.props.filterPanelHeight}}>
          <div className="navbar-inner">
            <div className="container-fluid">
              <div className="row">
                <div className="col-xs-2 col-sm-2 col-md-2 col-lg-2" id="Logo" style={{width: 200}}>
                  <h1>Cape Town</h1>
                  <p>
                    Traffic Analysis&nbsp;
                    <ModalTrigger modal={<InfoModal />}>
                      <i style={{cursor: 'pointer'}} className="fa fa-question-circle" />
                    </ModalTrigger>
                  </p>
                </div>
                <div className="col-xs-1 col-sm-1 col-md-6 col-lg-8" id="Controls" style={{minWidth: 200}}>
                  <TabbedArea defaultActiveKey={1}>
                    <TabPane key={1} tab="Scenarios">
                        &nbsp;<a href="">Congestion</a>&nbsp;
                        &nbsp;<a href="">Infrastructure</a>&nbsp;
                        &nbsp;<a href="">Urban growth</a>&nbsp;
                        &nbsp;<a href="">Optimal routes</a>&nbsp;
                        &nbsp;<a href="">Cost-benefit</a>&nbsp;
                        &nbsp;<a href="">Noisiest &amp; quietest zones</a>&nbsp;
                        &nbsp;<a href="">Accessibility</a>
                    </TabPane>
                    <TabPane key={2} tab="Settings">
                      <div style={{margin:'15px 0 0 0'}}>
                        <Slider onSliderChange={this._updateSliderValue} />
                      </div>
                    </TabPane>
                    <TabPane key={3} tab="Questions">
                      <div style={{margin:10}}>
                        <form className="queryForm" onSubmit={this.handleSubmit}>
                        <input className="form-control" 
                               id="focusedInput" 
                               type="text" 
                               ref="query"
                               placeholder="Example: 'Show noisiest areas'" />
                        </form>
                      </div>
                    </TabPane>
                    <TabPane key={4} tab="Share">
                      <div style={{margin:'15px 0 0 0'}}>
                        <input className="form-control" readOnly type="text" value={this.getCurrentUrl()} />
                      </div>
                    </TabPane>
                  </TabbedArea>                  
                </div>
              </div>            
            </div>
          </div>
        </div>        
    );
  }
});



var InfoModal = React.createClass({
  render: function() {
    return this.transferPropsTo(
        <Modal title="Cape Town: Traffic Analysis" animation={true}>
          <div className="modal-body">
            <h3>Objective</h3>
            <p>This visualisation aims to gain insight into the infrastructure of Cape Town, South Africa.</p>
            <p>Some questions it can aid in answering are:</p>
            <ul>
              <li>Where are the traffic congestion hotspots?</li>
              <li>What is the influence of change in infrastructure?</li>
              <li>What are the effects of urban growth on mobility?</li>
              <li>Which routes are optimal?</li>
              <li>Who profits from a change, who suffers?</li>
              <li>Which places are the most accessible?</li>
              <li>Show carbondioxide levels over time in zones</li>
              <li>Where are the noisiest and quietest areas?</li>
            </ul>
            <h4>Browsers</h4>
            <p>For an optimised experience, we recommend that you use a recent version of Google Chrome, Mozilla Firefox or Safari.</p>
            <h4>Sources</h4>
            <ul>
              <li><a href="http://www.movemobility.nl/en/index.html">Move Mobility</a></li>
            </ul>             
            <h4>Credits</h4>
            <ul>
              <li><a href="http://www.nelen-schuurmans.nl/">Nelen &amp; Schuurmans</a></li>
              <li><a href="http://www.postgresql.org/">PostgreSQL</a></li>
              <li><a href="http://www.postgis.net/">PostGIS</a></li>
              <li><a href="http://www.mapnik.org/">Mapnik</a></li>
              <li><a href="http://www.leafletjs.com/">Leaflet</a></li>
              <li><a href="http://d3js.org/">D3</a></li>
            </ul>                           
          </div>
          <div className="modal-footer">
            <Button onClick={this.props.onRequestHide}>Close</Button>
          </div>
        </Modal>
      );
  }
});
   


module.exports = Header;
