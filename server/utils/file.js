const AWSConfig = require('../config').storage['files'];
const AWS = require('aws-sdk');
const joi = require('joi');
AWS.config = AWSConfig;
const s3 = new AWS.S3();
const S3_BUCKET = AWSConfig.bucket;

exports.putSignedURL = (company, file) => {
  return new Promise((resolve, reject) => {
    const S3UploadSchema = joi.object().keys({
      company: joi.string().required(),
      file: joi.any().required()
    }).required();
    S3UploadSchema.validate({
      company,
      file
    }, (validationException, params) => {
      if (validationException) {
        return reject(validationException);
      }
      let s3Params = {
        Bucket: S3_BUCKET,
        Key: `files/${params.company}/attachments/${params.file._id}/${params.file.value}`,
        Expires: 600,
        ContentType: params.file.type,
        ACL: 'private'
      };

      /* Generate signed URL based on the s3Params */
      s3.getSignedUrl('putObject', s3Params, function (S3Exception, url) {
        if (S3Exception) {
          return reject(S3Exception);
        }
        return resolve(url);
      });
    });
  });
};

exports.getSignedURL = (company, file) => {
  return new Promise((resolve, reject) => {
    const S3UploadSchema = joi.object().keys({
      company: joi.string().required(),
      file: joi.any().required()
    }).required();
    S3UploadSchema.validate({
      company,
      file
    }, (validationException, params) => {
      if (validationException) {
        return reject(validationException);
      }
      let s3Params = {
        Bucket: S3_BUCKET,
        Key: `files/${params.company}/attachments/${params.file._id}/${params.file.value}`,
        Expires: 600,
        ResponseContentDisposition: 'inline'
      };

      /* Generate signed URL based on the s3Params */
      s3.getSignedUrl('getObject', s3Params, function (S3Exception, url) {
        if (S3Exception) {
          return reject(S3Exception);
        }
        return resolve(url);
      });
    });
  });
};
