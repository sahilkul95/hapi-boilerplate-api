const Glue = require('@hapi/glue');
const { manifest, project } = require('./config');

const options = {
  relativeTo: __dirname
};

const startServer = async function () {
  try {
    const server = await Glue.compose(manifest, options);
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
