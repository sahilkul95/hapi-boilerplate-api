const Udyamdb = require('../../storage/udyam/models');
const Boom = require('boom');
const Joi = require('joi');
const utils = require('../../utils/sms');

const receiveSMSForSubscriberVerification = {
  auth: false,
  description: 'Receive incoming SMS and verify subscriber against code',
  tags: ['api', 'Textlocal'],
  handler: async (req, res) => {
    if(typeof req.payload === 'string') {
      req.payload = JSON.parse(req.payload);
    }

    let senderNumber;
    if (req.payload.sender.length > 10) senderNumber = req.payload.sender.slice(2, req.payload.sender.length);

    try {
      let subscriber = await Udyamdb.data.findOne({verificationCode: req.payload.comments.trim()});
      if (!subscriber) return res(Boom.notFound('subscriber not found'));
      subscriber.pleaseAnswerTheFollowingQuestions.mobile = senderNumber;
      subscriber.isVerified = true;
      subscriber.smsReceivedAt = req.payload.rcvd;
      await subscriber.save();
      return res();
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return res(Boom.expectationFailed(DBException.message));
    }
  }
};

const sendSMStoSubscribers = {
  auth: false,
  description: 'Send outgoing SMS to subscribers',
  tags: ['api', 'Textlocal'],
  validate: {
    payload: {
      mobile: Joi.array().items(Joi.string()).single()
    }
  },
  handler: async (req, res) => {
    let where = {
      verificationCode: {$exists: true},
      $or: [
        {'pleaseAnswerTheFollowingQuestions.mobile': {$in: req.payload.mobile}},
        {'pleaseAnswerTheFollowingQuestions.mobile2': {$in: req.payload.mobile}}
      ]
    };

    try {
      const SUBSCRIBERS = await Udyamdb.data.find(where);
      if (!SUBSCRIBERS.length) return res(Boom.notFound('No subscribers found'));

      await Promise.all(SUBSCRIBERS.map(async (data) => {
        let message = getTemplate('template2', {verificationCode: data.verificationCode});
        let response = await utils.sendNotificationSMS(message, data.pleaseAnswerTheFollowingQuestions.mobile ||
          data.pleaseAnswerTheFollowingQuestions.mobile2);

        if (response && response.body && response.body.status && response.body.status === 'success') {
          data.isSMSSent = true;
          await data.save();
        }

      }));
      return res({count: SUBSCRIBERS.length});
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return res(Boom.expectationFailed(DBException.message));
    }
  }
};

const sendSMSToUsers = {
  auth: false,
  description: 'Send outgoing SMS to users',
  tags: ['api', 'Textlocal'],
  validate: {
    payload: {
      template: Joi.string().required().only('prospectsTemplate', 'lekhakTemplate', 'template2', 'seleniteInternal'),
      mobile: Joi.array().items(Joi.string()).single()
    }
  },
  handler: async (req, res) => {
    let uniqueNumbers = [...new Set(req.payload.mobile)];
    let csv = uniqueNumbers.join();
    let data = {
      // consignmentNumber: 'P112233445',
      // lateCode: 'LATE-AA440',
      // stopCode: 'STOP-AA440',
      // magazineName: 'धातुकाम',
      // magazineMonth: 'ऑक्टो.'
    };
    try {
      let message = getTemplate(req.payload.template, data);
      await utils.sendNotificationSMS(message, csv);

      return res();
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return res(Boom.expectationFailed(DBException.message));
    }
  }
};

const receiveSMSForUpdateList = {
  auth: false,
  description: 'Receive incoming SMS and make entry in smslogs',
  tags: ['api', 'Textlocal'],
  handler: async (req, res) => {
    if(typeof req.payload === 'string') {
      req.payload = JSON.parse(req.payload);
    }

    let senderNumber;
    if (req.payload.sender.length > 10) senderNumber = req.payload.sender.slice(2, req.payload.sender.length);
    else senderNumber = req.payload.sender;

    let smsLog = {
      number: senderNumber,
      inNumber: req.payload.inNumber,
      message: req.payload.content
    };
    try {
      let SMSLOG = await Udyamdb.smsLogs.create(smsLog);
      return res(SMSLOG);
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return res(Boom.expectationFailed(DBException.message));
    }
  }
};

const getSMSLogs = {
  auth: false,
  description: 'GET SMS logs',
  tags: ['api', 'Textlocal'],
  validate: {
    query: {
      mobile: Joi.array().items(Joi.string()).single(),
      inNumber: Joi.array().items(Joi.string()).single()
    }
  },
  handler: async (req, res) => {
    let where = {};
    if (req.query.mobile && req.query.mobile.length) {
      where.number = {$in: req.query.mobile};
    }
    if (req.query.inNumber && req.query.inNumber.length) {
      where.inNumber = {$in: req.query.inNumber};
    }
    try {
      const SMSLOGS = await Udyamdb.smsLogs.find(where);
      return res(SMSLOGS);
    }
    catch(DBException) {
      req.log(['error'], JSON.stringify(DBException));
      return res(Boom.expectationFailed(DBException.message));
    }
  }
};

function getTemplate(template, params) {
  if (template === 'prospectsTemplate' && (!params.magazineName || !params.magazineMonth || !params.lateCode || !params.stopCode)) {
    return new Error('Some parameters are missing.');
  }
  if (template === 'lekhakTemplate' && (!params.magazineName || !params.magazineMonth || !params.consignmentNumber || !params.lateCode)) {
    return new Error('Some parameters are missing.');
  }
  const approvedTemplates = {
    template1: `Thank you for registering with Udyam. Your verification code is ${params.verificationCode}.`,
    template2: `Thank you for registering with Udyam. Your verification code is ${params.verificationCode}. Please SMS this code to 917288806677 to verify your phone.`,
    template3: `Thank you for registering with Udyam. Your verification code is ${params.verificationCode}.
    Please SMS this code to 917288806677 or call 02071171136 to verify your phone.`,
    seleniteInternal: `नमस्कार. हा टेस्ट मेसेज उद्यम प्रकाशनासाठी सेलेनाईट बिझनेस सोल्युशन्सने पाठविला आहे. मिळाल्यानंतर कृपया 7288806677 या क्रमांकावर OK मेसेज पाठवावा.`,
    lekhakTemplate: `आपला ${params.magazineName} ${params.magazineMonth} अंक https://bit.ly/2fqKJaz येथे क. नं. ${params.consignmentNumber} ने ट्रॅक करा. वेळेत / न मिळाल्यास कृपया 7288806677 या क्रमांकावर ${params.lateCode} मेसेज पाठवा.`,
    prospectsTemplate: `आपणास ${params.magazineName} ${params.magazineMonth} अंक वेळेत / न मिळाल्यास, ${params.lateCode} किंवा मासिक नको असल्यास ${params.stopCode} असा मेसेज कृपया 7288806677 या क्रमांकावर पाठवा. धन्यवाद.`
  };
  return approvedTemplates[template];
}



exports.routes = [
  {
    method: 'POST',
    path: '/notification/receivesms',
    config: receiveSMSForSubscriberVerification
  },
  {
    method: 'POST',
    path: '/notification/sendSMS',
    config: sendSMStoSubscribers
  },
  {
    method: 'POST',
    path: '/notification/receivesms/updateList',
    config: receiveSMSForUpdateList
  },
  {
    method: 'POST',
    path: '/notification/sendsmsusers',
    config: sendSMSToUsers
  },
  {
    method: 'GET',
    path: '/notification/smslogs',
    config: getSMSLogs
  }
];
