const Billingdb = require('../storage/billing/models');
let changesets = require('diff-json');


class Transaction {

  constructor() {
    this.changeset = [];
    this.comment = '';
    this.fileID;
    this.responsibleUserID;
    // console.log('initialized transaction');
  }

  recordComment(comment) {
    this.comment = comment;
  }

  recordFileId(fileID) {
    this.fileID = fileID;
  }

  recordResponsibleUserID(userID) {
    this.responsibleUserID = userID;
  }

  record(entity, entityID, currentObj, newObject) {
    //Record the changes in this function and push in changeset array
    let diffs = changesets.diff(currentObj, newObject);
    if (!diffs.length) {
      return console.log('Record - No changes to record');
    }
    diffs.map((diff) => {
      if (diff.type === 'add' || diff.type === 'update') {
        diff.entityID = entityID;
        diff.objectType = entity;
        this.changeset.push(diff);
      }
    });
    // this.changeset = diffs;
  }

  commit(metadata) {
    console.log(this.changeset, '**changeset**');
    if (!this.changeset.length) {
      console.log('Commit - No changes to record');
      return;
    }
    //Get whatever changes pushed in changeset array and commit to database
    let transactionObject = {
      companyID: metadata.companyID,
      createdBy: metadata.userID,
      updatedBy: metadata.userID
    };
    return new Promise((resolve, reject) => {
      if (this.comment) {
        transactionObject.comment = this.comment;
      }
      if (this.fileID) {
        transactionObject.fileID = this.fileID;
      }
      if (this.responsibleUserID) {
        transactionObject.responsibleUserID = this.responsibleUserID;
      }

      return Billingdb.transaction.create(transactionObject)
        .then((res) => {
          let historyArray = [];
          //Prepare history object for this transaction ID
          this.changeset.map((changeset) => {
            historyArray.push({
              companyID: metadata.companyID,
              transactionID: res._id,
              objectType: changeset.objectType,
              objectID: changeset.entityID,
              createdBy: metadata.userID,
              updatedBy: metadata.userID,
              changedAttribute: changeset.key,
              oldValue: changeset.oldValue,
              newValue: changeset.value
            });
          });

          //Now save history object in db
          return Billingdb.history.create(historyArray)
            .then(() => {
              console.log('Changes committed');
              return resolve();
            });
        })
        .catch((DBException) => {
          console.error(DBException.message);
          return reject(DBException.message);
        });
    });
  }

  // async destroyEntity(entity, currentObj, newObject, deletedAt) {
  //   // console.log('called destroyEntity');
  //   // console.log(entity, currentObj, newObject, deletedAt);
  //   let result = true;
  //   if(result) {
  //     return result;
  //   } else {
  //     throw new Error('');
  //   }
  // }

}
// const t = new Transaction();
// t.record('consumer', oldObj, newObj, 'sahil', 'sahil');
// t.commit();

module.exports = Transaction;
