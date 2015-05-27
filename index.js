'use strict';

var dgram  = require('dgram');
var client = dgram.createSocket('udp4');

/**
 * The 'jarmo-socket.io' is a simple SocketIO middleware. It allows for stats
 * recording when a client connects and disconnects.
 *
 * @param {object}   config
 * @param {string}   config.host          Host of the Jarmo server.
 * @param {number}   config.port          Port of the Jarmo server.
 * @param {function} config.onError       Error handling function.
 * @param {function} config.onConnect     The payload resolving function for
 *                                        when a client connects.
 * @param {function} config.onDisconnect  The payload resolving function for
 *                                        when a client disconnects.
 *
 * @return {function} The middleware function.
 */
module.exports = function jarmo(config) {
	// Make sure the configuration is of the correct format.
	config      = config      || { }
	config.host = config.host || 'localhost';
	config.port = config.port || 8000;

	// Make sure we are going to call some sort of a function.
	var onError      = config.onError      || defaultError;
	var onConnect    = config.onConnect    || defaultConnect;
	var onDisconnect = config.onDisconnect || defaultDisconnect;

	/**
	 * The actual middleware function.
	 */
	return function jarmoSocketIO(socket, next) {
		if(!process.env.JARMO_ENABLE) {
			console.log([
				'By default \'jarmo-socket.io\' is disabled, enable it by',
				'setting the JARMO_ENABLE environmental variable.'
			].join(' '));
			// By default 'jarmo-socket.io' is disabled, so using this in a
			// development environment won't attempt to send any metrics.
			return next();
		}

		// Starting value used to record the duration of connection.
		var start    = Date.now();
		var cpayload = onConnect(socket, num(socket));

		// If we have a payload for 'connect', send it.
		if(cpayload) {
			send(config.host, config.port, cpayload, function(err) {
				if(err) {
					return onError(err);
				}
			});
		}

		socket.once('disconnect', function() {
			// We should only need to listen 'once' to socket disconnects. This
			// should be double checked and tested though...
			var end       = Date.now() - start;
			var dcpayload = onDisconnect(socket, num(socket), end);

			// If we have a payload for 'disconnect', send it.
			if(dcpayload) {
				send(config.host, config.port, dcpayload, function(err) {
					if(err) {
						return onError(err);
					}
				});
			}
		});
		return next();
	}
}

/**
 * Get the number of connected clients.
 *
 * @param {object} socket  Instance of 'Socket' used to access the underlying
 *                         Server object for number of clients.
 *
 * @return {number} Number of connected clients.
 */
function num(socket) {
	return socket.server.engine.clientsCount;
}

/**
 * Send data via UDP to the target server.
 *
 * @param {string} host     Server host.
 * @param {string} port     Server port.
 * @param {object} payload  Payload object, that will be made into a string,
 *                          and sent to the server.
 *
 * @return {Promise}  Promise for sending the payload.
 */
function send(host, port, payload, callback) {
	// Create a Buffer of the JSON stringified payload, so we can send it.
	var data = new Buffer(JSON.stringify(payload));

	// Resolve or reject the promise once the we have at least attempted to
	// send the payload. Should we add some sort of a retry on error?
	return client.send(data, 0, data.length, port, host, callback);
}

/**
 * Default error handler function that is used if no 'error' handling function
 * is given in the configuration for the middleware.
 */
function defaultError(err) {
	console.log('[', new Date().toISOString(), ']',
		'Failed to send UDP packet(s),', err.message);
}

/**
 * Default function to construct the payload that is sent to Jarmo server, on a
 * 'connect' event.
 */
function defaultConnect(socket, numConn) {
	return {
		name: 'connections',
		total_connections: numConn
	}
}

/**
 * Default function to construct the payload that is sent to Jarmo server, on a
 * 'disconnect' event.
 */
function defaultDisconnect(socket, numConn, connDuration) {
	return {
		total_connections:   numConn,
		connection_duration: connDuration
	}
}
