module.exports = {
//
//
  friendlyName: 'Get connection',
  //
  //
  description: 'Get an active connection to Redis.',
  //
  //
  inputs: {
    //
    manager: {
      friendlyName: 'Manager',
      description: 'The connection manager instance to acquire the connection from.',
      extendedDescription:
        'Only managers built using the `createManager()` method of this driver are supported. ' +
        'Also, the database connection manager instance provided must not have been destroyed--' +
        'i.e. once `destroyManager()` is called on a manager, no more connections can be acquired ' +
        'from it (also note that all existing connections become inactive-- see `destroyManager()` ' +
        'for more on that).',
      example: '===',
      required: true
    },

    timeout: {
      friendlyName: 'Timeout',
      description: 'The amount of time, in milliseconds, to allow for a successful connection to take place.',
      example: 10000,
      defaultsTo: 15000
    },
    //
    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions.  Please refer to the documentation for the driver you are using for more specific information.',
      example: '==='
    }
    //
  },
  //
  //
  exits: {
    //
    success: {
      description: 'A connection was successfully acquired.',
      extendedDescription: 'This connection should be eventually released.  Otherwise, it may time out.  '+
        'It is not a good idea to rely on database connections timing out-- be sure to release this connection '+
        'when finished with it!\n'+
        '\n'+
        'In the report returned from this exit:\n'+
        ' + The `connection` property is an active connection to the database.\n'+
        ' + The `meta` property is reserved for custom driver-specific extensions.',
      outputFriendlyName: 'Report',
      outputDescription: 'A dictionary reporting any relevant output from this machine under these circumstances.',
      outputExample: {
        connection: '===',
        meta: '==='
      }
    },
    //
    failed: {
      description: 'Could not acquire a connection to the database using the specified manager.',
      extendedDescription: 'This might mean any of the following:\n' +
        ' + the credentials encoded in the connection string are incorrect\n' +
        ' + there is no database server running at the provided host (i.e. even if it is just that the database process needs to be started)\n' +
        ' + there is no software "database" with the specified name running on the server\n' +
        ' + the provided connection string does not have necessary access rights for the specified software "database"\n' +
        ' + this Node.js process could not connect to the database, perhaps because of firewall/proxy settings\n' +
        ' + any other miscellaneous connection error\n'+
        '\n'+
        'In the report returned from this exit:\n'+
        ' + The `error` property is a JavaScript Error instance explaining that a connection could not be made.\n'+
        ' + The `meta` property is reserved for custom driver-specific extensions.'+
        '',
      outputFriendlyName: 'Report',
      outputDescription: 'A dictionary reporting any relevant output from this machine under these circumstances.',
      outputExample: {
        error: '===',
        meta: '==='
      }
    }
    //
  },
  //
  //
  fn: async function (inputs, exits){
    var _ = require('@sailshq/lodash');
    var redis = require('redis');
    var flaverr = require('flaverr');

    // Build a local variable (`redisClientOptions`) to house a dictionary
    // of additional Redis client options that will be passed into createClient().
    // (this is pulled from the `meta` manager)
    //
    // For a complete list of available options, see:
    //  • https://github.com/redis/node-redis#client-configuration
    var redisClientOptions = Object.assign({}, inputs.manager.meta || {});

    // Parse connection string and merge with options
    // The new redis client accepts a URL directly
    var connectionUrl = inputs.manager.connectionString;

    // Create Redis client with the connection URL
    var client;
    try {
      var socketOptions = Object.assign({
        connectTimeout: inputs.timeout
      }, redisClientOptions.socket || {});

      client = redis.createClient(Object.assign({
        url: connectionUrl
      }, redisClientOptions, {
        socket: socketOptions
      }));
    } catch (e) {
      // If a "TypeError" was thrown, it means something was wrong with
      // one of the provided client options.  We assume the issue was with
      // the connection string, since this is the case 99% of the time.
      if (e.name === 'TypeError') {
        return exits.failed({error: new Error('Invalid Redis client options in manager. Details: ' + e.stack)});
      }
      return exits.failed({error: e});
    }

    // Set up error handler before connecting to catch connection errors
    var connectionError;
    var errorHandler = function(err) {
      connectionError = err;
    };
    client.on('error', errorHandler);

    // Try to connect with timeout
    try {
      // Connect to Redis (this is a promise in v5)
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(flaverr('E_REDIS_CONNECTION_TIMED_OUT',
              new Error('Took too long to connect to the specified Redis session server.\n' +
                'You can change the allowed connection time by setting the `timeout` input (currently ' +
                inputs.timeout + 'ms).')));
          }, inputs.timeout);
        })
      ]);

      // Remove the temporary error handler
      client.off('error', errorHandler);

      // If we had a connection error, handle it
      if (connectionError) {
        // Check for authentication errors
        if (connectionError.message && connectionError.message.includes('WRONGPASS')) {
          await client.disconnect();
          return exits.failed({
            error: flaverr('ERR_BAD_PASSWORD', new Error('The password supplied to the Redis server was incorrect.'))
          });
        }
        if (connectionError.message && connectionError.message.includes('NOAUTH')) {
          await client.disconnect();
          return exits.failed({
            error: flaverr('ERR_NO_PASSWORD', new Error('The Redis server requires a password, but none was supplied.'))
          });
        }
        // Other connection error
        await client.disconnect();
        return exits.failed({error: connectionError});
      }

    } catch(err) {
      // Connection failed or timed out
      try {
        await client.disconnect();
      } catch(_disconnectErr) {
        // Ignore disconnect errors
      }
      return exits.failed({error: err});
    }

    // Bind permanent error handler for unexpected failures after connection
    client.on('error', function onIntraConnectionError (err){
      // If manager was not provisioned with an `onUnexpectedFailure`,
      // we'll just handle this error event silently (to prevent crashing).
      if (!_.isFunction(inputs.manager.onUnexpectedFailure)) {
        return;
      }

      var errToSend = new Error();
      errToSend.connection = client;
      errToSend.failureType = 'error';

      if (err) {
        errToSend.originalError = err;
        if (/ECONNREFUSED/g.test(err.message || err.toString())) {
          errToSend.message =
              'Error emitted from Redis client: Connection to Redis server was lost (ECONNREFUSED). ' +
              'Waiting for Redis client to come back online (if configured to do so, auto-reconnecting behavior ' +
              'is happening in the background).\n' +
              'Error details: ' + err.stack;
        } else {
          errToSend.message = 'Error emitted from Redis client.\nError details: ' + err.stack;
        }
      } else {
        errToSend.message = 'Error emitted from Redis client.\n (no other information available)';
      }

      inputs.manager.onUnexpectedFailure(errToSend);
    });

    // Now track this Redis client as one of the "redisClients" on our manager
    // (since we want to be able to call destroyManager to wipe them all)
    inputs.manager.redisClients.push(client);

    // Save a reference to our manager instance on the redis client.
    if (client._fromWLManager) {
      return exits.error(new Error('Consistency violation: Somehow, a `_fromWLManager` key already exists on this Redis client instance!'));
    }
    client._fromWLManager = inputs.manager;

    // Finally, send back the Redis client as our active "connection".
    return exits.success({
      connection: client
    });

  }


};
