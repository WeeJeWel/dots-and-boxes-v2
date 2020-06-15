'use strict';

module.exports = class Util {
  
  static createSessionId(length = 5) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for( let i = 0; i < length; i++ ) {
      result += characters[ Math.floor(Math.random() * characters.length) ];
    }
    return result;
  }
  
}