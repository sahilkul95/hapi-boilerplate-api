// const AWSConfig = require('../config').email['SESCONFIG'];
// const AWS = require('aws-sdk');
// AWS.config = AWSConfig;
// const ses = new AWS.SES();
//
// exports.sendVerificationMail = (toAddress, verificationLink) => {
//   let subject = 'Welcome to Udit';
//   let body = 'Welcome to Udit!' + '\n\n'+
//     'Your account has been created.'+ '\n\n'+
//     'Your registered Username: '+ toAddress+ '\n\n'+
//     'Follow this link to verify your account:'+ '\n\n'+
//     verificationLink+ '\n\n'+ 'Regards,'+'\nTeam Selenite.';
//
//   if (verificationLink.includes("resetpassword")) {
//     subject = '[Udit] Reset Password';
//     body = 'Hello Udit user,' + '\n\n'+
//       'You have requested to reset your password. You can use this link to reset it:' + '\n\n'+
//       verificationLink+ '\n\n'+ 'Regards,'+'\nTeam Selenite.';
//   }
//   let params = {
//     Destination: {
//       ToAddresses: [ toAddress ]
//     },
//     Message: {
//       Body: {
//         Text: {
//           Charset: 'UTF-8',
//           Data: body
//         }
//       },
//       Subject: {
//         Charset: 'UTF-8',
//         Data: subject
//       }
//     },
//     Source: AWSConfig.senderEmail,
//   };
//   ses.sendEmail(params, function(err, data) {
//     if (err) {
//       return console.log(err, err.stack);
//     }
//     console.log('Successfully sent email to:'+toAddress);
//     return console.log(data);
//     /*
//      data = {
//       MessageId: 'EXAMPLE78603177f-7a5433e7-8edb-42ae-af10-f0181f34d6ee-000000'
//      }
//      */
//   });
// };
//
// exports.sendNotificationEmail = (toAddress, htmlTemplate) => {
//   let subject = 'Udit Alerts';
//   let params = {
//     Destination: {
//       ToAddresses: [ toAddress ]
//     },
//     Message: {
//       Body: {
//         Html: {
//           Charset: 'UTF-8',
//           Data: htmlTemplate
//         }
//       },
//       Subject: {
//         Charset: 'UTF-8',
//         Data: subject
//       }
//     },
//     Source: AWSConfig.senderEmail,
//   };
//   ses.sendEmail(params, function(err, data) {
//     if (err) {
//       return console.log(err, err.stack);
//     }
//     console.log('Successfully sent notification mail to:'+toAddress);
//     console.log(data);
//   });
// };
