module.exports = function(Schema) {
  const Role = new Schema({
    companyID: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    permissions: [{
      serviceID: Schema.Types.ObjectId
    }],
    createdBy: {
      type: String,
      required: true
    },
    updatedBy: {
      type: String,
      required: true
    },
    deletedAt: {
      type: Date,
      default : null
    }
  }, { timestamps : true });

  Role.index({
    companyID: 1,
    name: 1
  }, {
    background: 1,
    name: 'company_role'
  });

  return Role;
};
