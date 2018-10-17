// const SECRET_KEY = require('./config/secret');
const Boom = require('boom');

exports.plugin = {
  name: 'auth',
  register: function (server) {
    const scheme = function () {
      return {
        authenticate: function (request, h) {

          const authorization = request.headers.authorization;
          if (!authorization) {
            throw Boom.unauthorized(null, 'Custom');
          }

          return h.authenticated({ credentials: { user: 'john' } });
        }
      };
    };
    server.auth.scheme('jwt', scheme);
    server.auth.strategy('jwt', 'jwt');
    // server.auth.default('jwt');
  }
};


// const acldb = require('./storage/acl/models');
// const config = require('./config');
//
// exports.register = function(plugin, options, next) {
//
//   plugin.auth.strategy('jwt', 'jwt', {
//     key: config.project.secret, // Secret key
//     verifyOptions: {
//       algorithms: ['HS256']
//     },
//     // Implement validation function
//     validateFunc: (decoded, request, callback) => {
//
//       if (!decoded.id) {
//         return callback(null, false);
//       }
//
//       // return acldb.session
//       //   .findById(decoded.id)
//       //   .then((session) => {
//       //
//       //     if (!session) {
//       //       return callback(null, false);
//       //     }
//       //
//       //     const userFields = [
//       //       'companyID',
//       //       'isClientAdmin',
//       //       'name',
//       //       'mobile',
//       //       'email',
//       //       'roleIDs',
//       //       'sessions'
//       //     ];
//       //     // console.log(`session: ${session}`);
//       //     return acldb.user.findById(session.userID).select(userFields.join(" "))
//       //     // .populate('roleIDs')
//       //       .then((user) => {
//       //         if (!user) {
//       //           return callback(null, false);
//       //         }
//       //         user.session = session;
//       //         return callback(null, true, user);
//       //         //callback(null, true, { user : user, scope : !user.isClientAdmin ? 'isClientAdmin' : user.roleIDs[0].name});
//       //       });
//       //   });
//     }
//   });
//
//   // Uncomment this to apply default auth to all routes
//   plugin.auth.default('jwt');
//
//   next();
// };
//
// exports.register.attributes = {
//   name: 'auth'
// };
