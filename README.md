# Jarmo Socket.IO
Socket.IO middleware for Jarmo.

## Configuration
Taken directly from the source:

```javascript
/**
 * @param {object}   config
 * @param {string}   config.host          Host of the Jarmo server.
 * @param {number}   config.port          Port of the Jarmo server.
 * @param {function} config.onError       Error handling function.
 * @param {function} config.onConnect     The payload resolving function for
 *                                        when a client connects.
 * @param {function} config.onDisconnect  The payload resolving function for
 *                                        when a client disconnects.
 */
```
The configuration is very similar to [jarmo-express](N4SJAMK/jarmo-express),
however here you have two separate payload resolvers, for both `connect` and
`disconnect` events. Similarly to [jarmo-express](N4SJAMK/jarmo-express), you
must set the `JARMO_ENABLE` environmental variable for this to actually work.

## Example
```javascript
var io    = require('socket.io')();
var jarmo = require('jarmo-socket.io');

function onConnect(socket, numConn) {
	return {
		n_connections: numConn
	}
}

server.use(jarmo({ onConnect: onConnect }));

// ...

server.listen(process.env.PORT);
```
