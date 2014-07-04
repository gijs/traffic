README
------

Instructions on how to get this up and running using Docker.


SERVER
======

 * Prerequisites:

  - Assign enough memory when running Docker
  - When using boot2docker (win/mac), assign like:

  	$ boot2docker init -m 5555
  	... lots of output ...

  - Double-check the memory allocation:

    $ boot2docker info
    { ... "Memory":5555 ...}


Optionally: Boot2docker (win/mac)
---------------------------------
 
 * Instructions for Mac

 * Install XCode and commandline tools. Install Homebrew.

 * Use Homebrew to install boot2docker, then:

   $ boot2docker up
   $ boot2docker ip # Use this IP in the next command
   $ export DOCKER_HOST=tcp://192.168.59.103:2375

  * To make DOCKER_HOST persist, add it to your .bashrc/.zshrc/etc.


Installation of the PostGIS stack
---------------------------------

 * Install the Oslandia PGGIS docker stack (https://github.com/vpicavet/docker-pggis):

   $ docker run -Pd --name pggis_daemon oslandia/pggis /sbin/my_init

 * This uses a Docker-optimized Trusty image

 * PostGIS will be installed, daemonizes and becomes available on the Docker ip ($ boot2docker ip)

 * Connect using `psql` like such (or use a GUI):

   $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password

 * Check out the portmapping using:

   $ docker ps -a


Loading data into PostGIS
-------------------------

 * Run the following SQL importing commands from the project root

  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_links3857.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_tlines3857.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_nodes3857.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_tz2013_3857.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_veh.sql
  
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_costliest.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/emme_spider.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/create_polygons_table.sql
  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < ./sql/create_sessions_table.sql

 * Download both the .osm and .pbf files for the desired region from Geofabrik.de

 * Download and unzip osm2po
 
  $ java -jar osm2po.jar prefix=sa ../southafrica.osm.pbf

  $ psql -h 192.168.59.103 -p 49153 -d pggis -U pggis --password < sa_2po_4pgr.sql


 Installation of the application stack
 -------------------------------------

 * In the project root:

  $ docker run -Pd --name capetown_app lizard/traffic /sbin/my_init

 * This uses a Docker-optimized Trusty image

 * Installs Redis, libhiredis, openjdk-7-jdk

 * Installs Mapnik2 (and mapnik-utils, libmapnik2-dev) and Node.js (and npm) from their PPA's

 * Installs Graphhopper (as a Linux service)

 * Checks out application code

 * Globally installs the bower, jsxc and react-tools NPM packages

 * Runs npm install, bower install, npm start

 * Returns output of `npm start` to log console

 * (optionally) Runs `npm run build`


 Self-service
 ------------

 * CartoCSS definitions

  $ curl -H "Content-Type: application/json" -d '{"style": "#emme_tlines3857 {line-width: 2;line-opacity:0.7;line-color:#000000;}"}' http://[ip]:8080/database/pggis/table/emme_tlines3857/style

  $ curl -H "Content-Type: application/json" -d '{"style": "#emme_costliest {line-width: 2;line-opacity:0.7;line-color:#ff0000;}"}' http://192.168.59.103:8080/database/pggis/table/emme_costliest/style

  $ curl -H "Content-Type: application/json" -d '{"style": "#emme_spider {line-width: 0.5;line-opacity:0.5;line-color:#551a8b;}"}' http://192.168.59.103:8080/database/pggis/table/emme_spider/style


