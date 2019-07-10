const acldb = require('./storage/acl/models');
const jwt = require('jsonwebtoken');
const Boom = require('hapi').boom;

exports.plugin = {
  name: 'siloauth',
  register: function (server) {
    const scheme = function () {
      return {
        authenticate: async function (req, h) {

          const authorization = req.headers.authorization;
          if (!authorization) {
            throw Boom.unauthorized(null, 'Custom');
          }
          try {
            // console.log(`verifying ${req.headers.authorization} with ${req.config.project.secret}`);
            const decoded = jwt.verify(req.headers.authorization, req.config.project.secret + '-admin');
            if (!(decoded.id && decoded.source && decoded.source === 'silo')) {
              throw Boom.unauthorized(null, 'Custom');
            }
            // console.log(`decoded`, decoded);
            if (!(decoded.id)) {
              throw Boom.unauthorized(null, 'Custom');
            }

            let session = await acldb.session.findById(decoded.id);
            if (!session) {
              throw Boom.unauthorized(null, 'Custom');
            }

            const userFields = [
              'companyID',
              'isClientAdmin',
              'name',
              'mobile',
              'email',
              'roleIDs',
              'sessions',
              'wardIDs',
              'departmentIDs',
              'zoneIDs',
              'isSiloAdmin',
              'isSupportUser',
              'displayName',
              'deletedAt'
            ];
            let user = await acldb.user.findById(session.userID).select(userFields.join(" "));
            if (!user || (!user.isSiloAdmin && !user.isSupportUser) || user.deletedAt) {
              throw Boom.unauthorized(null, 'Custom');
            }
            user.session = session;
            return h.authenticated({ credentials: user });
          } catch (JWTException) {
            // console.warn(JWTException);
            throw Boom.unauthorized(null, 'Custom');
          }
        }
      };
    };
    server.auth.scheme('silojwt', scheme);
    server.auth.strategy('silo', 'silojwt');
  }
};
