#!/bin/sh
# `/sbin/setuser redis` runs the given command as the user `redis`.
# If you omit that part, the command will be run as root.

exec /sbin/setuser redis /usr/bin/redis-server /etc/redis/redis.conf 2>&1