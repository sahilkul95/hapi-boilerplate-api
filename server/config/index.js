const envKey = key => {
  const env = process.env.NODE_ENV || 'development';

  const configuration = {
    development: {
      host: 'localhost',
      port: 9000,
      storage: {
        devDB: ''  //Mongodb database URL here
      },
      services: {
        files: {
          accessKeyId: '',
          secretAccessKey: '',
          bucket: '',
          region: 'ap-south-1'
        }
      },
      project: {
        name: 'project-dev',
        secret: 'project - secret',
        baseURL: 'http://localhost:8000'
      },
      verification_link: {
        baseURL: 'http://localhost:8000/verify?verificationToken='
      },
      verification_link_silo_admin: {
        baseURL: 'http://localhost:8000/admin/verify?verificationToken='
      },
      reset_password_url: {
        baseURL: 'http://localhost:8000/resetpassword?resetToken='
      },
      reset_password_url_silo_admin: {
        baseURL: 'http://localhost:8000/admin/resetpassword?resetToken='
      }
    },
    test: {
      host: 'localhost',
      port: 9000,
      storage: {
        devDB: process.env.TESTDB
      },
      services: {
        files: {
          accessKeyId: process.env.S3ACCESSKEYID,
          secretAccessKey: process.env.S3SECRETACCESSKEY,
          bucket: process.env.S3BUCKETNAME,
          region: 'ap-south-1'
        }
      },
      project: {
        name: 'project-test',
        secret: 'project - test - secret'
      },
      verification_link: {
        baseURL: 'http://testurl.com/verify?verificationToken='
      },
      verification_link_silo_admin: {
        baseURL: 'http://testurl.com/admin/verify?verificationToken='
      },
      reset_password_url: {
        baseURL: 'http://testurl.com/resetpassword?resetToken='
      },
      reset_password_url_silo_admin: {
        baseURL: 'http://testurl.com/admin/resetpassword?resetToken='
      }
    },
    prod: {
      host: 'localhost',
      port: 9000,
      storage: {
        devDB: process.env.PRODDB
      },
      services: {
        files: {
          accessKeyId: process.env.S3ACCESSKEYID,
          secretAccessKey: process.env.S3SECRETACCESSKEY,
          bucket: process.env.S3BUCKETNAME,
          region: 'ap-south-1'
        }
      },
      project: {
        name: 'project-prod',
        secret: 'project - prod - secret'
      },
      verification_link: {
        baseURL: 'http://produrl.com/verify?verificationToken='
      },
      verification_link_silo_admin: {
        baseURL: 'http://produrl.com/admin/verify?verificationToken='
      },
      reset_password_url: {
        baseURL: 'http://produrl.com/resetpassword?resetToken='
      },
      reset_password_url_silo_admin: {
        baseURL: 'http://produrl.com/admin/resetpassword?resetToken='
      }
    }
  };
  // console.log(configuration, env);
  return configuration[env][key];
};

const manifest = {
  server: {
    host: envKey('host'),
    port: envKey('port'),
    routes: {
      cors: true
    },
    router: {
      stripTrailingSlash: true
    }
  },
  register: {
    plugins: [
      // {
      //   plugin: 'hapi-auth-jwt2'
      // },
      {
        plugin: 'hapi-auth-basic'
      },
      {
        plugin: './auth'
      },
      {
        plugin: './siloauth'
      },
      {
        plugin: './developerauth'
      },
      {
        plugin: './api',
        routes: { prefix: '/api' }
      },
      {
        plugin: require('inert')
      },
      {
        plugin: require('vision')
      },
      {
        plugin: require('hapi-swagger'),
        options: {
          grouping: 'tags',
          securityDefinitions: {
            'Bearer': {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header'
            }
          },
          info: {
            title: '<PROJECT_NAME> APIs',
            description: 'REST APIs to access and administer project resources',
            version: '1.0'
          },
          auth: 'developer'
        }
      },
      {
        plugin: require('good'),
        options: {
          ops: {
            interval: 5000
          },
          includes: {
            request: ['headers', 'payload'],
            response: ['payload']
          },
          reporters: {
            myConsoleReporter: [{
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ log: '*', response: '*', request: '*', error : '*'}]
            }, {
              module: 'white-out',
              args: [{
                password: 'remove',
                newPassword: 'remove',
                confirmpassword: 'remove',
                confirmNewPassword: 'remove'
              }]
            },{
              module: 'good-console'
            }, 'stdout']
          }
        }
      }
    ]
  }
};

exports.manifest = manifest;
exports.storage = envKey('storage');
exports.project = envKey('project');
exports.services = envKey('services');
exports.verification_link = envKey('verification_link');
exports.verification_link_silo_admin = envKey('verification_link_silo_admin');
exports.reset_password_url = envKey('reset_password_url');
exports.reset_password_url_silo_admin = envKey('reset_password_url_silo_admin');
