const fs = require('fs');
const path = require('path');
const config = require('../../../config').storage['devDB'];
const mongoose = require('mongoose');
const basename = path.basename(module.filename);
mongoose.Promise = global.Promise;
mongoose.set('debug', true);
const dbConnection = mongoose.createConnection(config, { useNewUrlParser: true });

const db = {};

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(mongoose.Schema);
    const modelName = file.substr(0, file.length - 3);
    db[modelName] = dbConnection.model(modelName, model);
  });

module.exports = db;
