module.exports = {


  friendlyName: 'Get connection',


  description: 'Get an active connection to Redis.',


  extendedDescription: 'This may involve opening a new connection, or aquiring an already-open connection from an existing pool.  The implementation is left up to the driver.',


  moreInfoUrl: 'https://github.com/NodeRedis/node_redis#rediscreateclient',


  inputs: {

    connectionString: {
      description: 'A string containing all metadata and credentials necessary for connecting to the database.',
      moreInfoUrl: 'https://github.com/mikermcneil/machinepack-redis',
      example: 'redis://:secrets@example.com:1234/9',
      required: true
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional Redis-specific options to use when connecting.',
      moreInfoUrl: 'https://github.com/mikermcneil/machinepack-redis',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'A connection was successfully acquired.',
      extendedDescription: 'This connection should be eventually released.  Otherwise, it may time out.  It is not a good idea to rely on database connections timing out-- be sure to release this connection when finished with it!',
      outputVariableName: 'report',
      outputDescription: 'The `connection` property is an active connection to the database.  The `meta` property is reserved for custom driver-specific extensions.',
      example: {
        connection: '===',
        meta: '==='
      }
    },

    malformed: {
      description: 'The provided connection string is malformed (the driver DID NOT ATTEMPT to acquire a connection).',
      extendedDescription: 'The format of connection strings varies across different databases and their drivers.  This exit indicates that the provided string is not valid as per the custom rules of this driver.',
      outputVariableName: 'report',
      outputDescription: 'The `error` property is a JavaScript Error instance explaining that (and preferably "why") the provided connection string is invalid.  The `meta` property is reserved for custom driver-specific extensions.',
      example: {
        error: '===',
        meta: '==='
      }
    },

    failedToConnect: {
      description: 'Could not acquire a connection to the database using the specified connection string.',
      extendedDescription: 'This might mean any of the following:\n'+
      ' + the credentials encoded in the connection string are incorrect\n'+
      ' + there is no database server running at the provided host (i.e. even if it is just that the database process needs to be started)\n'+
      ' + there is no software "database" with the specified name running on the server\n'+
      ' + the provided connection string does not have necessary access rights for the specified software "database"\n'+
      ' + this Node.js process could not connect to the database, perhaps because of firewall/proxy settings\n'+
      ' + any other miscellaneous connection error',
      outputVariableName: 'report',
      outputDescription: 'The `error` property is a JavaScript Error instance explaining that a connection could not be made.  The `meta` property is reserved for custom driver-specific extensions.',
      example: {
        error: '===',
        meta: '==='
      }
    }

  },


  fn: function (inputs, exits) {
    var Url = require('url');
    var redis = require('redis');

    // Validate connection string (call `malformed` if invalid).
    try {
      Url.parse(inputs.connectionString);
    }
    catch (e) {
      e.message = 'Provided value (`'+inputs.connectionString+'`) is not a valid Redis connection string.';
      e.stack = e.message+'  '+e.stack;
      return exits.malformed({
        error: e
      });
    }

    // Build a local variable (`redisClientOptions`) to house a dictionary
    // of additional Redis client options that will be passed into createClient().
    // (this is pulled from the `meta` input)
    //
    // For a complete list of available options, see:
    //  • https://github.com/NodeRedis/node_redis#options-is-an-object-with-the-following-possible-properties
    var redisClientOptions = {};
    if ( !util.isUndefined(inputs.meta) ) {
      if ( !util.isObject(inputs.meta) ) {
        return exits.error('If provided, `meta` must be a dictionary.');
      }
      else if ( inputs.meta.redisClientOptions ) {
        if ( !util.isObject(inputs.meta.redisClientOptions) ) {
          return exits.error('If provided, `meta.redisClientOptions` must be a dictionary.');
        }
        else {
          redisClientOptions = inputs.meta.redisClientOptions;
        }
      }
    }

    // Create Redis client
    var client = redis.createClient(inputs.connectionString, redisClientOptions);

    // ** * * ** ** THIS MAY NOT BE NECESSARY * ** *** ****
    //  (that's why it's commented out)
    // ** * * ** **  **********************   * ** *** ****
    // If a password was provided, authenticate with it.
    // if (config.password) {
    //   client.auth(config.password);
    // }
    // ** * * ** **  **********************   * ** *** ****

    // Bind an "error" listener so that we can track errors that occur
    // during the connection process.
    client.once('error', function onPreConnectionError (err){
      client.removeListener('end', onPreConnectionEnd);
      client.removeListener('error', onPreConnectionError);

      return exits.failedToConnect({
        error: err || new Error('Redis client fired "error" event before it finished connecting.')
      });
    });

    // Bind an "end" listener in case the client "ends" before
    // it successfully connects...
    client.once('end', function onPreConnectionEnd(){
      client.removeListener('end', onPreConnectionEnd);
      client.removeListener('error', onPreConnectionError);

      return exits.failedToConnect({
        error: new Error('Redis client fired "end" event before it finished connecting.')
      });
    });

    // Bind a "ready" listener so that we know when the client has connected.
    client.once('ready', function (){

      // ** * * ** ** THIS MAY NOT BE NECESSARY * ** *** ****
      //  (that's why it's commented out)
      // ** * * ** **  **********************   * ** *** ****
      // If the name of a particular Redis database was specified, "select" it.
      // if ( !util.isUndefined(redisDatabaseName) ) {
      //   client.select(redisDatabaseName);
      // }
      // ** * * ** **  **********************   * ** *** ****

      client.removeListener('end', onPreConnectionEnd);
      client.removeListener('error', onPreConnectionError);

      // Bind "error" handler to prevent crashing the process if error events
      // are emitted later on (e.g. if the Redis server crashes or the connection
      // is lost for any other reason).
      // See https://github.com/mikermcneil/waterline-query-builder/blob/master/docs/errors.md#when-a-connection-is-interrupted
      client.on('error', function (err){
        if (err) {
          if (/ECONNREFUSED/g.test(err)) {
            console.warn('Warning: Error emitted from Redis client: Connection to Redis server was lost (ECONNREFUSED). Waiting for Redis client to come back online. Currently there are %d underlying Redis connections:', client.connections.length, client.connections);
          }
          else {
            console.warn('Warning: Error emitted from Redis client. Error details:',err);
          }
        }
        else {
          console.warn('Warning: Error emitted from Redis client. (no other information available)');
        }
      });

      // Finally, send back the Redis client as our active "connection".
      return exits.success({
        connection: client
      });
    });

  }


};