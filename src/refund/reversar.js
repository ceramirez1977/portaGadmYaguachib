
const { createHash } = require('crypto');
const {getClavePaymentez_ECSERVER} = require('../gen/rutasScgp');

const getReversarTransaction = async (transaction) => {      
    let resultado = {token:'',
                     data:null,
                     error:{hay:false,msg:'',solucion:''}};

try
{
    console.log(transaction);  
    const credencial_paymetez = getClavePaymentez_ECSERVER();
    let server_aplication_code = credencial_paymetez.appcode; //'NUVEISTG-EC-SERVER';
    let server_app_key         = credencial_paymetez.appkey;  //'Kn9v6ICvoRXQozQG2rK92WtjG6l08a';
    //let unix_timestamp = String(Math.floor(new Date().getTime() / 1000));                      
    let fecha = new Date();
    let unix_timestamp = Math.floor(new Date(fecha.toGMTString()).getTime()/1000); //Math.floor((new Date()).getTime()/1000);// Fecha      
    let uniqtoken_string = `${server_app_key}${unix_timestamp}`;     
    let uniqtoken_sha256 =  createHash('sha256').update(uniqtoken_string).digest('hex');
    let cadena = `${server_aplication_code};${unix_timestamp};${uniqtoken_sha256}`;     
    let cadena64 = btoa(cadena);   
    //Llamar al api para objtener el init_reference  
    await fetch('https://ccapi.paymentez.com/v2/transaction/refund/',{
                    method: 'post',	                    	
                    body:    JSON.stringify(transaction),
                    headers: { 'Content-Type': 'application/json',
                               'Auth-Token': cadena64}
                  })   
                  .then((response)=> {                                        
                    const {status,detail} = response;
                    console.log(response)  ;
                    console.log('status',status,'detail',detail);
                    if(!response.ok)
                      {
                        resultado.data = null;
                        resultado.error.hay = true;
                        resultado.error.msg = response.statusText;                        
                      }
                      else
                      {
                        resultado.data = 'ok'
                      }                       
                  })
                  .catch((error)=>{
                     resultado.data = null;                                       
                     resultado.error.hay = true;
                     resultado.error.msg = `Error al reversar Transaccion ${error.toString()}` 
                  });    
  
 }
 catch(e)
 {
    resultado.data = null;                                       
    resultado.error.hay = true;
    resultado.error.msg = `Error al reversar Transaccion 02 ${e.toString()}` 
 }

 return resultado;
                 
}


module.exports = {
  getReversarTransaction
}