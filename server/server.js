const Glue = require('glue');
const { manifest, storage, project } = require('./config');
const { MongoClient } = require('mongodb');

const options = {
  relativeTo: __dirname
};

const startServer = async function () {
  try {
    const server = await Glue.compose(manifest, options);
    const devServer = await MongoClient.connect(storage['devDB']);
    server.decorate('request', 'org', devServer.db('organization'));
    server.decorate('request', 'config', {
      project: project
    });
    await server.start();
    console.log('Server is listening on ' + server.info.uri.toLowerCase());
  }
  catch (err) {
    // console.error(err);
    console.log('server.register err:', err);
    process.exit(1);
  }
};

startServer();
