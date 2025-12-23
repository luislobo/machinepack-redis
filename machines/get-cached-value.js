module.exports = {


  friendlyName: 'Get cached value',


  description: 'Look up the cached value associated with the specified key.',


  sideEffects: 'cacheable',


  inputs: {

    connection: {
      friendlyName: 'Connection',
      description: 'An active Redis connection.',
      extendedDescription: 'The provided Redis connection instance must still be active.  Only Redis connection instances created by the `getConnection()` machine in this driver are supported.',
      example: '===',
      required: true
    },

    key: {
      friendlyName: 'Key',
      description: 'The unique key to look up.',
      extendedDescription: 'The case-sensitivity and allowable characters in keys may vary between drivers.',
      required: true,
      example: 'myNamespace.foo.bar_baz'
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional metadata to pass to the driver.',
      extendedDescription: 'This input is not currently in use, but is reserved for driver-specific customizations in the future.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'Value was sucessfully fetched.',
      outputFriendlyName: 'Report',
      outputDescription: 'The `value` property is the cached value that was just retrieved.  The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: {
        value: '*',
        meta: '==='
      }
    },

    notFound: {
      description: 'No value exists under the specified key.',
      outputFriendlyName: 'Report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: {
        meta: '==='
      }
    },

    badConnection: require('../constants/badConnection.exit')

  },


  fn: async function (inputs, exits){
    var _ = require('@sailshq/lodash');

    // Ducktype provided "connection" (which is actually a redis client)
    if (!_.isObject(inputs.connection) || !_.isFunction(inputs.connection.quit) || !_.isFunction(inputs.connection.disconnect)) {
      return exits.badConnection();
    }

    // Provided `connection` is a redis client.
    /**
     * redisClient
     */
    var redisClient = inputs.connection;


    try {
      var foundValue = await redisClient.get(inputs.key);

      // If the value is null, the value was not found in Redis
      if (foundValue === null) {
        return exits.notFound();
      }

      // Otherwise, JSON.parse() the value
      // (this is for consistency-- see `cache-value.js` for more info)
      try {
        foundValue = JSON.parse(foundValue);
      }
      catch (e) {
        return exits.error(e);
      }

      // Finally, call exits.success().
      return exits.success({
        value: foundValue
      });

    } catch (err) {
      return exits.error(err);
    }
  }

};
