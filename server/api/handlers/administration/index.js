const user = require('./user');
const test = require('./test');

exports.routes = Array.prototype.concat(user.routes, test.routes);
