const auth = require('./handlers/auth');
const administration = require('./handlers/administration');

exports.plugin = {
  name: 'api',
  register: (server) => {
    server.route(Array.prototype.concat(
      auth.routes, administration.routes
    ));
  }
};
