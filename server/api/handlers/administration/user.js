const Joi = require('joi');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const { reset_password_url, project, reset_password_url_silo_admin } = require('../../../config');
const Acldb = require('../../../storage/acl/models');
const APP_SECRET = project.secret;
const APP_URL = reset_password_url.baseURL;
const APP_URL_ADMIN = reset_password_url_silo_admin.baseURL;

const createUser = {
  auth: false,
  tags: ['api', 'user'],
  validate: {
    payload: {
      name: Joi.string().required().trim(),
      displayName: Joi.string().required().trim(),
      mobile: Joi.string().allow(''),
      email: Joi.string().email().required().lowercase(),
      roleIDs: Joi.array().items(Joi.string()).single(),
      departmentIDs: Joi.array().items(Joi.string()).single()
    }
  },
  handler: async (req) => {
    try {
      const regExp = /[7|8|9|][0-9]{9}$/;
      if (req.payload.mobile && !regExp.test(req.payload.mobile)) {
        return Boom.forbidden('You must enter valid Mobile Number.');
      }

      let userObject = {
        name: req.payload.name,
        displayName: req.payload.displayName,
        email: req.payload.email,
        mobile: req.payload.mobile
      };

      // const DEPARTMENTS = await Companydb.department.find({_id: {$in: req.payload.departmentIDs}});
      // if (!DEPARTMENTS.length) {
      //   return res(Boom.notFound('Department not found'));
      // }

      // if (req.payload.roleIDs && req.payload.roleIDs.length) {
      //   const ROLES = await Acldb.role.find({_id: {$in: req.payload.roleIDs}});
      //   if (!ROLES.length) {
      //     return res(Boom.notFound('Role not found'));
      //   }
      // }

      // let roleIDs = [], departmentIDs = [];
      // if (req.payload.departmentIDs && req.payload.departmentIDs.length) {
      //   departmentIDs = req.payload.departmentIDs;
      // }
      // if (req.payload.roleIDs && req.payload.roleIDs.length) {
      //   roleIDs = req.payload.roleIDs;
      // }
      // userObject.departmentIDs = departmentIDs;
      // userObject.roleIDs = roleIDs;
      try {
        const user = await Acldb.user.create(userObject);
        user.verify();
        const result = await user.save();
        return result;
      } catch (err) {
        console.log(err);
      }
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const me = {
  tags: ['api', 'user'],
  handler: (req) => {
    try {
      const userObj = {
        id: req.auth.credentials.id,
        name: req.auth.credentials.name,
        displayName: req.auth.credentials.displayName,
        email: req.auth.credentials.email,
        mobile: req.auth.credentials.mobile,
        role: req.auth.credentials.roleIDs,
        isClientAdmin: req.auth.credentials.isClientAdmin,
        deletedAt: req.auth.credentials.deletedAt,
        isVerified: req.auth.credentials.isVerified,
        isMobileNumberVerified: req.auth.credentials.isMobileNumberVerified
      };
      return userObj;
    }
    catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const fetchAllUser = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Api for fetching all users',
  validate: {
    query: {
      ids: Joi.array().items(Joi.string()).single(),
      status: Joi.string().only(['active', 'inactive', 'all']),
      pageNo : Joi.number().integer().positive().min(1).default(1),
      noLimit: Joi.string().only('noLimit')
    }
  },
  handler: async (req) => {
    try {
      const where = {};

      if(req.query.status)  {
        if (req.query.status === 'inactive') {
          where['deletedAt'] = {};
          where['deletedAt']['$ne'] = null;
        }
        if (req.query.status === 'active') {
          where['deletedAt'] = null;
        }
      }
      if(req.query.ids) {
        where['_id'] = {$in : req.query.ids};
      }
      let dbquery = Acldb.user.find(where).sort({updatedAt: -1});
      if (!req.query.noLimit) {
        const skip = (req.query.pageNo - 1) * 10;
        dbquery.skip(skip).limit(10);
      }
      const users = await dbquery;
      return users;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const getById = {
  tags: ['api', 'user'],
  description: 'Api for getting user by id',
  validate: {
    params: {
      id: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findById(req.params.id);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.forbidden('User not found')));
        return Boom.forbidden('User not found');
      }
      return user;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const getUserCount = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Api for count of users',
  validate: {
    query: {
      status: Joi.string().allow(['active', 'inactive', 'all'])
    }
  },
  handler: async (req) => {
    try {
      const where = {};
      if(req.query.status)  {
        if (req.query.status === 'inactive') {
          where['deletedAt'] = {};
          where['deletedAt']['$ne'] = null;
        }
        if (req.query.status === 'active') {
          where['deletedAt'] = null;
        }
      }

      const userCount = await Acldb.user.count(where);
      return userCount;

    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const updateUser = {
  auth: false,
  tags: ['api', 'user'],
  description: "API for update user.",
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      name: Joi.string().trim(),
      displayName: Joi.string().trim(),
      mobile: Joi.string().allow(''),
      email: Joi.string().email().lowercase(),
      roleIDs: Joi.array().items(Joi.string()).single(),
      departmentIDs: Joi.array().items(Joi.string()).single()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findById(req.params.id);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.forbidden('User not found')));
        return Boom.forbidden('User not found');
      }
      const regExp = /[7|8|9|][0-9]{9}$/;
      if (req.payload.mobile && !regExp.test(req.payload.mobile)) {
        return Boom.forbidden('You must enter valid Mobile Number.');
      } else {
        user.mobile = req.payload.mobile;
      }
      let oldEmail = user.email;
      if (req.payload.name) {
        user.name = req.payload.name;
      }
      if (req.payload.displayName) {
        user.displayName = req.payload.displayName;
      }
      if (req.payload.email) {
        user.email = req.payload.email;
      }
      // if (req.payload.roleIDs && req.payload.roleIDs.length) {
      //   const ROLES = await Acldb.role.find({_id: {$in: req.payload.roleIDs}});
      //   if (!ROLES.length) {
      //     return res(Boom.notFound('Role not found'));
      //   }
      //   user.roleIDs = req.payload.roleIDs;
      // }
      // if (req.payload.departmentIDs && req.payload.departmentIDs) {
      //   const DEPARTMENTS = await Companydb.department.find({_id: {$in: req.payload.departmentIDs}});
      //   if (!DEPARTMENTS.length) {
      //     return res(Boom.notFound('Department not found'));
      //   }
      //   user.departmentIDs = req.payload.departmentIDs;
      // }

      let updatedUser = await user.save();

      if (req.payload.email && (oldEmail != req.payload.email)) {
        //If previous email and new email is not same, then only resend verification email
        updatedUser.verify();
        updatedUser = await updatedUser.save();
      }

      return updatedUser;
    }
    catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const verifyToken = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Verify the token sent to user for email verification',
  validate: {
    query: {
      verificationToken: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findOne(req.query);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound()));
        return Boom.notFound();
      }
      if(user.isVerified) {
        req.log(['error'], JSON.stringify(Boom.expectationFailed()));
        return Boom.expectationFailed();
      } else {
        jwt.verify(req.query.verificationToken, APP_SECRET, (err) => {
          if (err) {
            req.log(['error'], JSON.stringify(Boom.expectationFailed()));
            return Boom.expectationFailed();
          }
          return '';
        });
      }
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const getUserByToken = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Get the user by token',
  validate: {
    params: {
      token: Joi.string().required(),
    }
  },
  handler: async (req) => {
    try {
      let where = {verificationToken: req.params.token};
      const user = await Acldb.user.findOne(where).select({_id: 1});
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('Token is already used')));
        return Boom.notFound('Token is already used');
      }
      return user;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const setPassword = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Set password for user for first time by authenticating their verificationCode',
  validate: {
    payload: {
      newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      confirmpassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
    },
    params: {
      id: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findById(req.params.id);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }

      if(req.payload.newPassword !== req.payload.confirmpassword) {
        req.log(['error'], JSON.stringify(Boom.conflict('Passwords do not match')));
        return Boom.conflict('Passwords do not match');
      }
      user.encryptPassword(req.payload.newPassword);
      user.verificationToken = undefined;
      if (!user.isVerified){
        user.isVerified = true;
      } else {
        req.log(['error'], JSON.stringify(Boom.expectationFailed('You have already set the password.')));
        return Boom.expectationFailed('You have already set the password.');
      }
      const result = await user.save();
      return result;

    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const deleteUser = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Activate or Deactivate user',
  validate: {
    params: {
      id: Joi.string().required(),
      action: Joi.string().only('activate', 'deactivate').required()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findById(req.params.id);
      if(!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }
      if(req.params.action === 'activate') {
        if(user.deletedAt) {
          user.verify();
        }
        user.deletedAt =  null;
      } else {
        user.deletedAt =  Date.now();
      }
      const result = await user.save();
      return result;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const forgotPassword = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Generate time based token to send to user and store it in verificationCode',
  validate: {
    payload: {
      email: Joi.string().email().required().lowercase()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findOne({email: req.payload.email});
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.forbidden('User not found')));
        return Boom.forbidden('User not found');
      }
      const resetPasswordToken = jwt.sign({
        id: user.id
      }, APP_SECRET, {
        expiresIn: 3 * 24 * 60 * 60 * 1000
      });
      user.resetPasswordToken = resetPasswordToken;
      user.isResetTokenVerified = false;
      const link = APP_URL + resetPasswordToken;
      user.sendEmail(req.payload.email, link);

      const result = await user.save();
      return result;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const resetPassword = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Reset password for user by authenticating their verificationCode',
  validate: {
    payload: {
      newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      confirmNewPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      resetToken: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      const user = await Acldb.user.findOne({resetPasswordToken: req.payload.resetToken});
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }
      jwt.verify(req.payload.resetToken, APP_SECRET, function(err) {
        if (err) {
          req.log(['error'], JSON.stringify(Boom.expectationFailed()));
          return Boom.expectationFailed();
        }
        if(req.payload.newPassword !== req.payload.confirmNewPassword) {
          req.log(['error'], JSON.stringify(Boom.conflict('Passwords did not match')));
          return Boom.conflict('Passwords did not match');
        }
        user.encryptPassword(req.payload.newPassword);
        user.resetPasswordToken = undefined;
        user.isResetTokenVerified = true;
        user.save();

        const result = Acldb.session.remove({userID: user._id, deletedAt: null});
        return result;
      });
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const activeUserSessions = {
  tags: ['api', 'user'],
  description: 'Get the active session(s) of the logged in user',
  handler: async (req) => {
    try {
      const session = await Acldb.session.find({
        userID: req.auth.credentials._id
      });
      if (!session) {
        req.log(['error'], JSON.stringify(Boom.notFound()));
        return Boom.notFound();
      }
      return session;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const verifyOldPassword = {
  tags: ['api', 'user'],
  description: 'Verify old password of user',
  validate: {
    payload: {
      oldPassword: Joi.string().required(),
    }
  },
  notes: 'This method verifies the password entered by user. If success,\
  user is further allowed proceed to change this password to new one.',
  handler: async (req) => {
    try {
      const user = await Acldb.user.findById(req.auth.credentials._id)
        .select('email salt hashedPassword isVerified companyID');
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }
      if (!user.authenticate(req.payload.oldPassword)) {
        req.log(['error'], JSON.stringify(Boom.badRequest('Invalid old password')));
        return Boom.badRequest('Invalid old password');
      }
      return ;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const validateSessionByToken = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Validate the session by token',
  validate: {
    params: {
      token: Joi.string().required(),
    }
  },
  handler: async (req) => {
    try {
      let where = {token: req.params.token};
      const session = await Acldb.session.findOne(where);
      if (!session) {
        req.log(['error'], JSON.stringify(Boom.notFound('Session Expired.')));
        return Boom.notFound('Session Expired.');
      }
      return session;
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const logout = {
  tags: ['api', 'user'],
  description: 'Destroy the active user session.',
  handler: async (req) => {
    try {
      if (req.auth.session) {
        const result = Acldb.session.findByIdAndRemove(req.auth.credentials.session._id);
        return result;
      } else {
        return '';
      }
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const siloLogout = {
  auth: 'silo',
  tags: ['api', 'user'],
  description: 'Destroy the active user session. Only for silo admin',
  handler: async (req) => {
    try {
      if (req.auth.credentials.session) {
        await Acldb.session.findByIdAndRemove(req.auth.credentials.session._id);
        return '';
      }
      return '';
    } catch(DBException){
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const createSiloUser = {
  auth: 'silo',
  tags: ['api', 'user'],
  validate: {
    payload: {
      name: Joi.string().required().trim(),
      mobile: Joi.string().allow(''),
      displayName: Joi.string().required().trim(),
      email: Joi.string().email().required().lowercase(),
      typeOfUser: Joi.string().only('siloUser', 'supportUser').required(),
    }
  },
  handler: async (req) => {

    const regExp = /[7|8|9|][0-9]{9}$/;
    if (req.payload.mobile && !regExp.test(req.payload.mobile)) {
      return Boom.forbidden('You must enter valid Mobile Number.');
    }

    let userObject = {
      createdBy: req.auth.credentials._id,
      updatedBy: req.auth.credentials._id,
      name: req.payload.name,
      email: req.payload.email,
      mobile: req.payload.mobile,
      displayName: req.payload.displayName
      // isSiloAdmin: req.payload.isSiloAdmin
    };

    if(req.payload.typeOfUser === 'siloUser') {
      userObject.isSiloAdmin = true;
    }
    if (req.payload.typeOfUser === 'supportUser') {
      userObject.isSupportUser = true;
    }
    try {
      let user = await Acldb.user.create(userObject);
      await user.verify();
      await user.save();
      return '';
    } catch (DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const updateSiloUser = {
  auth: 'silo',
  tags: ['api', 'user'],
  description: "Update silo admin user. Only for silo admin",
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      name: Joi.string().trim(),
      mobile: Joi.string().allow(''),
      email: Joi.string().email().lowercase(),
      typeOfUser: Joi.string().only('siloUser', 'supportUser').required(),
      // isSiloAdmin: Joi.boolean(),
      // isSupportUser: Joi.boolean(),
      displayName: Joi.string().trim()
    }
  },
  handler: async (req) => {
    const regExp = /[7|8|9|][0-9]{9}$/;
    if (req.payload.mobile && !regExp.test(req.payload.mobile)) {
      return Boom.forbidden('You must enter valid Mobile Number.');
    }
    const userFindQuery = {
      _id: req.params.id
    };

    try {
      let user = await Acldb.user.findOne(userFindQuery);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }
      if (!user.isSiloAdmin && !user.isSupportUser) {
        req.log(['error'], JSON.stringify(Boom.expectationFailed('You are not allowed to perform action on this resource.')));
        return Boom.expectationFailed('You are not allowed to perform action on this resource.');
      }
      if(req.payload.name) {
        user.name = req.payload.name;
      }
      if(req.payload.displayName) {
        user.displayName = req.payload.displayName;
      }
      const OLDEMAIL = user.email;

      if(req.payload.email) {
        user.email = req.payload.email;
      }

      user.mobile = req.payload.mobile;
      user.updatedBy = req.auth.credentials.id;
      if(req.payload.typeOfUser === 'siloUser') {
        user.isSiloAdmin = true;
      }
      if (req.payload.typeOfUser === 'supportUser') {
        user.isSupportUser = true;
      }
      user = await user.save();

      if(user.email !== OLDEMAIL) {
        user.verify();
        await user.save();
      }
      return '';
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const siloProfile = {
  auth: 'silo',
  tags: ['api', 'user'],
  description: 'Get logged in silo admin user\'s details',
  handler: (req) => {
    const userObj = {
      id: req.auth.credentials.id,
      name: req.auth.credentials.name,
      email: req.auth.credentials.email,
      mobile: req.auth.credentials.mobile,
      displayName: req.auth.credentials.displayName,
      deletedAt: req.auth.credentials.deletedAt,
      isVerified: req.auth.credentials.isVerified
    };
    if(req.auth.credentials.isSiloAdmin) {
      userObj.isSiloAdmin = req.auth.credentials.isSiloAdmin;
    } else {
      userObj.isSupportUser = req.auth.credentials.isSupportUser;
    }

    return userObj;
  }
};

const fetchAllSiloUsers = {
  auth: 'silo',
  validate: {
    query: {
      status: Joi.string().only(['active', 'inactive', 'all']),
      pageNo : Joi.number().integer().positive().min(1).default(1),
      noLimit: Joi.string().only('noLimit'),
      ids: Joi.array().items(Joi.string()).single(),
      isSupportUser: Joi.boolean()
    }
  },
  tags: ['api', 'user'],
  description: 'Get list of all silo admin users',
  handler: async (req) => {
    const user = Acldb.user;
    const where = {};
    // const where = {
    //   isSiloAdmin: true
    // };
    const query = req.query;

    if(query.isSupportUser) {
      where['isSupportUser'] = true;
    } else {
      where['isSiloAdmin'] = true;
    }
    if(query.status)  {
      if (query.status === 'inactive') {
        where['deletedAt'] = {};
        where['deletedAt']['$ne'] = null;
      }
      if (query.status === 'active') {
        where['deletedAt'] = null;
      }
    }
    if(query.ids) {
      where['_id'] = {$in : query.ids};
    }

    try {
      let dbquery = user.find(where).sort({createdAt: -1});
      if (!req.query.noLimit) {
        const skip = (req.query.pageNo - 1) * 10;
        dbquery.skip(skip).limit(10);
      }
      const USERS = await dbquery;
      return USERS;
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const deleteSiloUser = {
  auth: 'silo',
  tags: ['api', 'user'],
  description: 'Activate or Deactivate a silo admin. Only for silo admin',
  validate: {
    params: {
      id: Joi.string().required(),
      action: Joi.string().only('activate', 'deactivate').required()
    },
    payload: {
      isSupportUser: Joi.boolean()
    }
  },
  handler: async (req) => {
    const query = {
      '_id' : req.params.id
      // isSiloAdmin: true
    };

    if(req.payload.isSupportUser) {
      query.isSupportUser = true;
    } else {
      query.isSiloAdmin = true;
    }

    try {
      let user = await Acldb.user.findOne(query);
      if(!user) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }

      if(req.params.action === 'activate') {
        if(user.deletedAt) {
          user.verify();
        }
        user.deletedAt =  null;
      } else {
        user.deletedAt =  Date.now();
      }

      user = await user.save();
      return '';
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const forgotPasswordForSiloAdmin = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Generate time based token to send to user and store it in verificationCode. Only for silo admin',
  validate: {
    payload: {
      email: Joi.string().email().required().lowercase()
    }
  },
  handler: async (req) => {
    const userFindQuery = {
      email: req.payload.email,
      $or: [
        { isSiloAdmin: {$eq: true}},
        { isSupportUser: {$eq: true}}
      ]
    };

    try {
      let user = await Acldb.user.findOne(userFindQuery);
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound()));
        return Boom.notFound();
      }
      const resetPasswordToken = jwt.sign({
        id: user.id
      }, APP_SECRET + '-admin', {
        expiresIn: 3 * 24 * 60 * 60 * 1000
      });
      user.resetPasswordToken = resetPasswordToken;
      user.isResetTokenVerified = false;
      const link = APP_URL_ADMIN + resetPasswordToken;
      user.sendEmail(req.payload.email, link);
      await user.save();
      return '';
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const resetPasswordForSiloAdmin = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Reset password for silo user by authenticating their verificationCode',
  validate: {
    payload: {
      newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      confirmNewPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      resetToken: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      let user = await Acldb.user.findOne({ resetPasswordToken: req.payload.resetToken,
        $or: [
          { isSiloAdmin: true },
          { isSupportUser: true }
        ]
      });
      if (!user) {
        req.log(['error'], JSON.stringify(Boom.notFound()));
        return Boom.notFound();
      }

      jwt.verify(req.payload.resetToken, APP_SECRET + '-admin', async function(err) {
        if (err) {
          req.log(['error'], JSON.stringify(Boom.expectationFailed()));
          return Boom.expectationFailed();
        }
        if(req.payload.newPassword !== req.payload.confirmNewPassword) {
          req.log(['error'], JSON.stringify(Boom.conflict('Passwords did not match')));
          return Boom.conflict('Passwords did not match');
        }
        user.encryptPassword(req.payload.newPassword);
        user.resetPasswordToken = undefined;
        user.isResetTokenVerified = true;
        user = await user.save();
        await Acldb.session.remove({
          userID: user._id,
          deletedAt: null
        });
        return '';
      });
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const verifyTokenForSiloAdmin = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Verify the token sent to user for email verification. Only for silo admin',
  validate: {
    query: {
      verificationToken: Joi.string().required()
    }
  },
  handler: async (req) => {
    req.query['$or'] = [
      { isSiloAdmin: true },
      { isSupportUser: true }
    ];
    try {
      let user = await Acldb.user.findOne(req.query);
      if(!user) {
        req.log(['error'], JSON.stringify(Boom.notFound()));
        return Boom.notFound();
      }
      if(user.isVerified) {
        req.log(['error'], JSON.stringify(Boom.expectationFailed()));
        return Boom.expectationFailed();
      } else {
        jwt.verify(req.query.verificationToken, APP_SECRET + '-admin', (err) => {
          if (err) {
            req.log(['error'], JSON.stringify(Boom.expectationFailed()));
            return Boom.expectationFailed();
          }
          return '';
        });
      }
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const setPasswordForSiloAdmin = {
  auth: false,
  tags: ['api', 'user'],
  description: 'Set password for user for first time by authenticating their verificationCode. Only for silo admin',
  validate: {
    payload: {
      newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
      confirmpassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,20})/).required(),
    },
    params: {
      id: Joi.string().required()
    }
  },
  handler: async (req) => {
    try {
      let user = await Acldb.user.findById(req.params.id);
      if (!user || ( !user.isSiloAdmin && !user.isSupportUser )) {
        req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
        return Boom.notFound('User not found');
      }
      if(req.payload.newPassword !== req.payload.confirmpassword) {
        req.log(['error'], JSON.stringify(Boom.conflict('Passwords do not match')));
        return Boom.conflict('Passwords do not match');
      }
      user.encryptPassword(req.payload.newPassword);
      user.verificationToken = undefined;
      if (!user.isVerified){
        user.isVerified = true;
      }
      else {
        req.log(['error'], JSON.stringify(Boom.expectationFailed('You have already set the password.')));
        return Boom.expectationFailed('You have already set the password.');
      }
      await user.save();
      return '';
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return Boom.expectationFailed(DBException.message);
    }
  }
};

const verifyOldPasswordForSiloAdmin = {
  auth: 'silo',
  validate: {
    payload: {
      oldPassword: Joi.string().required(),
    }
  },
  description: 'Verify old password of user',
  notes: 'This method verifies the password entered by user. If success,\
  user is further allowed proceed to change this password to new one. Only for silo admin',
  tags: ['api', 'user'],
  handler: async (req) => {
    return Acldb.user.findById(req.auth.credentials._id)
      .select('email salt hashedPassword isVerified isSiloAdmin')
      .then((user) => {
        if (!user) {
          req.log(['error'], JSON.stringify(Boom.notFound('User not found')));
          return Boom.notFound('User not found');
        }
        if (!user.authenticate(req.payload.oldPassword)) {
          req.log(['error'], JSON.stringify(Boom.badRequest('Invalid old password')));
          return Boom.badRequest('Invalid old password');
        }
        return '';
      })
      .catch((DBException) => {
        req.log(['error'], JSON.stringify(Boom.expectationFailed(DBException)));
        return Boom.expectationFailed(DBException);
      });
  }
};

exports.routes = [
  {
    method: 'POST',
    path: '/user',
    config: createUser
  },
  {
    method: 'GET',
    path: '/user/me',
    config: me
  },
  {
    method: 'GET',
    path: '/user',
    config: fetchAllUser
  },
  {
    method: 'GET',
    path: '/user/{id}',
    config: getById
  },
  {
    method: 'GET',
    path:'/user/count',
    config: getUserCount
  },
  {
    method: 'PUT',
    path: '/user/{id}',
    config: updateUser
  },
  {
    method: 'PUT',
    path: '/user/verify',
    config: verifyToken
  },
  {
    method: 'GET',
    path: '/userByToken/{token}',
    config: getUserByToken
  },
  {
    method: 'PUT',
    path: '/user/{id}/setpassword',
    config: setPassword
  },
  {
    method: 'POST',
    path: '/forgotpassword',
    config: forgotPassword
  },
  {
    method: 'POST',
    path: '/resetpassword',
    config: resetPassword
  },
  {
    method: 'GET',
    path: '/user/session',
    config: activeUserSessions
  },
  {
    method: 'POST',
    path: '/user/verifyOldPassword',
    config: verifyOldPassword
  },
  {
    method: 'GET',
    path: '/validateSession/{token}',
    config: validateSessionByToken
  },
  {
    method: 'DELETE',
    path: '/user/{id}/{action}',
    config: deleteUser
  },
  {
    method: 'POST',
    path: '/user/logout',
    config: logout
  },
  {
    method: 'PUT',
    path: '/admin/user/{id}',
    config: updateSiloUser
  },
  {
    method: 'GET',
    path: '/admin/user',
    config: fetchAllSiloUsers
  },
  {
    method: 'POST',
    path: '/admin/logout',
    config: siloLogout
  },
  {
    method: 'POST',
    path: '/admin/createSiloUser',
    config: createSiloUser
  },
  {
    method: 'GET',
    path: '/admin/user/me',
    config: siloProfile
  },
  {
    method: 'DELETE',
    path: '/admin/user/{id}/{action}',
    config: deleteSiloUser
  },
  {
    method: 'POST',
    path: '/admin/forgotpassword',
    config: forgotPasswordForSiloAdmin
  },
  {
    method: 'POST',
    path: '/admin/resetpassword',
    config: resetPasswordForSiloAdmin
  },
  {
    method: 'PUT',
    path: '/admin/user/verify',
    config: verifyTokenForSiloAdmin
  },
  {
    method: 'PUT',
    path: '/admin/user/{id}/setpassword',
    config: setPasswordForSiloAdmin
  },
  {
    method: 'POST',
    path: '/admin/user/verifyOldPassword',
    config: verifyOldPasswordForSiloAdmin
  }
];
