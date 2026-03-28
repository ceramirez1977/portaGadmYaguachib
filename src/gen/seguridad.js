const crypto = require('crypto');

const algorithm = "aes-256-cbc"; 
// generate 16 bytes of random data
const initVector = crypto.randomBytes(16);
// secret key generate 32 bytes of random data
const Securitykey = crypto.randomBytes(32);


const encriptar= (objeto)=>{
    let cadena = '';
    cadena = JSON.stringify(objeto);
    const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
    let encryptedData = cipher.update(cadena, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return encryptedData;
};

const desencriptar = (cadena) => {
    const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
    //decipher.setAutoPadding(false);
    let decryptedData = '';
    decryptedData = decipher.update(cadena, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    //console.log('decryptedData 02',decryptedData);
    //return decryptedData;
    return JSON.parse(decryptedData);
}

module.exports = {
    encriptar,
    desencriptar
}