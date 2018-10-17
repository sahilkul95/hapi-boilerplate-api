const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const APP_SECRET = config.project.secret;
const acldb = require('../../storage/acl/models');
const boom = require('boom');


/*
 * Log-in a user into the system. On success, issue a token for future requests.
 */

const login = {
  auth: false,
  validate: {
    payload: {
      email: Joi.string().email().required().lowercase(),
      password: Joi.string().required()
    }
  },
  description: 'User Authentication',
  notes: 'This method authenticates user with the email and password. If user is successfully\
  authenticated, a token along with permissions mapped to the user is returned.',
  tags: ['api', 'auth'],
  handler: (req, res) => {
    return acldb.user
      .findOne({
        email: req.payload.email
      })
      .select('email salt hashedPassword isVerified companyID deletedAt loginAttempts lockUntill')
      .then((user) => {
        // console.log(`User - ${user}`);
        if (!user) {
          req.log(['error'], JSON.stringify(boom.notFound('Could not find your Udyam Account.')));
          return res(boom.notFound('Could not find your Udyam Account.'));
        }

        if (user.deletedAt) {
          req.log(['error'], JSON.stringify(boom.unauthorized('Your account is deactivated.')));
          return res(boom.unauthorized('Your account is deactivated.'));
        }
        if (!user.isVerified) {
          req.log(['error'], JSON.stringify(boom.badRequest('Your account is not verified. Please verify your account and login again.')));
          return res(boom.badRequest('Your account is not verified. Please verify your account and login again.'));
        }

        if (!user.authenticate(req.payload.password)) {
          // T1600:Limit Login attempts
          // Developer: Samruddhi
          // Date: 10/8/2018
          // comment: if password fails, increase login attempt by 1
          // Updated By - Rutuja on 16/08/2018
          user.loginAttempts += 1;
          if(user.loginAttempts === 5) {
            // if loginAttempts are 5 then set lockuntill time = now time + 30 getSeconds
            // so user can login after 30 seconds of 5 fail attampts
            user.lockUntill = new Date(new Date().setSeconds(new Date().getSeconds()+30));
          }
          else {
            if(user.loginAttempts > 5 && new Date() < user.lockUntill) {
              // after 5 fail attempts user need to wait  30 seconds
              req.log(['error'], JSON.stringify(boom.expectationFailed('Please try after 30 seconds.')));
              return res(boom.expectationFailed('Please try after 30 seconds.'));
            }
            if(user.loginAttempts > 5 && new Date() > user.lockUntill) {
              // on 6 th attempts and after 30 seconds of 5 fail attempts reset login attempts to 1 and lockuntill
              user.loginAttempts = 1;
              user.lockUntill = undefined;
            }
          }
          return user.save().then(() => {
            req.log(['error'], JSON.stringify(boom.forbidden('The Email or Password you entered is incorrect.')));
            return res(boom.forbidden('The Email or Password you entered is incorrect.'));
          });
        }

        else {
          if((user.loginAttempts <= 5) && (!user.lockUntill || new Date() > user.lockUntill)) {
            // Build session for the current user
            const session = new acldb.session({
              userID: user._id
            });

            const token = jwt.sign({
              id: session._id,
              source: 'portal'
            }, APP_SECRET, {
              expiresIn: 60 * 5 * 1000
            });

            delete req.payload.password;
            session.token = token;
            session.expiresIn = 60 * 5 * 1000;
            session.metadata = JSON.stringify(req.payload);

            // Save the current session of user
            return session.save().then(() => {
              user.loginAttempts = 0;
              user.lockUntill = undefined;
              user.save().then(() => {
                return res({
                  token
                });
              });
            });
          // Updated By - Rutuja on 16/08/2018
          } else {
            // If the user is locked, but password entered is correct, user should not be logged in
            //Respective error should be thrown.
            return res(boom.expectationFailed('Please try after 30 seconds.'));
          }
        }
      });
  }
};

const siloAuth = {
  description: 'Silo Authentication',
  notes: 'This method authenticates silo admin with the email and password for that session.',
  tags: ['api', 'auth'],
  auth: false,
  validate: {
    payload: Joi
      .object({
        email: Joi
          .string()
          .email()
          .required()
          .lowercase(),
        password: Joi
          .string()
          .required()
      })
      .description('credentials object')
      .label('credentials')
  },
  plugins: {
    'hapi-swagger': {
      responses: {
        200: {
          description: 'Success'
        },
        400: {
          description: 'Email or password didn\'t conform to schema expectations',
          schema: Joi
            .object({
              statusCode: 400,
              error: "Bad Request",
              message: "child \"email\" fails because [\"email\" is required]",
              validation: {
                source: "payload",
                keys: [
                  "email"
                ]
              }
            })
            .label('ValidationError')
        },
        403: {
          description: 'Email or password did not match expected admin credentials',
          schema: Joi.object({
            statusCode: 403,
            error: "Forbidden",
            message: "Incorrect credentials",
            validation: {
              source: "payload",
              keys: [
                "email", "password"
              ]
            }
          }).label('AuthenticationError')
        }
      }
    }
  },
  handler: (req, res) => {
    const userFindQuery = {
      email: req.payload.email,
      isSiloAdmin: true,
    };

    return acldb.user
      .findOne(userFindQuery)
      .then((user) => {
        if (!user) {
          req.log(['error'], JSON.stringify(boom.notFound('The Email or Password you entered is incorrect.')));
          return res(boom.notFound('The Email or Password you entered is incorrect.'));
        }

        if (user.deletedAt) {
          req.log(['error'], JSON.stringify(boom.unauthorized('Your account is deactivated.')));
          return res(boom.unauthorized('Your account is deactivated.'));
        }
        if (!user.isVerified) {
          req.log(['error'], JSON.stringify(boom.badRequest('Your account is not verified. Please verify your account and login again.')));
          return res(boom.badRequest('Your account is not verified. Please verify your account and login again.'));
        }
        if (!user.authenticate(req.payload.password)) {
          user.loginAttempts += 1;
          if(user.loginAttempts === 5) {
            // if loginAttempts are 5 then set lockuntill time = now time + 30 getSeconds
            // so user can login after 30 seconds of 5 fail attampts
            user.lockUntill = new Date(new Date().setSeconds(new Date().getSeconds()+30));
          }
          else {
            if(user.loginAttempts > 5 && new Date() < user.lockUntill) {
              // after 5 fail attempts user need to wait  30 seconds
              req.log(['error'], JSON.stringify(boom.expectationFailed('Please try after 30 seconds.')));
              return res(boom.expectationFailed('Please try after 30 seconds.'));
            }
            if(user.loginAttempts > 5 && new Date() > user.lockUntill) {
              // on 6 th attempts and after 30 seconds of 5 fail attempts reset login attempt to 1 and lockuntill
              user.loginAttempts = 1;
              user.lockUntill = undefined;
            }
          }
          return user.save().then(() => {
            req.log(['error'], JSON.stringify(boom.forbidden('The Email or Password you entered is incorrect.')));
            return res(boom.forbidden('The Email or Password you entered is incorrect.'));
          });
        }
        else {
          if(user.loginAttempts < 5 || (user.loginAttempts === 5 && new Date() > user.lockUntill) ) {
            // Build session for the current user
            const session = new acldb.session({
              userID: user._id
            });

            const token = jwt.sign({
              id: session._id,
              source: 'silo'
            }, APP_SECRET + '-admin', {
              expiresIn: 60 * 5 * 1000
            });

            delete req.payload.password;
            session.token = token;
            session.expiresIn = 60 * 5 * 1000;
            session.metadata = JSON.stringify(req.payload);

            // Save the current session of user
            return session.save()
              .then(() => {
                return res({token});
              });
          }
          else {
            // If the user is locked, but password entered is correct, user should not be logged in
            //Respective error should be thrown.
            return res(boom.expectationFailed('Please try after 30 seconds.'));
          }
        }
      });
  }
};

exports.routes = [{
  method: 'POST',
  path: '/auth/local',
  config: login
}, {
  method: 'POST',
  path: '/auth/silo',
  config: siloAuth
}];
