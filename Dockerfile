FROM phusion/baseimage:0.9.10
MAINTAINER Gijs Nijholt, gijs.nijholt@nelen-schuurmans.nl

# Set correct environment variables.
ENV HOME /root

# Regenerate SSH host keys. baseimage-docker does not contain any, so you
# have to do that yourself. You may also comment out this instruction; the
# init system will auto-generate one during boot.
RUN /etc/my_init.d/00_regen_ssh_host_keys.sh

# Generate locales
RUN locale-gen en_US.UTF-8
RUN dpkg-reconfigure locales
RUN echo "LC_ALL=en_US.UTF-8" >> /etc/environment
RUN echo "LANG=en_US.UTF-8" >> /etc/environment


# Packages needed for compilation
RUN apt-get update

RUN apt-get install -y autoconf build-essential cmake docbook-mathml docbook-xsl libboost-dev libboost-filesystem-dev libboost-timer-dev libcgal-dev libcunit1-dev libgdal-dev libgeos++-dev libgeotiff-dev libgmp-dev libjson0-dev libjson-c-dev liblas-dev libmpfr-dev libopenscenegraph-dev libpq-dev libproj-dev libxml2-dev postgresql-server-dev-9.3 xsltproc git build-essential wget 

# Application packages
RUN apt-get install -y postgresql-client-9.3

# LuaRocks
RUN apt-get install -y luarocks

# The following was needed on Precise, not sure if also needed on Trusty:
RUN luarocks install luasql-postgres PGSQL_DIR=/usr/lib/postgresql/9.1/bin PGSQL_INCDIR=/usr/include/postgresql


# Mapnik 2
RUN apt-get install -y libmapnik2.2 mapnik-utils libmapnik2-dev

# Redis
RUN apt-get install -y redis-server libhiredis-dev

# Node.js
RUN apt-get install -y software-properties-common
RUN apt-get install -y python-software-properties
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN apt-get update
RUN apt-get install -y nodejs

# Modern g++ toolchain
RUN add-apt-repository -y ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get install -y g++-4.8

# JDK
RUN apt-get install -y openjdk-7-jdk


# Node mapnik (using npm)
RUN npm install -g mapnik

# Global node packages
RUN npm install -g bower
RUN npm install -g jsxc
RUN npm install -g react-tools
RUN npm install -g browserify
RUN npm install -g uglify-js 
RUN npm install -g reactify
RUN npm install -g envify
RUN npm install -g statics


# Build npm packages once and cache them
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src


# Add application bundle
ADD . /src
RUN cd /src/public/vendor; bower install --allow-root
# RUN cd /src/public/; npm run build



ADD redis.conf /etc/redis/redis.conf

RUN mkdir /etc/service/redis
RUN mkdir /etc/service/capetown

ADD redis.sh /etc/service/redis/run
ADD capetown.sh /etc/service/capetown/run


EXPOSE 8080

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]
