/**
 * Module dependencies
 */

var Pack = require('../');


/**
 * Note: These tests should ideally not be redis-specific.
 * (that way we can reuse them for any driver implementing the "cache" interface layer)
 */

describe('destroyCachedValues()', function (){

  // Used to hold manager and active connection throughout the tests below.
  var manager;
  var connection;


  // The keys to use during tests.
  var keysUsed = ['machinepack-cache.test1', 'machinepack-cache.test2', 'machinepack-cache.test3', 'machinepack-cache.test4', 'machinepack-cache.test5', 'machinepack-cache.test6', 'machinepack-cache.test7', 'machinepack-cache.test8'];


  //  ┌┐ ┌─┐┌─┐┌─┐┬─┐┌─┐
  //  ├┴┐├┤ ├┤ │ │├┬┘├┤
  //  └─┘└─┘└  └─┘┴└─└─┘ooo
  //
  // Beforehand, create a manager and acquire an initial active
  // connection from it.
  before(function (done){
    Pack.createManager({
      // 15 = non standard database for the unit tests
      connectionString: 'redis://127.0.0.1:6379/15',
      meta: {
        auth_pass: 'qwer1234' // use alternative option
      }
    }).exec({
      error: done,
      success: function (report){
        // Save reference to manager.
        manager = report.manager;

        Pack.getConnection({
          manager: manager
        }).exec({
          error: function (err){
            done(new Error(JSON.stringify(err)));
          },
          failed: function (err){
            done(new Error(JSON.stringify(err)));
          },
          success: function (report){
            // Save reference to connection.
            connection = report.connection;

            // Now delete keys just to be safe.
            Pack.flushCache({
              connection: connection,
              meta: {
                db: 15 // non standard database for the unit tests
              }
            }).exec(done);
          }
        });
      }
    });
  }); //</before>


  //  ╔╗ ╔═╗╔═╗╦╔═╗  ╦ ╦╔═╗╔═╗╔═╗╔═╗
  //  ╠╩╗╠═╣╚═╗║║    ║ ║╚═╗╠═╣║ ╦║╣
  //  ╚═╝╩ ╩╚═╝╩╚═╝  ╚═╝╚═╝╩ ╩╚═╝╚═╝
  describe('with basic usage', function (){


    it('should work', function (done){

      Pack.cacheValue({
        connection: connection,
        key: 'test1',
        value: 'testValue'
      }).exec(function (){
        // Now delete keys just to be safe.
        Pack.destroyCachedValues({
          connection: connection,
          keys: ['test1']
        }).exec(function (){
          // Try to get the value from the cache
          Pack.getCachedValue({
            connection: connection,
            key: 'test1'
          }).exec({
            error: done,
            notFound: function (){
              return done();
            },
            success: function (){
              return done(new Error('Expecting `notFound` exit'));
            }
          });
        });
      });

    });//</it should work>

    it('should delete keys even if they do not exit', function (done){

      Pack.cacheValue({
        connection: connection,
        key: 'test1',
        value: 'testValue'
      }).exec(function (){
        // Now delete keys just to be safe.
        Pack.destroyCachedValues({
          connection: connection,
          keys: ['test1']
        }).exec(function (){
          // Try to get the deleted key from the cache
          Pack.getCachedValue({
            connection: connection,
            key: 'test1'
          }).exec({
            error: done,
            notFound: function (){
              // Try to get the non existing key from the cache
              Pack.getCachedValue({
                connection: connection,
                key: 'nonexistingkey'
              }).exec({
                error: done,
                notFound: function (){
                  return done();
                },
                success: function (){
                  return done(new Error('Expecting `notFound` exit'));
                }
              });
            },
            success: function (){
              return done(new Error('Expecting `notFound` exit'));
            }
          });
        });
      });

    });//</it should delete keys even if they do not exit>

    it('should fail when passed a string', function (done){

      Pack.destroyCachedValues({
        connection: connection,
        keys: 'somekeytodelete'
      }).exec({
        error: function (err){
          return done();
        },
        invalidKeys: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        failed: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        badConnection: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        success: function (report){
          return done(new Error('Expecting `error` exit'));
        }

      });

    });//</should fail when passed a string>

    it('should fail when passed a number', function (done){

      Pack.destroyCachedValues({
        connection: connection,
        keys: 1
      }).exec({
        error: function (err){
          return done();
        },
        invalidKeys: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        failed: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        badConnection: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        success: function (report){
          return done(new Error('Expecting `error` exit'));
        }
      });

    });//</it should fail when passed a number>

    it('should fail when passed a dictionary', function (done){

      Pack.destroyCachedValues({
        connection: connection,
        keys: {}
      }).exec({
        error: function (err){
          return done();
        },
        invalidKeys: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        failed: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        badConnection: function (report){
          return done(new Error('Expecting `error` exit'));
        },
        success: function (report){
          return done(new Error('Expecting `error` exit'));
        }
      });

    });//</it should fail when passed a dictionary>

  });//</with basic usage>


  //  ┌─┐┌─┐┌┬┐┌─┐┬─┐
  //  ├─┤├┤  │ ├┤ ├┬┘
  //  ┴ ┴└   ┴ └─┘┴└─ooo
  // Afterwards, destroy the keys that were set, and then also destroy the manager
  // (which automatically releases any connections).
  after(function (done){
    if (connection) {
      Pack.flushCache({
        connection: connection
      }).exec(function (err){
        // If there is an error deleting keys, log it but don't stop
        // (we need to be sure and destroy the manager)
        if (err) {
          console.error('ERROR: Could not destroy keys in test cleanup.  Details:\n', err);
        }
        Pack.destroyManager({
          manager: manager
        }).exec(done);
      });
    } else {
      done();
    }
  }); //</after>

});
