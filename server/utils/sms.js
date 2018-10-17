const SMSConfig = require('../config').sms;
const Request = require('request');

exports.sendNotificationSMS = (message, number) => {
  if(number.length === 10) number = '91' + number;
  // const senderEmail = SMSConfig.senderUserName;
  // const hashKey = SMSConfig.hashKey;
  const apiKey = SMSConfig.apiKey;
  const sender = SMSConfig.sender;
  const data = 'apiKey='+apiKey+'&sender='+sender+'&numbers='+number+'&message='+message+'&unicode=1';

  return new Promise((resolve, reject) => {
    Request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: 'http://api.textlocal.in/send/?',
      body: data
    }, function(error, response, body) {
      if (error) {
        return reject({message: error});
      }
      console.log(body);
      return resolve({response, body});
    });
  });
};
