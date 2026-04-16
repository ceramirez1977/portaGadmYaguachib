const dbora = require('../db/conexion.oracle12c');
const { createHash } = require('crypto');
const path = require('node:path');
const fs = require('fs');
const {rutaPdfDocElec,rutaXmlDocElec,rutadocCompIng,getClavePaymentez_ECSERVER,getEnlacePaymentez,getModoPaymentez,NOMBREINSTITUCION} = require('../gen/rutasScgp');
const {procesaEnvioVoucherEmailPEL,
       crearComprobantes,
       enviaCorreoComprobanteIngreso,
       enviaCorreoRegistroUsuario,
       enviaCorreoRecuperarUsuario,
       crearPdfDocElec,
       enviaCorreoLogError} = require('../gen/adminfile');

const { getErrorResultado,
        getResultado
       } = require('../db/gestiondb');       

const {agregarLogError,agregarLogSucces,gestionaErrorPelVC} = require('../gen/gestionarchivo'); 

const {esperarSeg} = require('../gen/dataReferencial');

//const fetch = require('node-fetch');


const json_respuesta = (json) =>{
     return JSON.stringify({resultado:btoa(JSON.stringify(json))});
}

const funContra_Autenticacion = async (parametros) => {
     const resultado = await dbora.autenticacion(parametros);
     return resultado;
}

const funContra_Logout = async (parametros) => {
     const resultado = await dbora.logout(parametros);
     return resultado;
}

const funContra_Insertalogin = async (parametros) => {
     const resultado = await dbora.insertlogin(parametros);  
     if(!resultado.error.hay)
     {
        //aqui hay que enviar por email el usuario y clave           
        const dataCorreo = {
             correo:parametros.data[7].columna.valor,
             usuario:parametros.data[0].columna.valor,
             clave:parametros.data[1].columna.valor,
             identificacion:parametros.data[3].columna.valor,
             nombres:parametros.data[4].columna.valor
        };
        await esperarSeg(3000);//esperemos 3 segundos para luego enviar el correo
        await enviaCorreoRegistroUsuario(dataCorreo);
        //setTimeout(()=>{
        //  enviaCorreoRegistroUsuario(dataCorreo);
        //},8000);
     }  
     return resultado;
}

const funContra_Updatelogin = async (parametros) => {
     const resultado = await dbora.updatelogin(parametros);  
     return resultado;
}

const funContra_recuperaUsuarioLogin = async (parametros) => {
     const resultado = await dbora.recuperaUsuarioLogin(parametros);
     if(!resultado.error.hay)
     {
       const dataCorreo = {
            correo:resultado.data.correo,
            usuario:resultado.data.usuario,
            clave:resultado.data.clave,
            identificacion:resultado.data.identificacion,
            nombres:resultado.data.nombres
       };
       await esperarSeg(3000);
       await enviaCorreoRecuperarUsuario(dataCorreo);
       //setTimeout(()=>{
       //     enviaCorreoRecuperarUsuario(dataCorreo);
       //},6000); 
     }
     return resultado;
}

const funContra_deudaxcedula = async (parametros) => {
     

     try
     {
        
        let {columna} = parametros.data[0];
        const chequeo = await gestionaErrorPelVC(columna.valor);
        if(chequeo.bloqueado)
        {
          //responder al frontend para que continue
          return { token:parametros.token,
                   data:null,
                   error:{
                        hay: true,
                        msg: 'Cobro en Linea Pendiente, por fa comuniquese con el GAD',
                        solucion:'Revisar archivo generado'
                    }
                  }; 
         }

          const resultado = await dbora.consultarDeuda(parametros);         
          if(!resultado.error.hay)
          {
               if(resultado.data.length>0)
               {
                    let primero=true;
                    let datafiltro=[];
                    let dataObj={};
                    let cuenta_ant,titulo_ant;
                    resultado.data.forEach((dato,index) => {
                         const idFilaUnico = `filaDeuda-${dato.cuenta}-${dato.anio_deuda}-${dato.numero}-${dato.liquidacion}-${index+1}`;
                         if(primero)
                         {
                              cuenta_ant = dato.cuenta;
                              titulo_ant = dato.titulo;               
                              primero = false;
                              dataObj = {id:`grupoDeuda-${dato.cuenta}-${dato.titulo}-${index+1}`,
                                         cuenta:dato.cuenta,
                                         titulo:dato.titulo,
                                         codigo_subconcepto:dato.codigo_subconcepto,                          
                                         direccion:dato.direccion,
                                         validar_orden_cobro:dato.validar_orden_cobro,
                                         valor:[]};
                         }
                         if( titulo_ant == dato.titulo) // cuenta_ant == dato.cuenta &&
                         {
                              const valor = {
                                   id:idFilaUnico,
                                   numero:dato.numero,
                                   cuenta:dato.cuenta,
                                   anio:dato.anio,
                                   liquidacion:dato.liquidacion,
                                   anio_deuda:dato.anio_deuda,
                                   observacion:dato.observacion,
                                   direccion:dato.direccion,
                                   total_pagar:dato.total_pagar,
                                   estado:false,
                                   validar_orden_cobro:dato.validar_orden_cobro,
                                   aplicacion:dato.aplicacion,
                                   seccabliq:dato.seccabliq,
                                   numero_valida:dato.numero_valida
                              };
                              dataObj.valor.push(valor);
                         }
                         else{
                              datafiltro.push(dataObj);
                              cuenta_ant = dato.cuenta;
                              titulo_ant = dato.titulo;
                              dataObj = {};
                              dataObj = {id:`grupoDeuda-${dato.cuenta}-${dato.titulo}-${index+1}`,
                                         cuenta:dato.cuenta,
                                         titulo:dato.titulo,
                                         codigo_subconcepto:dato.codigo_subconcepto,                          
                                         direccion:dato.direccion,
                                         validar_orden_cobro:dato.validar_orden_cobro,
                                         valor:[]};
                              dataObj.valor.push({
                                   id:idFilaUnico,
                                   numero:dato.numero,
                                   cuenta:dato.cuenta,
                                   anio:dato.anio,
                                   liquidacion:dato.liquidacion,
                                   anio_deuda:dato.anio_deuda,
                                   observacion:dato.observacion,
                                   direccion:dato.direccion,
                                   total_pagar:dato.total_pagar,
                                   estado:false,
                                   validar_orden_cobro:dato.validar_orden_cobro,
                                   aplicacion:dato.aplicacion,
                                   seccabliq:dato.seccabliq,
                                   numero_valida:dato.numero_valida
                              });
                         }          
                    });
                    datafiltro.push(dataObj);
                    resultado.data = datafiltro;
               }          
          }
     
          return resultado;

   }
   catch(e)
   {
      agregarLogError('funContra_deudaxcedula',`parametros: ${JSON.stringify(parametros)} error: ${e.message} `);
      return {
            token: parametros.token,
            data: null,
            error: { 
                hay: true, 
                msg: "Error al consultar deuda, porfa, consulte en un momento. Si el inconveniente persiste comuniquese con el GAD.", 
                solucion: "Intente nuevamente." 
            }
          };
   }

}

const funContra_getRefTransaccion = async (parametros,rutaname_funcion) => {      
     let resultado = {token:parametros.token,
                      data:{
                         reference:null,
                         modo:null
                      },
                      error:{hay:false,msg:'',solucion:''}};
     let enviarcorreo_sistemas = false;
     const transaccion = parametros.data[0].columna.valor;//JSON.parse(atob(data.reftransaccion));        
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
     const rutaTranPaymnetez = getEnlacePaymentez();
     console.log(getEnlacePaymentez(),getModoPaymentez());
     //await fetch('https://ccapi-stg.paymentez.com/v2/transaction/init_reference/',{//PARA DESARROLLO
     //     await fetch('https://ccapi.paymentez.com/v2/transaction/init_reference/',{//PARA PRODUCCION
     await fetch(rutaTranPaymnetez,{
                     method: 'post',	                    	
                     body:    JSON.stringify(transaccion),
                     headers: { 'Content-Type': 'application/json',
                                'Auth-Token': cadena64}
                   })   
                   .then((response)=>response.json())
                   .then((json)=>{                       
                       const {reference} = json; 
                       const modoPaymentez = getModoPaymentez();
                       if(typeof reference==="undefined")
                       {
                         resultado.data.reference = null;               
                         resultado.data.modo = null;
                         resultado.error.hay = true;
                         resultado.error.msg = `Error al generar Referencia Transaccion de Boton de pago ${json.error.type} ${json.error.description} ${json.error.help}`
                         enviarcorreo_sistemas = true;
                       }
                       else
                       {
                         resultado.data.reference = reference;               
                         resultado.data.modo = modoPaymentez;
                         
                       }                       
                   })
                   .catch((error)=>{
                      resultado.data.reference = null;               
                      resultado.data.modo = null;                                     
                      resultado.error.hay = true;
                      resultado.error.msg = `Error al generar Referencia Transaccion ${error.toString()}` 
                   }); 
   if(!resultado.error.hay)
   {
     agregarLogSucces(rutaname_funcion,`Referencia Transaccion de Boton de pago con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
   }
   if(resultado.error.hay)
   {
    agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: ${resultado.error.msg} cadena: ${cadena}`);
   }
   if(enviarcorreo_sistemas)
   {
     enviaCorreoLogError(`Revisar reloj del servidor web. ${resultado.error.msg}`);
   }
   console.log(resultado);
   return resultado;                   
}

const funContra_recaudarenlinea = async (parametros) => {
     
     const resultado = await dbora.recaudarenlinea(parametros);
     if(!resultado.error.hay) 
     {    console.log('data',resultado.data);
          const {usuario} = parametros.data[0].columna.valor;
          await crearComprobantes(resultado.data);  
          await esperarSeg(15000);
          console.log('comp',resultado.data.comprobantes);
          const enviomsg = await enviaCorreoComprobanteIngreso({correo:usuario.correo,comprobantes:resultado.data.comprobantes});
          
          //setTimeout(async ()=>{
          //await crearComprobantes(resultado.data);  
          //},15000);       
          //setTimeout(()=>{
          //const enviomsg = enviaCorreoComprobanteIngreso({correo:usuario.correo,comprobantes:resultado.data.comprobantes});
          //},120000); 
     }
     return resultado;
}

const funContra_enviaEmailVoucherYComprobantes = async (parametros,id_json,resultado_comprobante) => {
     
     try
     {
       //Enviar el Voucher del cobro en linea       
       await procesaEnvioVoucherEmailPEL(parametros.data[0].columna.valor,parametros.token,id_json);
       if(!resultado_comprobante.error.hay)
       {
        const {usuario} = parametros.data[0].columna.valor;
        await crearComprobantes(resultado_comprobante.data);  
        const enviomsg = await enviaCorreoComprobanteIngreso({correo:usuario.correo,comprobantes:resultado_comprobante.data.comprobantes});
       }
    }
    catch(e)
    {
      agregarLogError('funContra_enviaEmailVoucherYComprobantes',`parametros: ${JSON.stringify(parametros)} id_json: ${id_json} resultado_comprobante: ${JSON.stringify(resultado_comprobante)} error: ${e.message} cadena: ${cadena}`);
    }
     
} 

const funContra_enviovaucherpagoenlinea = async (parametros) => {
     
     try
     {
       //Insertar en la DB EL JSON DEL COBRO
       let resultado = await dbora.insertaJsonPEL(parametros);
       const id_json = resultado.data.id_json;
       //Inserto Comprobantes del cobro en linea
       const resultado_comprobante = await dbora.recaudarenlinea({parametros,id_json});      
              
       let mensajes=[]; 

       if(resultado.error.hay) mensajes.push(`Error al Insertar Voucher: ${resultado.error.msg}`);
       
       if(resultado_comprobante.error.hay) mensajes.push(`Error al insertar Comprobantes: ${resultado_comprobante.error.msg}`);
       
       let msgError = mensajes.filter(Boolean).join('\n').trim();
       let hayerror = msgError.length > 0;

       if(hayerror)
       {
          const {usuario} = parametros.data[0].columna.valor;
          await gestionaErrorPelVC(usuario.identificacion,parametros.data[0].columna.valor);
       }
       else
       {
          //Enviar comprobantes a correos
          funContra_enviaEmailVoucherYComprobantes(parametros,id_json,resultado_comprobante);     
       }
       
       //responder al frontend para que continue
       return { token:parametros.token,
                data:null,
                error:{
                      hay: hayerror,
                      msg: msgError,
                      solucion:''
                    }
               };
     }
     catch(e)
     {
          agregarLogError('funContra_enviovaucherpagoenlinea',`parametros: ${JSON.stringify(parametros)} error: ${e.message} `);
          try 
          {
            // ACTIVAR RESPALDO DE EMERGENCIA: Incluso si la DB no respondió nada
            const { usuario } = parametros.data[0].columna.valor;
            await gestionaErrorPelVC(usuario.identificacion, parametros.data[0].columna.valor);
          }
          catch (errRespaldo) {
            console.error("Error crítico: Falló incluso la creación del archivo de respaldo", errRespaldo);
          }

          return {
            token: parametros.token,
            data: null,
            error: { 
                hay: true, 
                msg: "Error crítico al registrar Vaucher y Comprobates. Su transacción ha sido registrada momentaneamente. Comuniquese con el GAD.", 
                solucion: "Por favor, no reintente el pago." 
            }
          };
     }

}

const funContra_insertaerrorpagoenlinea = async(parametros) => {
     let objPara = funObjParametros(parametros.data);        
}

const funContra_consultarfacturas = async (parametros) => {
     const resultados = await dbora.consultarfacturas(parametros);
     return resultados;
}

const funContra_consultacomprobantes = async(parametros) => {
     const resultados = await dbora.consultarComprobantes(parametros);
     return resultados;
}

const funDb = async (body,rutaname_funcion,f) =>{          
     try
     {
          const parametros = JSON.parse(atob(body.parametros));   
          const resultado = await f(parametros,rutaname_funcion);
          return json_respuesta(resultado);          
     }
     catch(e)
     {
          agregarLogError(rutaname_funcion,`Bloque catch(e): Parametros IN ${atob(body.parametros)} error: ${e.toString()}`);                   
          return json_respuesta(getResultado('',{},getErrorResultado(true,e.toString(),'')));
     }
}

const autenticacion = async (req,res) => {          
     const resultado = await funDb(req.body,path.join(__filename,autenticacion.name),funContra_Autenticacion);
     res.status(200).json(resultado);
}

const logout = async (req,res) =>{
     const resultado = await funDb(req.body,path.join(__filename,logout.name),funContra_Logout);
     res.status(200).json(resultado);        
}

const insertalogin = async (req,res) =>{     
     const resultado = await funDb(req.body,path.join(__filename,insertalogin.name),funContra_Insertalogin);
     res.status(200).json(resultado);       
}

const updatelogin = async (req,res) =>{     
     const resultado = await funDb(req.body,path.join(__filename,updatelogin.name),funContra_Updatelogin);
     res.status(200).json(resultado);   
}

const recuperaUsuarioLogin = async (req,res) =>{
     const resultado = await funDb(req.body,path.join(__filename,recuperaUsuarioLogin.name),funContra_recuperaUsuarioLogin);
     res.status(200).json(resultado);
}

const consultarfacturas = async (req,res) => {
     console.log('consultarfacturas parametros',atob(req.body.parametros));   
     const resultado = await funDb(req.body,path.join(__filename,consultarfacturas.name),funContra_consultarfacturas);
     res.status(200).json(resultado);
}

const deudaxcedula = async (req,res) => {
     const resultado = await funDb(req.body,path.join(__filename,deudaxcedula.name),funContra_deudaxcedula);
     res.status(200).json(resultado);
}

const getRefTransaccion = async (req,res) => {
     const resultado = await funDb(req.body,path.join(__filename,getRefTransaccion.name),funContra_getRefTransaccion);     
     res.status(200).json(resultado);
};

const consultararchivo = async(req,res) => {
     const { body } = req; 
     try{
       const objeto = {
               token: atob(body.token),
               archivo: atob(body.data.archivo),
               extension:atob(body.data.extension),
               coddoc:atob(body.data.coddoc),
               empresa:atob(body.data.empresa),
               no_transaccion:atob(body.data.no_transaccion)
          };          
        let rutaArcDocElectronico = null;         
        if(objeto.extension==='pdf')
        {
          rutaArcDocElectronico = rutaPdfDocElec;           
        }
        else if(objeto.extension==='xml')
        {
          rutaArcDocElectronico = rutaXmlDocElec;           
        }     
        if(rutaArcDocElectronico)   
        {
          const filePath = path.join(path.resolve(rutaArcDocElectronico),objeto.archivo);           
          console.log('filePath',filePath);
          let datos ={
                         token:body.token,
                         data:{},
                         error:{
                         hay:true,
                         msg:'No existe documento Electronico. Por favor, si el error continua comuniquese con el GAD MUNICIPAL DEL CANTON YAGUACHI.',
                         solucion:''
                         }
                    };
          if(fs.existsSync(filePath))
          {
               const base64String = fs.readFileSync(filePath,{encoding:'base64'});            
               datos.data = btoa(JSON.stringify({
                                             archivo:base64String
                                             }));
               datos.error.hay=false;
               datos.error.msg='';
               res.json(JSON.stringify(datos));
          }      
          else if(objeto.extension==='pdf')
          {
               console.log('Objeto Archivo pdf o xml',objeto);
               crearPdfDocElec(objeto.coddoc,objeto.empresa,objeto.no_transaccion,filePath);
               setTimeout(()=>{
                    if(fs.existsSync(filePath)) 
                    {
                         const base64String01 = fs.readFileSync(filePath,{encoding:'base64'});            
                         datos.data = btoa(JSON.stringify({
                                                       archivo:base64String01
                                                       }));
                         datos.error.hay=false;
                         datos.error.msg='';
                         res.json(JSON.stringify(datos));
                    }
                    else
                    {
                         datos.data = btoa(JSON.stringify({}));
                         datos.error.hay=true;
                         datos.error.msg='Vuelva a intentar de nuevo';
                         res.json(JSON.stringify(datos));
                    }
                    
               },8000);
          }                  
          else
          {
               datos.data = btoa(JSON.stringify({}));
               datos.error.hay=true;
               datos.error.msg='No Existe Archivo Escogido';
               res.json(JSON.stringify(datos));
          }
        }
        else
        {
          const objetoError01 = {
               token:body.token,
               data:btoa(JSON.stringify({})),
               error:{
                 hay:true,
                 msg:`Error consultararchivo: Extension de Archivo mal enviada ${objeto.extension}`,
                 solucion:''
                }
              }; 
          res.status(200).json(JSON.stringify(objetoError01)); 
        }
  
     }
     catch(e)
     {
          const objetoError = {
               token:body.token,
               data:btoa(JSON.stringify({})),
               error:{
                 hay:true,
                 msg:`Error consultararchivo ${e}`,
                 solucion:''
                }
              }; 
          res.status(200).json(JSON.stringify(objetoError));  
     }
};

const recaudarenlinea = async(req,res) => {
     //console.log('req.body.parametros',JSON.parse(atob(req.body.parametros)));
     const resultado = await funDb(req.body,path.join(__filename,recaudarenlinea.name),funContra_recaudarenlinea);
     res.status(200).json(resultado);
}

const enviovaucherpagoenlinea = async(req,res) => {
     const resultado = await funDb(req.body,path.join(__filename,enviovaucherpagoenlinea.name),funContra_enviovaucherpagoenlinea);
     res.status(200).json(resultado);     
}

const consultacomprobantes = async(req,res) => {
     const resultado = await funDb(req.body,path.join(__filename,consultacomprobantes.name),funContra_consultacomprobantes);
     res.status(200).json(resultado);    

}

const consultarComprobantePDF = async(req,res) => {
     const { body } = req; 
     try{
       
          const objeto = {
               archivo: atob(body.data.archivo),
               num_comprobante:atob(body.data.num_comprobante),
               seccabiqweb:atob(body.data.seccabiqweb)
          };          
        
          const filePath = path.join(rutadocCompIng,objeto.archivo);           
          
          //console.log('filePath',filePath);          
          
          if(!fs.existsSync(filePath))           
          {
               const compro = [{num_comprobante:objeto.num_comprobante,reca:{seccabliq:objeto.seccabiqweb}}];
               await crearComprobantes({comprobantes:compro});
          }        
          const base64String = fs.readFileSync(filePath,{encoding:'base64'});            
          let datos ={
               token:body.token,
               data:{},
               error:{
               hay:true,
               msg:`No existe documento Electronico. Por favor, si el error continua comuniquese con el ${NOMBREINSTITUCION}.`,
               solucion:''
               }
          };
          datos.data = btoa(JSON.stringify({archivo:base64String}));
          datos.error.hay=false;
          datos.error.msg='';
          res.json(JSON.stringify(datos));         
  
     }
     catch(e)
     {
          const objetoError = {
               token:body.token,
               data:btoa(JSON.stringify({})),
               error:{
                 hay:true,
                 msg:`Error consultararchivo ${e}`,
                 solucion:''
                }
              }; 
          res.status(200).json(JSON.stringify(objetoError));  
     }
}



const insertaerrorpagoenlinea = async(req,res) => {
   const objeto = {
          token: '',
          identificacion: '0942502014001'
     };
     let parametros;
   try
   {
     
     let parametros = atob(req.body.parametros);
     agregarLogError(__filename,parametros);
     res.status(200).json(JSON.stringify(objeto));    
   }
   catch(e)
   {
       console.log('parametros',parametros);
       res.status(200).json(JSON.stringify(objeto));    
   }
}

const prueba = async (req,res) =>{

     const objeto = {
          token: '',
          identificacion: '0942502014001'
     };
     const datos = await dbora.prueba(objeto);     
     res.status(200).json(JSON.stringify(datos));
}


module.exports = {
    autenticacion,
    deudaxcedula,
    consultarfacturas,
    getRefTransaccion,
    logout,
    consultararchivo,
    recaudarenlinea,
    insertalogin,
    updatelogin,
    recuperaUsuarioLogin,    
    prueba,
    enviovaucherpagoenlinea,
    insertaerrorpagoenlinea,
    consultacomprobantes,
    consultarComprobantePDF    
}