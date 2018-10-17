const Boom = require('boom');

const errors = {
  //Define special errors here
  600: 'discomUnavailable'
};

// T1640: Change 503 response code to custom code 600
// Developer : Sahil Kulkarni
// Date : 20/08/2018
exports.customError = (inputParams) => {
  if (inputParams.constructor !== Object) {
    return Boom.expectationFailed('Argument of type Object is required.');
  }
  if (!inputParams) {
    return Boom.expectationFailed('No error specifications provided.');
  }

  if (!inputParams.statusCode) {
    return Boom.preconditionFailed('Status code not found');
  }
  if (!inputParams.message) {
    inputParams.message = ' ';
  }
  let error = new Error(inputParams.message.toString());
  let statusCode = Number(inputParams.statusCode);
  Boom.boomify(error, {
    statusCode
  });
  error.output.payload.error = errors[statusCode];
  return error;
};
