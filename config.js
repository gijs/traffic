var _ = require('underscore');

config = {};

config.pg = {};
config.pg.conString = "tcp://traffic:traffic@localhost/traffic";

config.mapnik = {};

config.mapnik.postgis_emme_tlines_settings = {
  'dbname' : 'traffic',
  'table' : 'emme_tlines3857',
  'user' : 'traffic',
  'password': 'traffic',
  'type' : 'postgis',
  'extent' : '-20005048.4188,-9039211.13765,19907487.2779,17096598.5401'  //change this if not merc
};


config.mapnik.postgis_emme_links_settings = {
  'dbname' : 'traffic',
  'table' : 'emme_links3857',
  'user' : 'traffic',
  'password': 'traffic',
  'type' : 'postgis',
  'extent' : '-20005048.4188,-9039211.13765,19907487.2779,17096598.5401'  //change this if not merc
};

config.mapnik.postgis_emme_nodes_settings = {
  'dbname' : 'traffic',
  'table' : 'emme_nodes3857',
  'user' : 'traffic',
  'password': 'traffic',
  'type' : 'postgis',
  'extent' : '-20005048.4188,-9039211.13765,19907487.2779,17096598.5401'  //change this if not merc
};


config.windshaft = {};
config.windshaft = {
    base_url: '/database/:dbname/table/:table',
    base_url_notable: '/database/:dbname',
    grainstore: {
         datasource: {
            user:'traffic', 
            password:'traffic',
            host: 'localhost', 
            geometry_field: 'geom',
            port: 5432
        }
    }, // see grainstore npm for other options
    redis: {
        host: '127.0.0.1', 
        port: 6379
    },
    renderCache: {
      ttl: 60000, // seconds
    },    
    enable_cors: true,
    req2params: function(req, callback){

        // no default interactivity. to enable specify the database column you'd like to interact with
        // req.params.interactivity = 'id';
        // req.params.cache_buster = '3124124';
        // req.params.cache_policy = 'persist';
        // this is in case you want to test sql parameters eg ...png?sql=select * from my_table limit 10
        req.params =  _.extend({}, req.params);
        _.extend(req.params, req.query);

        // send the finished req object on
        callback(null,req);
    }
};



module.exports = config;


