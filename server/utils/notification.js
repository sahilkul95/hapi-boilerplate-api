const Joi = require('joi');
const activitydb = require('../storage/activity/models');
const Boom = require('boom');
const Mustache = require('mustache');
const email = require('./email');
const sms = require('./sms');
const config = require('../config').admin;

let verificationCode;
const allowedTemplates = [
  'billFetchingError', 'billMappingFailure', 'fewerFieldsReceived', 'moreFieldsReceived','newBillArrivalForAdmin', 'newBillArrival', 'unprocessBillArrival',
  'unprocessBillArrivalForAdmin', 'newTaskAssignment', 'taskApproval', 'taskRejection', 'billprocessingSummary', 'newFaultyOrPDBillArrival',
  'newFaultyOrPDBillArrivalForAdmin', 'summaryMoreLessFields'
];
function getTemplate(type, channel) {
  const templates = {
    template1: {
      email: '',
      sms: `Thank you for registering with Udyam. Your verification code is ${verificationCode}.`
    },
    template2: {
      email: '',
      sms: `Thank you for registering with Udyam. Your verification code is ${verificationCode}. Please SMS this code to 917288806677 to verify your phone.`
    }
  };
  return templates[type][channel];
}

//Notification logging library
exports.addNotification = (companyID, audience, audienceID, createdBy, data, type, channels) => {
  if (audience === 'system') {
    // #TBD
  }
  if (audience === 'user') {
    let notificationPromise = [];
    channels.map((channel) => {
      if (channel === 'email') notificationPromise.push(addEmailNotification(companyID, audience, audienceID.toString(), createdBy, data, type));
      if (channel === 'sms') notificationPromise.push(addSMSNotification(companyID, audience, audienceID.toString(), createdBy, data, type));
    });
    return Promise.all(notificationPromise);
  }
};

function addEmailNotification(companyID, audience, audienceID, createdBy, data, type) {
  return new Promise((resolve, reject) => {
    const notificationSchema = Joi.object({
      audience: Joi.string().required().only(['system', 'user']),
      audienceID: Joi.string().allow(''),
      createdBy: Joi.string().required(),
      type: Joi.string().only(allowedTemplates)
    });
    notificationSchema.validate({
      audience, audienceID, createdBy
    }, (err, params) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      let notificationObject = {
        //WHAT
        message: getTemplate(type, 'email'),
        metadata: data,
        //To WHO
        audience: params.audience,
        //By WHOM
        createdBy: params.createdBy,
        channel: 'email'
      };
      if(audienceID) {
        notificationObject.audienceID =  params.audienceID;
      }
      return activitydb.notification.create(notificationObject)
        .then((response) => {
          //Do mustache render here & send email
          const compiledTemplate = Mustache.render(response.message, data);
          let toAddress;
          if (audience === 'system') {
            //Powerdek admin email here
            toAddress = config.email;
          }
          if (audience === 'user') {
            toAddress = response.metadata.audienceEmail;
          }
          if (audience === 'system' &&
            (type === 'billprocessingSummary' || type === 'fewerFieldsReceived' || type === 'moreFieldsReceived')) {
            toAddress = response.metadata.audienceEmail;
          }
          email.sendNotificationEmail(toAddress, compiledTemplate);
          return resolve(response);
        })
        .catch((DBException) => {
          return reject(Boom.expectationFailed(DBException.message));
        });
    });
  });
}

function addSMSNotification(companyID, audience, audienceID, createdBy, data, type, mobile) {
  if (data.verificationCode) verificationCode = data.verificationCode;

  return new Promise((resolve, reject) => {
    const notificationSchema = Joi.object({
      audience: Joi.string().required().only(['system', 'user']),
      audienceID: Joi.string().allow(''),
      createdBy: Joi.string().required(),
      type: Joi.string().only(allowedTemplates)
    });
    notificationSchema.validate({
      audience, audienceID, createdBy
    }, (err, params) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      let notificationObject = {
        message: getTemplate(type, 'sms'),
        metadata: data,
        audience: params.audience,
        createdBy: params.createdBy,
        channel: 'sms'
      };
      if(audienceID) {
        notificationObject.audienceID =  params.audienceID;
      }
      return activitydb.notification.create(notificationObject)
        .then((response) => {
          return sms.sendNotificationSMS(response.message, mobile)
            .then(() => {
              return resolve(response);
            });
        })
        .catch((DBException) => {
          return reject(Boom.expectationFailed(DBException.message));
        });
    });
  });
}
