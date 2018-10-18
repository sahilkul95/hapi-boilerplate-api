const users = {
  developer: {
    username: 'developer',
    password: 'developer#1',   // 'secret'
    name: 'Noob',
    id: '1'
  }
};

exports.plugin = {
  name: 'developerauth',
  register: function(server) {
    server.auth.strategy('developer', 'basic', {
      validate: async (request, username, password) => {
        const user = users[username];
        if (!user) {
          return { credentials: null, isValid: false };
        }

        if (password === user.password) {
          const credentials = { id: user.id, name: user.name };
          return { isValid: true, credentials };
        }
      }
    });
  }
};
