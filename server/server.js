const Glue = require('@hapi/glue');
const { manifest, project } = require('./config');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const options = {
  relativeTo: __dirname
};

const startServer = async function () {
  try {
    if (cluster.isMaster && 'production' === process.env.NODE_ENV) {
      // Fork workers.
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
      cluster.on('online', (worker) => {
        console.log('worker is online : ', worker.id);
      });
      cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
      });
    } else {
      const server = await Glue.compose(manifest, options);
      server.decorate('request', 'config', {
        project: project
      });

      await server.start();
      console.log('Server is listening on ' + server.info.uri.toLowerCase());
    }
  }
  catch (err) {
    // console.error(err);
    console.log('server.register err:', err);
    process.exit(1);
  }
};

startServer();
