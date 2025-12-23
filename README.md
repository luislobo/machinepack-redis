
<h1>
  <a href="http://node-machine.org" title="Node-Machine public registry"><img alt="node-machine logo" title="Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machinepack-redis
</h1>

### [Docs](http://node-machine.org/machinepack-redis) &nbsp; [Browse other machines](http://node-machine.org/machinepacks) &nbsp;  [FAQ](http://node-machine.org/implementing/FAQ)  &nbsp;  [Newsgroup](https://groups.google.com/forum/?hl=en#!forum/node-machine)

Structured Node.js bindings for Redis with support for modern Redis features.

> This package contains relatively low-level functionality, and it is designed to provide building blocks for higher-level abstractions (e.g. an ORM like Waterline).

## ⚡ What's New in This Fork

This is an actively maintained fork with major upgrades:

- **Redis v5.10.0** - Latest official Redis client with full async/await support
- **Modern Node.js** - Requires Node.js >= 18.0.0
- **GitHub Actions CI** - Replaced Travis CI with modern GitHub Actions workflow
- **Docker Compose** - Included setup for testing with Redis (standard, auth, Sentinel, Cluster)
- **ESLint 9** - Modern flat config format
- **Async/Await API** - All machines now use async/await internally
- **Prepared for advanced features** - Infrastructure ready for Sentinel and Cluster support

## Requirements

- **Node.js >= 18.0.0**
- Redis server (or use the provided Docker Compose setup)

## Installation &nbsp; [![NPM version](https://badge.fury.io/js/machinepack-redis.svg)](http://badge.fury.io/js/machinepack-redis)

```sh
$ npm install machinepack-redis --save
```


## Quick Start

### Using Docker for Development

Start a Redis server using Docker Compose:

```bash
# Start basic Redis server
docker compose up -d redis

# Or start Redis with authentication
docker compose up -d redis-auth

# Or start a complete Sentinel setup (coming soon)
docker compose up -d redis-sentinel-master redis-sentinel-replica redis-sentinel-1 redis-sentinel-2 redis-sentinel-3

# Or start a Redis Cluster (coming soon)
docker compose up -d redis-cluster-1 redis-cluster-2 redis-cluster-3 redis-cluster-4 redis-cluster-5 redis-cluster-6 redis-cluster-init
```

### Basic Usage Example

The example in [examples/basic-usage.js](examples/basic-usage.js) contains a ready-to-use function useful for obtaining one-off access to a Redis connection.
Under the covers, in the function's implementation, you can see how to manage the Redis connection lifecycle, as well as how to implement thorough, production-level error handling.

> ##### Setup instructions for the example above
> 
> Using Docker (recommended):
> ```bash
> docker compose up -d redis
> node examples/basic-usage.js
> ```
>
> Or using a local Redis server:
> ```bash
> redis-server
> node examples/basic-usage.js
> ```


## Usage

For the latest usage documentation, version information, and test status of this module, see <a href="http://node-machine.org/machinepack-redis" title="Structured Node.js bindings for Redis. (for node.js)">http://node-machine.org/machinepack-redis</a>.  The generated manpages for each machine contain a complete reference of all expected inputs, possible exit states, and example return values.  If you need more help, or find a bug, jump into [Gitter](https://gitter.im/node-machine/general) or leave a message in the project [newsgroup](https://groups.google.com/forum/?hl=en#!forum/node-machine).

## Connection String Format

This package supports the standard Redis connection URL format:

```
redis://[[username][:password]@][host][:port][/database]
```

Examples:
- `redis://localhost:6379` - Basic connection
- `redis://:mypassword@localhost:6379/0` - With password (Redis < 6)
- `redis://default:mypassword@localhost:6379/0` - With username and password (Redis 6+ ACL)
- `redis://redis.example.com:6380/5` - Custom host, port, and database

## Development

### Running Tests

```bash
# Start Redis server via Docker
docker compose up -d redis

# Run tests
npm test

# Run linter
npm run lint

# Generate coverage report
npm run coverage
```

### Project Structure

- `machines/` - Individual machine definitions (connection management, cache operations)
- `tests/` - Test suites
- `examples/` - Usage examples
- `docker-compose.yml` - Redis server configurations for testing

## About  &nbsp; [![Gitter](https://badges.gitter.im/JoinChat.svg)](https://gitter.im/node-machine/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a [machinepack](http://node-machine.org/machinepacks), an NPM module which exposes a set of related Node.js [machines](http://node-machine.org/spec/machine) according to the [machinepack specification](http://node-machine.org/spec/machinepack).
Documentation pages for the machines contained in this module (as well as all other NPM-hosted machines for Node.js) are automatically generated and kept up-to-date on the <a href="http://node-machine.org" title="Public machine registry for Node.js">public registry</a>.
Learn more at <a href="http://node-machine.org/implementing/FAQ" title="Machine Project FAQ (for implementors)">http://node-machine.org/implementing/FAQ</a>.


## License

MIT &copy; 2015, 2016, 2025 contributors

