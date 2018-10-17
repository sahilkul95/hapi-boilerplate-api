const envKey = key => {
  const env = process.env.NODE_ENV || 'development';

  const configuration = {
    development: {
      host: 'localhost',
      port: 9000,
      storage: {
        devDB: 'mongodb://useradmin:Selenite#1@192.168.1.231/udyam-copy'
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
          accessKeyId: '',
          secretAccessKey: '',
          bucket: '',
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
          accessKeyId: '',
          secretAccessKey: '',
          bucket: '',
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
      // },
      {
        plugin: './siloauth'
      },
      // {
      //   plugin: './developerauth'
      // },
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
            title: 'PROJECT APIs',
            description: 'REST APIs to access and administer project resources',
            version: '1.0'
          }
        }
      },
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
