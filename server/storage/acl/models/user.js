const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verification_link, project, verification_link_silo_admin } = require('../../../config');
const APP_SECRET = project.secret;
const APP_URL = verification_link.baseURL;
const APP_URL_ADMIN = verification_link_silo_admin.baseURL;
const email = require('../../../utils/email');

module.exports = function(Schema) {
  const User = new Schema({
    companyID: {
      type: Schema.Types.ObjectId
    },
    departmentIDs: [{
      type: Schema.Types.ObjectId
    }],
    email: {
      required: true,
      type: String
    },
    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    hashedPassword: {
      type: String
    },
    salt: {
      type: String
    },
    roleIDs: [{
      type: Schema.Types.ObjectId,
      comment: 'Object id of roles'
    }],
    mobile: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String
    },
    resetPasswordToken: {
      type: String
    },
    loginAttempts: {
      type: Number,
      default: 0,
      comment:'login attempts count upto 5 failed attempts,for preventing brute force attack'
    },
    lockUntill: {
      type: Date,
      comment:'after 5 failed attempt, user need to wait for some time to try login again '
    },
    isSiloAdmin: {
      type: Boolean
    },
    isResetTokenVerified : {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: String
    },
    updatedBy: {
      type: String
    },
    deletedAt: {
      type: Date,
      default : null
    },
    session: {
      type: Object
    }
  }, { timestamps : true });

  User.methods.encryptPassword = function(password) {

    if (!password) {
      return false;
    }

    this.salt = crypto.randomBytes(16).toString('base64');

    const salt = new Buffer(this.salt, 'base64');

    this.hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 2048, 'RSA-SHA512').toString('base64');
  };

  User.methods.authenticate = function(password) {

    const salt = new Buffer(this.salt, 'base64');
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 2048, 'RSA-SHA512').toString('base64');

    return this.hashedPassword === hashedPassword;
  };

  User.methods.verify = function() {
    this.isVerified = false;
    let secret = APP_SECRET, link;
    if (this.isSiloAdmin || this.isSupportUser) {
      secret = secret + '-admin';
      link = APP_URL_ADMIN;
    } else {
      link = APP_URL;
    }
    const verificationToken = jwt.sign(
      {
        id: this._id
      }, secret, {
        expiresIn: 24 * 60 * 60 * 1000
      });

    this.verificationToken = verificationToken;
    link = link + verificationToken;
    this.sendEmail(this.email, link);
    return link;
  };

  User.methods.sendEmail = function(toEmail, link) {
    email.sendVerificationMail(toEmail, link);
  };

  User.index({
    // companyID: 1,
    email: 1
  }, {
    unique: 1,
    background: 1,
    name: 'uniq_useremail'
  });

  return User;
};
