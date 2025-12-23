module.exports = {
//
//
  friendlyName: 'Destroy manager',
  //
  //
  description: 'Destroy the specified connection manager and destroy all of its active connections.',


  sideEffects: 'idempotent',
  //
  //
  inputs: {
    //
    manager: {
      friendlyName: 'Manager',
      description: 'The connection manager instance to destroy.',
      extendedDescription: 'Only managers built using the `createManager()` method of this driver are supported.  Also, the database connection manager instance provided must not have already been destroyed--i.e. once `destroyManager()` is called on a manager, it cannot be destroyed again (also note that all existing connections become inactive).',
      example: '===',
      required: true
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
      description: 'The specified manager and all of its active connections were successfully destroyed.',
      outputFriendlyName: 'Report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: {
        meta: '==='
      }
    },
    //
    failed: {
      friendlyName: 'Failed',
      description: 'Could not destroy the provided connection manager.',
      extendedDescription:
        'Usually, this means the manager has already been destroyed.  But depending on the driver ' +
        'it could also mean that database cannot be accessed.  In production, this can mean that the database ' +
        'server(s) became overwhelemed or were shut off while some business logic was in progress.',
      outputFriendlyName: 'Report',
      outputDescription: 'The `error` property is a JavaScript Error instance with more information and a stack trace.  The `meta` property is reserved for custom driver-specific extensions.',
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
    var Pack = require('../');

    // First back up redisClients array, so we're not mutating it as we iterate over each one.
    // (since releaseConnection() removes items from the array)
    var _redisClients = [].concat(inputs.manager.redisClients);

    // Now call releaseConnection() on each redis client under management.
    try {
      for (var i = 0; i < _redisClients.length; i++) {
        var redisClient = _redisClients[i];
        await new Promise((resolve, reject) => {
          Pack.releaseConnection({
            connection: redisClient
          }).exec((err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      }

      // All redis clients under management have been annihilated.
      return exits.success();
    } catch (err) {
      return exits.failed({
        error: new Error('Failed to destroy the Redis manager and/or gracefully end all connections under management.  Details:\n=== === ===\n' + err.stack)
      });
    }
  }


};
