
var AES = {}
AES.encrypt = function (word, keyStr) {
    keyStr = keyStr ? keyStr : 'Y5jtoFVaMismiJ2y'; //判断是否存在ksy，不存在就用定义好的key
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return encrypted.toString();
}
//解密
AES.decrypt = function(word, keyStr) {
    keyStr = keyStr ? keyStr : 'Y5jtoFVaMismiJ2y';
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var decrypt = CryptoJS.AES.decrypt(word, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
}

