var fs = require('fs-extra');
var path = require('path');
var crypto = require('crypto');

var winston = require('winston');
var list_file = 'list.json';

// For storing in files
// options[type] = file
// options[path] - Where to store

var FileDocumentStore = function(options) {
  this.basePath = options.path || './data';
  this.expire = options.expire;
};

// Generate md5 of a string
FileDocumentStore.md5 = function(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
};

// list content
FileDocumentStore.prototype.list = function(data) {
  const list_path = path.join(this.basePath, list_file);
  fs.ensureFileSync(list_path);
  if (data) {
    return fs.writeJSONSync(list_path, data);
  }
  return fs.readJSONSync(list_path, { throws: false }) || [];
};

// Save data in a file, key as md5 - since we don't know what we could
// be passed here
FileDocumentStore.prototype.set = function(key, data, callback, skipExpire) {
  try {
    var _this = this;
    fs.mkdir(this.basePath, '700', function() {
      var fn = _this.basePath + '/' + FileDocumentStore.md5(key);
      fs.writeFile(fn, data, 'utf8', function(err) {
        if (err) {
          callback(false);
        }
        else {
          var list = _this.list();
          list.push(key);
          _this.list(list);
          callback(true);
          if (_this.expire && !skipExpire) {
            winston.warn('file store cannot set expirations on keys');
          }
        }
      });
    });
  } catch(err) {
    callback(false);
  }
};

// Get data from a file from key
FileDocumentStore.prototype.get = function(key, callback, skipExpire) {
  var _this = this;
  var fn = this.basePath + '/' + FileDocumentStore.md5(key);
  fs.readFile(fn, 'utf8', function(err, data) {
    if (err) {
      callback(false);
    }
    else {
      callback(data);
      if (_this.expire && !skipExpire) {
        winston.warn('file store cannot set expirations on keys');
      }
    }
  });
};

module.exports = FileDocumentStore;
