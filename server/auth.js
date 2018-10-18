const acldb = require('./storage/acl/models');
const jwt = require('jsonwebtoken');
const Boom = require('boom');

exports.plugin = {
  name: 'auth',
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
            const decoded = jwt.verify(req.headers.authorization, req.config.project.secret);

            // console.log(`decoded`, decoded);
            if (!(decoded.id)) {
              throw Boom.unauthorized(null, 'Custom');
            }

            //Find session
            let session = await acldb.session.findById(decoded.id);

            if (!session) {
              throw Boom.unauthorized(null, 'Custom');
            }

            const userFields = [
              'companyID',
              'isClientAdmin',
              'name',
              'displayName',
              'mobile',
              'email',
              'roleIDs',
              'sessions',
              'wardIDs',
              'departmentIDs',
              'zoneIDs',
              'discomDivisionIDs',
              'isSiloAdmin',
              'isSupportUser',
              'deletedAt',
              'isMobileNumberVerified',
              'isVerified'
            ];
            let user = await acldb.user.findById(session.userID).select(userFields.join(" "));
            if (!user || user.isSiloAdmin || user.isSupportUser || user.deletedAt || !user.isVerified) {
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
    server.auth.scheme('jwt', scheme);
    server.auth.strategy('jwt', 'jwt');
    server.auth.default('jwt');
  }
};
