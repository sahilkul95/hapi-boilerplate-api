const jwt = require('jsonwebtoken');
const Boom = require('boom');

exports.plugin = {
  name: 'siloauth',
  register: function (server) {
    const scheme = function () {
      return {
        authenticate: function (req, h) {

          const authorization = req.headers.authorization;
          if (!authorization) {
            throw Boom.unauthorized(null, 'Custom');
          }
          try {
            // console.log(`verifying ${req.headers.authorization} with ${req.config.project.secret}`);
            const decoded = jwt.verify(req.headers.authorization, req.config.project.secret + '-admin');

            // console.log(`decoded`, decoded);
            if (!(decoded.id)) {
              throw Boom.unauthorized(null, 'Custom');
            }
            return h.authenticated({ credentials: { id: decoded.id } });
          } catch (JWTException) {
            // console.warn(JWTException);
            throw Boom.unauthorized(null, 'Custom');
          }
        }
      };
    };
    server.auth.scheme('silojwt', scheme);
    server.auth.strategy('silo', 'silojwt');
    // server.auth.default('jwt');
  }
};
