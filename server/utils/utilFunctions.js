const requestIp = require('request-ip');

exports.getClientIp = (req) => {
  const clientIp = requestIp.getClientIp(req);
  return clientIp;
};

exports.formatDateTime = (date, isTimeRequired) => {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone:'Asia/Kolkata'
  };
  let formattedDate = '';
  if (isTimeRequired) {
    options.hour = 'numeric';
    options.minute = 'numeric';
    options.second = 'numeric';
  }
  if (date) {
    formattedDate = new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
  }
  return formattedDate;
};

// date format DD/MM/YYYY
exports.getFormatedDate = (date, isTimeRequired) => {
  let month = String(date.getMonth() + 1);
  let day = String(date.getDate());
  const year = String(date.getFullYear());

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  /*
    T1362: Grammar mistake and incorrect date format in new bill arrival SMS
    Developer: Arvind Shinde
    Date: 27 june 2018
  */
  if (isTimeRequired) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = hours < 10 ? '0'+hours : hours;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    let strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return `${day}/${month}/${year}, ${strTime}`;
  } // comment end
  return `${day}/${month}/${year}`;
};

exports.getDifferenceInDays = (fromDate, toDate) => {
  let date1 = fromDate;
  let date2 = toDate;
  let timeDiff = date2.getTime() - date1.getTime();
  let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return diffDays;
};

exports.pad = (number, length) => {
  let str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
};

exports.stripUndefined = (object) => {
  Object.keys(object).forEach(key => {
    if (object[key] && typeof object[key] === 'object') this.stripUndefined(object[key]);
    else if (object[key] === undefined) delete object[key];
  });
};
