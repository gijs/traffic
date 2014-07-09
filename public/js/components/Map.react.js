/**
 * @jsx React.DOM
 */

var CapetownActions = require('../actions/CapetownActions');
var React = require('react');
var ReactPropTypes = React.PropTypes;
var d3 = require('d3');
var $ = require('jquery');
var L = require('leaflet');
require('leaflet-draw');
require('leaflet-hash');
require('../../vendor/bower_components/leaflet.loading/src/Control.Loading.js');
require('../../vendor/bower_components/leaflet.utfgrid/dist/leaflet.utfgrid.js');


/*
 * Customizing Leaflet
 */
L.Icon.Default.imagePath = 'vendor/bower_components/leaflet/dist/images/'; // Necessary because of require('leaflet')
L.Map.BoxZoom.prototype._onMouseUp = function(e) {
	console.log('overriding _onMouseUp!');
	this._finish();
	if (!this._moved) { return; }
};


var Map = React.createClass({

	getDefaultProps: function () {
	   return {
	     mapHeight: '100%',
	     drawControlPosition: 'topleft',
	     latlng: [
	     	-33.9772, 
	     	18.5113
	     ],
	     zoom: 10,
	     distance: 5000,
	     baseLayers: [
	     	{
				mapbox: L.tileLayer('http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa98k8k/{z}/{x}/{y}.png', {
				    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
				    maxZoom: 18,
				    detectRetina: true
				}),
				satellite: L.tileLayer('http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa79205/{z}/{x}/{y}.png', {
				    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
				    maxZoom: 18,
				    detectRetina: true
				}),
				elevation: L.tileLayer.wms('https://raster.lizard.net/wms', {
					layers: 'demo:world',
					styles: 'BrBG_r:48:1465',
					attribution: '&copy; Nelen &amp; Schuurmans',
			        format: 'image/png',
					maxZoom: 18,
					transparent: true,
			        zIndex: 20,
			        unloadInvisibleTiles: true
				})
			}
	     ],
	     layers: [
	     	{
				emme_links: L.tileLayer('/database/traffic/table/emme_links3857/{z}/{x}/{y}.png?cache_policy=persist&sql=select * from emme_links3857', {
				    maxZoom: 18
				}),
				emme_tlines: L.tileLayer('/database/traffic/table/emme_tlines3857/{z}/{x}/{y}.png?cache_policy=persist&sql=select * from emme_tlines3857', {
				    maxZoom: 18
				}),
				emme_nodes: L.tileLayer('/database/traffic/table/emme_nodes3857/{z}/{x}/{y}.png?cache_policy=persist&sql=select * from emme_nodes3857 WHERE iszone = 1', {
					maxZoom: 18
				}),
				emme_spider: L.tileLayer('/database/traffic/table/emme_spider/{z}/{x}/{y}.png?cache_policy=persist&sql=select * from emme_spider', {
					maxZoom: 18
				})
	     	}
	     ],
	     dynamicLayers: [
	     	{
				emme_costliest_dynamic: L.tileLayer('/database/traffic/table/emme_costliest/{z}/{x}/{y}.png?cache_policy=persist&sql=select * from emme_costliest', {
					maxZoom: 18
				})
	     	}
	     ]
	   };
	},
	handleGridClick: function(data) {
		// console.log('handleGridClick()!', data);
	    CapetownActions.mapClick(data);
		return false; // Same as preventDefault()
	},
	componentDidMount: function() {

		window.distance = 1;
		window.max = 500;
		window.zoomToRoute = false;

		var from_data, to_data;
		var from_name, to_name;
		var routes = [];
		var start_popups = [];
		var end_popups = [];
		var circles = [];
		var startcircles = [];
		var mapClicked = 1;
		var startingPoint, finishPoint;
		var route_cost = 0.0;
		var route_cost_ndw = 0.0;

		// Instruct Leaflet to prefer canvas rendering
		window.L.PREFER_CANVAS = true; 


		this.map = L.map(this.getDOMNode(), {
			// loadingControl:true,
			layers: [this.props.baseLayers[0].mapbox]
		}).setView(this.props.latlng, this.props.zoom);

		window.map = this.map;

		var MyCustomStartMarker = L.Icon.extend({
		    options: {
			    iconRetinaUrl: '/images/marker-start-x2.png',
			    iconAnchor: [15, 47],
			    popupAnchor: [-3, -40],
		        iconUrl: '/images/marker-start.png',
		        shadowUrl: '/images/marker-shadow.png'
		    }
		});

		var MyCustomEndMarker = L.Icon.extend({
		    options: {
			    iconRetinaUrl: '/images/marker-start-x2.png',
			    iconAnchor: [15, 47],
			    popupAnchor: [-3, -40],
		        iconUrl: '/images/marker-start.png',
		        shadowUrl: '/images/marker-shadow.png'
		    }
		});

		var drawControl = new L.Control.Draw({
		    draw: {
		        position: this.props.drawControlPosition,
		        circle: false,
		        rectangle: false,
		        polyline: true,
		        marker: {
		        	draggable: true,
		        	icon: new MyCustomStartMarker()
		        },
		        polygon: {
		            allowIntersection: false,
		            drawError: {
		                color: '#b00b00',
		                timeout: 1000
		            },
		            shapeOptions: {
		                color: 'teal',
		                fillOpacity: 0.7
		            }
		        }
		    },
		    edit: false
		});

		var drawnItems = new L.FeatureGroup();
		map.addLayer(drawnItems);


		var markersArray = [];

		map.on('draw:created', function (e) {

		    var type = e.layerType,
		        layer = e.layer;

		    if (type === 'polyline') {
		        // console.log('A polyline!', e.layer._latlngs);
		        $.get('http://staging.nxt.lizard.net/api/v1/rasters/?raster_names=elevation&geom=LINESTRING('+e.layer._latlngs[0].lat+'%20'+e.layer._latlngs[0].lng+','+e.layer._latlngs[1].lat+'%20'+e.layer._latlngs[1].lng+')&srs=EPSG:3857', function(data) {
		        	console.log('------->',data);
		        });
		        // http://staging.nxt.lizard.net/api/v1/rasters/?raster_names=elevation&geom=LINESTRING(664696.3979678926%206844477.260767824,681818.2923037722%206930086.732447221)&srs=EPSG:3857
		    }

		    if (type === 'polygon') {
		        $.ajax({
		          type: "POST",
		          url: "/api/v1/polygon/" + window.clientid,
		          data: {"polygon": JSON.stringify(layer.toGeoJSON().geometry)}
		        }).done(function( msg ) {
		          calculateRoute(from_data, to_data);
		        });
		        map.addLayer(layer);
		    }		    

		    if (type === 'marker') {

		    	markersArray.push(e);


		    	if(markersArray.length % 2 === 0) {

		    		console.log('Second one added!');

			        $.ajax({
			            url: "/api/v1/edge?lat="+e.layer._latlng.lat+"&lon="+e.layer._latlng.lng
			        }).done(function(data) {
			            to_data = JSON.parse(data);

			            if(to_data.osm_name === null) { toName = 'unknown destination'; } else { toName = to_data.osm_name; }

			            var routeCalculation = calculateRoute(from_data, to_data);
			            $.when(routeCalculation).done(function(e) {
			                    layer.bindPopup("To " + toName + " within approx. " + Math.round(route_cost) + " minutes").openPopup();
			            });
			        });
		    	} else {

		    		console.log('First one added!');

			        $.ajax({
			            url: "/api/v1/edge?lat="+e.layer._latlng.lat+"&lon="+e.layer._latlng.lng
			        }).done(function(data) {
			            from_data = JSON.parse(data);

			            if(from_data.osm_name === null) { fromName = 'unknown origin'; } else { fromName = from_data.osm_name; }

		                layer.bindPopup("From " + fromName + "...").openPopup();
			        });
		    	}
		    }

		    drawnItems.addLayer(layer);
		});

		this.map.addControl(drawControl);  
		var hash = new L.Hash(this.map);

		// this.props.dynamicLayers[0].emme_costliest_dynamic.addTo(window.map);
		// this.props.dynamicLayers[0].emme_costliest_dynamic.bringToFront();

		// var emme_costliest_dynamic = L.tileLayer('/database/traffic/table/emme_costliest/{z}/{x}/{y}.png?cache_policy=persist&sql=SELECT DISTINCT ON(c.fid) c.*, ST_MakeLine(a.geom, b.geom) AS geom FROM emme_veh AS c, emme_nodes3857 AS b, emme_nodes3857 AS a WHERE c.fid = a.id AND c.tid = b.id AND ST_Distance(a.geom, b.geom) < 50000 AND c.cost > 1 ORDER BY c.fid, c.cost DESC', {
		// var emme_costliest_dynamic = L.tileLayer('/database/traffic/table/emme_costliest/{z}/{x}/{y}.png?cache_policy=persist&sql=SELECT DISTINCT ON(c.fid) c.*, ST_MakeLine(a.geom, b.geom) AS geom FROM emme_veh AS c, emme_nodes3857 AS b, emme_nodes3857 AS a WHERE c.fid = a.id AND c.tid = b.id AND ST_Distance(a.geom, b.geom) < '+this.props.distance+' AND c.cost > 1 ORDER BY c.fid, c.cost DESC', {
		// 	maxZoom: 18
		// }).addTo(this.map);

		var emme_nodes_grid = new L.UtfGrid('/database/traffic/table/emme_nodes3857/{z}/{x}/{y}.grid.json?cache_policy=persist&interactivity=id,inboai&sql=select geom,id,inboai::text from emme_nodes3857', {
		    useJsonP: false
		});

		var handleGridClick = this.handleGridClick;
		emme_nodes_grid.on('click', function (e) {  
		    //click events are fired with e.data==null if an area with no hit is clicked
		    if (e.data) {
		        handleGridClick(e.data);
		    }
		});

		this.map.addLayer(emme_nodes_grid);




		// this.map.on("click", function(e) {
		// 	console.log('e', e);
	 //        $.ajax({
	 //            url: "/api/v1/startpoint?lat="+e.latlng.lat+"&lon="+e.latlng.lng
	 //        }).done(function(data) {
	 //            var startpoint = JSON.parse(data);
	 //            console.log('startpoint.id', startpoint.id);
	 //            $.ajax({
	 //            	url: "/api/v1/catchment/" + window.clientid + "?startingpoint=" + startpoint.id
	 //            }).done(function(polygons) {
	 //            	console.log('polygons', polygons);
	 //            	if(polygons.length>0) {
	 //            		for(var i in polygons) {
	 //            			var geojsonObject = polygons[i].st_asgeojson;
	 //            			console.log(geojsonObject);
	            			
	 //            			new L.geoJson(JSON.parse(geojsonObject), {}).addTo(window.map);
	 //            		}
	 //            	}
	 //            });
  //          });
		// });








		/************** ROUTING ******************************************************/

		/**
		 * Load and draw all polygon data for this client id
		 */

		$.ajax({
		  url: "/api/v1/polygons/" + window.clientid
		}).done(function(polygons) {
		  for (var i = 0; i < polygons.length; i++) {
		    if(polygons[i].geometry){
		        L.geoJson(
		            JSON.parse(polygons[i].geometry), {
		                style: function (feature) {
		                    return {
		                        color: 'teal',
		                        stroke: false,
		                        fillOpacity: 0.7
		                    };
		                }
		            }
		        ).addTo(map);
		    }
		  }
		});


		function calculateRoute(from, to) {
		    // clearRoutes();

		    var routeAjax = $.ajax({
		        url: "/api/v1/route/"+window.clientid+"?startedge="+from_data.source+"&endedge="+to_data.target
		    }).done(function(e) {
		        if(e.name === 'error') {
		            alert('Something went wrong. Please retry...');
		        } else {

		            var route_data = JSON.parse(e);

		            var routeStyle = function(feature) {
		                switch (feature.geometry.speed) {
		                    case 130: return {color: "green"};
		                    case 120: return {color: "green"};
		                    case 110: return {color: "darkgreen"};
		                    case 100: return {color: "darkgreen"};
		                    case 90:   return {color: "orange"};
		                    case 80:   return {color: "orange"};
		                    case 70:   return {color: "orange"};
		                    case 60:   return {color: "#CC6600"};
		                    case 50:   return {color: "red"};
		                    case 40:   return {color: "red"};
		                    case 30:   return {color: "darkred"};
		                    case 20:   return {color: "darkred"};
		                    case 10:   return {color: "darkred"};
		                    default: return {color: "blue"};
		                }                            
		            };

		            var routesLayer = L.geoJson([], {
		                style: routeStyle
		            }).addTo(map);

		            $.each(route_data, function(i, route) {
		                var route_segments = JSON.parse(route.geom_json);
		                
		                route_cost = route_cost + (route.cost * 100);
		                route_cost_ndw = route_cost_ndw + (route.traveltime / 100)

		                route_segments.speed = route.kmh;
		                routesLayer.addData(route_segments);
		                routes.push(routesLayer);
		            }); 
		            map.fitBounds(routesLayer.getBounds());		        } 
		    });  
		    return routeAjax;
		}



		function clearMap() {
		    // Clears map of all layers, markers, lines and such.
		    for(i in map._layers) {
		        if(map._layers[i]._path != undefined) {
		            try {
		                map.removeLayer(map._layers[i]);
		            }
		            catch(e) {
		                console.log("Problem with " + e + map._layers[i]);
		            }
		        }
		    }
		}
		function clearCircles() {
		    // Removes circles from map
		    for(var i in circles) { map.removeLayer(circles[i]); }
		}
		function clearStartCircles() {
		    // Removes startpoints from map
		    for(var i in startcircles) { map.removeLayer(startcircles[i]); }
		}
		function clearRoutes() {
		    // Reset costs
		    route_cost = 0.0;
		    route_cost_ndw = 0.0;

		    // Removes route polygons from map
		    for(var i in routes) { map.removeLayer(routes[i]); }
		    for(var i in start_popups) { map.removeLayer(start_popups[i]); }
		    for(var i in end_popups) { map.removeLayer(end_popups[i]); }
		}


		var voronoiLayer = L.featureGroup();

		d3.json("/api/v1/nodes", function(oa) {
			window.p = oa.map(function(v){
				return [v.lat, v.lon];
			});

			window.v = d3.geom.voronoi(p);
			p.map(function(r){
				var circ = new L.CircleMarker(new L.LatLng(r[1], r[0]), {
					stroke: false,
					fillOpacity: 0.2,
					clickable: false
				}).setRadius(2);
				circ.addTo(voronoiLayer);
			});
			v.map(function(r){
				var zonal_layer = L.polygon(r.map(function(rr){
					return new L.LatLng(rr[1], rr[0]);
				}), {
					stroke:'#000',
					weight: 1,
					opacity: 0.2,
					fill: false
				});
				zonal_layer.addTo(voronoiLayer);
			});
		});


		var svg = d3.select(map.getPanes().overlayPane).append("svg"),
		    g = svg.append("g").attr("class", "leaflet-zoom-hide");



		// d3.json("/api/v1/links", function(collection) {

			
		// 	// var bezier = [];
		// 	// window.bezier = bezier;
		// 	// for(var i in collection.features) {

		// 	// 	var pair1 = collection.features[i].geometry.coordinates[0][0];
		// 	// 	var pair2 = collection.features[i].geometry.coordinates[0][1];


		// 	// 	var x = window.map.latLngToContainerPoint(pair1).x;
		// 	// 	var y = window.map.latLngToContainerPoint(pair2).y;

		// 	// 	bezier.push({"x": x, "y": y});
		// 	// }
		//  //    svg.append("path")
		//  //        .attr("class", "route")
		//  //        .attr("speed", 2)
		//  //        .attr("d", lineFunction(bezier))
		//  //        .attr("stroke-dasharray", function (d) {return carLen(20) + "," + 40;})
		//  //        .attr("stroke-dashoffset", function (d) {return this.getTotalLength();})
		//  //        .attr("stroke", function(d) {return randomColor(color_brewer);})
		//  //        .call(function (path) {return lineTransition(parseFloat(2), path);});

		// 	var speed = 1;

		// 	var color_brewer = ["#a6cee3","#1f78b4","#b2df8a","#33a02c",
		// 	                    "#fb9a99","#e31a1c","#fdbf6f","#ff7f00",
		// 	                    "#cab2d6","#6a3d9a","#ffff99","#b15928"];
		// 	var randomColor = function (arr) {
		// 	    return arr[Math.floor(Math.random() * (arr.length + 1))];
		// 	};		
		// 	function projectPoint(x, y) {
		// 	  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		// 	  this.stream.point(point.x, point.y);
		// 	}
		// 	var lineTransition = function (speed, path) {
		// 	    path.transition()
		// 	        .duration(100000 / speed)
		// 	        .attr("stroke-dashoffset", 0)
		// 	        .each("end", function(d,i) {
		// 	            d3.select(this).remove();
		// 	        });
		// 	};
		// 	var lineLinearFunction = d3.svg.line()
		// 	    .x(function(d) { return d.x; })
		// 	    .y(function(d) { return d.y; })
		// 	    .interpolate("linear");


		// 	var lineFunction = d3.svg.line()
		// 	    .x(function(d) { return d.x; })
		// 	    .y(function(d) { return d.y; })
		// 	    .interpolate("basis");


		// 	var carLen = function(speed) {
		// 	    return  Math.pow(1.5, speed / 15.0) + 1;
		// 	};

		// 	var transform = d3.geo.transform({point: projectPoint}),
		// 	    path = d3.geo.path().projection(transform);
			
			
		// 	var feature = g.selectAll("path")
		// 	    .data(collection.features)
		// 	  .enter().append("path")
		//         .attr("class", "route")
		//         .attr("stroke-dasharray", function (d) {return carLen(speed) + "," + 2})
		//         .attr("stroke-dashoffset", function (d) {return 2})
		//         .attr("stroke", function(d) {return randomColor(color_brewer);})
		//         .call(function (path) {return lineTransition(parseFloat(2.0), path);});
			  
		// 	  window.map.on("viewreset", reset);
		// 	  reset();

		// 	  // Reposition the SVG to cover the features.
		// 	  function reset() {
		// 	    var bounds = path.bounds(collection),
		// 	        topLeft = bounds[0],
		// 	        bottomRight = bounds[1];

		// 	    svg .attr("width", bottomRight[0] - topLeft[0])
		// 	        .attr("height", bottomRight[1] - topLeft[1])
		// 	        .style("left", topLeft[0] + "px")
		// 	        .style("top", topLeft[1] + "px");

		// 	    g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

		// 	    feature.attr("d", path);
		// 	  }

		// });





		var baseLayers = {
		    "Topo": this.props.baseLayers[0].mapbox,
		    "Satellite": this.props.baseLayers[0].satellite,
		    "Elevation": this.props.baseLayers[0].elevation
		};

		var overlays = {
			"EMME Links": this.props.layers[0].emme_links,
		    "EMME T-lines": this.props.layers[0].emme_tlines,
			"EMME Nodes": this.props.layers[0].emme_nodes,
			"EMME Spider": this.props.layers[0].emme_spider,
			"Zones (Voronoi)": voronoiLayer
			// "Costliest": this.props.dynamicLayers[0].emme_costliest_dynamic
		};


		L.control.layers(baseLayers, overlays).addTo(this.map);

		this.map.on('boxzoomend', function(e) {
			console.log('boxzoomend!!', e);
		});

	},
	componentDidUpdate: function() {

		
		if(window.oldScenario !== this.props.scenario) {
			console.log('Scenario changed from ' + window.oldScenario + ' to ' + this.props.scenario + '!');
		}
		window.oldScenario = this.props.scenario;







		// if(this.props.clickedObject) {
		// 	console.log(this.props.clickedObject.id.toString());
		// 	var sql = 'WITH drivingdistance AS (SELECT seq, id1 AS node, cost FROM pgr_drivingDistance(\'SELECT id, source::int4, target::int4, length::float8 as cost FROM emme_links3857\', ' + this.props.clickedObject.id.toString() + ', 1, false, false)) SELECT * FROM drivingdistance d, emme_nodes3857 n WHERE d.node = n.gid';
		// 	 // var sql = 'WITH drivingdistance AS (SELECT seq, id1 AS node, cost FROM pgr_drivingDistance(\'SELECT id, source::int4, target::int4, length::float8 as cost FROM emme_links3857\', ' + this.props.clickedObject.id.toString() + ', 4, false, false)) SELECT n.gid, n.geom FROM drivingdistance d, emme_nodes3857 n WHERE d.node = n.gid';

		// 	if(this.props.dynamicLayers[0].emme_driveshed) window.map.removeLayer(this.props.dynamicLayers[0].emme_driveshed);
		// 	this.props.dynamicLayers[0].emme_driveshed = L.tileLayer(
		// 		'/database/traffic/table/emme_nodes3857/{z}/{x}/{y}.png?cache_policy=persist&sql='+sql, {
		// 		maxZoom: 18
		// 	}).addTo(window.map);
		// 	this.props.dynamicLayers[0].emme_driveshed.bringToFront();
		// }


		// if(this.props.clickedObject) {
		// 	console.log('this.props.clickedObject:', this.props.clickedObject);

		// 	var sql = 'SELECT c.*, ST_MakeLine(a.geom, b.geom) AS geom FROM emme_veh AS c, emme_nodes3857 AS b, emme_nodes3857 AS a WHERE c.fid = a.id AND c.tid = b.id AND c.fid = ' + this.props.clickedObject.id.toString() + ' AND ST_Distance(a.geom, b.geom) < 5000';
		// 	if(this.props.dynamicLayers[0].emme_costliest_dynamic) window.map.removeLayer(this.props.dynamicLayers[0].emme_costliest_dynamic);
		// 	this.props.dynamicLayers[0].emme_costliest_dynamic = L.tileLayer(
		// 		'/database/traffic/table/emme_costliest/{z}/{x}/{y}.png?cache_policy=persist&sql='+sql, {
		// 		maxZoom: 18
		// 	}).addTo(window.map);
		// 	this.props.dynamicLayers[0].emme_costliest_dynamic.bringToFront();
		// }

		// if(this.props.distance) {

		// 	// if(this.props.dynamicLayers[0].emme_costliest_dynamic) window.map.removeLayer(this.props.dynamicLayers[0].emme_costliest_dynamic);
		// 	// this.props.dynamicLayers[0].emme_costliest_dynamic = L.tileLayer(
		// 	// 	'/database/traffic/table/emme_costliest/{z}/{x}/{y}.png?cache_policy=persist&sql=SELECT DISTINCT ON(c.fid) c.*, ST_MakeLine(a.geom, b.geom) AS geom FROM emme_veh AS c, emme_nodes3857 AS b, emme_nodes3857 AS a WHERE c.fid = a.id AND c.tid = b.id AND ST_Distance(a.geom, b.geom) < ' + this.props.distance.toString() + ' AND c.cost > 0 ORDER BY c.fid, c.cost DESC', {
		// 	// 	maxZoom: 18
		// 	// }).addTo(window.map);
		// 	// this.props.dynamicLayers[0].emme_costliest_dynamic.bringToFront();

		// 	return true;
		// }
	},
	render: function() {
		return (
			<div className="Map" id="map" style={{height: this.props.mapHeight}}></div>
		)
	}
});

module.exports = Map;