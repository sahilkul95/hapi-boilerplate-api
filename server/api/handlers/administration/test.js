const Boom = require('boom');

const testAPI = {
  auth: false,
  tags: ['api', 'Test'],
  validate: {
    failAction: (request, h, err) => {
      return Boom.expectationFailed(err);
    }
  },
  async handler(req) {
    console.log(req);
    //If you want to return data in response, use return <data>
    //If you want to return just 200 with no data, use return ''
    // return Boom.notFound('Something not found');    -     For errors
    return '';
  }
};

exports.routes = [
  {
    method: 'GET',
    path: '/test',
    config: testAPI
  }
];
