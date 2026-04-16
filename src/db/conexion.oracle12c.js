const path = require('node:path');
const {getCredencialOra} = require('../gen/rutasScgp');
const {agregarLogError,agregarLogSucces} = require('../gen/gestionarchivo');
const {enviaCorreoLogError} = require('../gen/adminfile');
const {getConnection,
       getPropiedadPlsql,
       getBindVariable,
       getTypeDb,
       getDirDb,
       getErrorResultado,
       getResultado,
       getCloseConnection
      } = require('./gestiondb');

const {
       plsql_AGE_PU_AUTENTICAR_WEB,
       plsql_INSERTA_LOGIN,
       plsql_UPDATELOGIN,
       plsql_LOGOUT,
       plsql_RECUPERARUSUARIOLOGIN,
       plsql_CONSULTARDEUDA,
       plsql_RECAUDARENLINEA,
       plsql_RECAUDARENLINEA_02,
       plsql_CONSULTARFACTURAS,
       plsql_INSERTADEUDAPQ,
       plsql_INSPREDIOPQ,
       plsql_INSCATASTROPG,
       plsql_INSRUBXCATAPG,
       plsql_CONSULTALIQ_PG,
       plsql_UPDATE_RECAPEL,
       plsql_INSERTASECPROCJSON,
       plsql_INSERTAERROR_PEL,
       plsql_INSCABLIQWEB_PG,
       plsql_INSCABLIQWEBPGJSON,
       plsql_CONSULTAR_CABLIQWEBPGJSON,
       plsql_INSERTA_RECAPEL_PG,
       plsql_NUMERO_LIQUIDACION,
       plsql_CONSULTACOMPROBANTES
      } = require('./gestiondb.plsql');

const {
       result_getRegAutenticacion
      } = require('./gestiondb.resultado');      

const {consutaPredioPg,insertaComprobantePg} = require('./conexion.pg');
const objoracle = require('oracledb');

const credencial = getCredencialOra();

const redondear = (num) => {
    var m = Number((Math.abs(num) * 100).toPrecision(15));
    return Math.round(m) / 100 * Math.sign(num);
  };

const objetoError = (msgerror) => {
    
    return {
        token:'',   
        data:btoa(JSON.stringify({})),
        error:{
           hay:true,
           msg:msgerror,
           solucion:''
         }
        };
};

const funObjParametros =  (data) => {
  let objPara = {};
  data.forEach((para)=>{
    const dir     = getDirDb(para.tipo);                    
    const tipo    = getTypeDb(para.columna.tipodato);
    const value   = getPropiedadPlsql(dir,para.columna.valor,tipo,para.columna.maxlongitud);          
    objPara       = getBindVariable(para.nombre,value,objPara);                    
  });  
  return objPara;
}

const funInsertaErrorPEL = async (pv_desc1,pv_desc2) => {
  
  let tempconn;
  try
  {
    
    const texto1 = pv_desc1.substring(0,999);
    const texto2 = pv_desc2.substring(0,499); 
    const param = {
       PV_DESCRIPCION1:{ dir: objoracle.BIND_INOUT, val: texto1, type: objoracle.STRING,maxSize:1000 },
       PV_DESCRIPCION2:{ dir: objoracle.BIND_INOUT, val: texto2, type: objoracle.STRING,maxSize:500  },
       PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
      };
    tempconn = await getConnection();
    const result = await tempconn.execute(plsql_INSERTAERROR_PEL,param,{autoCommit:true}); 

  }
  catch(e)
  {
    agregarLogError('funInsertaErrorPEL',`Param ${JSON.stringify(param)} Error ${e.stack}`);
  }
  finally
  {
    if (tempconn) await getCloseConnection(tempconn);
  }
     
}

const funLogout = async (parametros,rutaname_funcion,connection) => {
  let resultado ={};
  let objPara =  funObjParametros(parametros.data);
  const result = await connection.execute(plsql_LOGOUT,objPara,{autoCommit:true});
  if(!result.outBinds.PN_ERROR)
  {    
    resultado = getResultado('',{mensaje:'Logout con exito'},getErrorResultado(false,'',''));
    agregarLogSucces(rutaname_funcion,`LOGOUT con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);            
  }
  else
  {
    const msg_error = `Error en Logout. ${result.outBinds.PV_MSG_ERROR} Parametros: ${JSON.stringify(parametros)}`;
    agregarLogError(rutaname_funcion,msg_error);
    resultado = getResultado('',{},getErrorResultado(true,msg_error,''));
  }
  return resultado;
}

const funAutenticacion = async (parametros,rutaname_funcion,connection) =>{
    let resultado ={};
    let objPara =  funObjParametros(parametros.data);    
    const result = await connection.execute(plsql_AGE_PU_AUTENTICAR_WEB,objPara,{autoCommit:true});    
    if(!result.outBinds.PN_ERROR)
    {
      const resultSet = result.outBinds.PC_USUARIO;            
      let rst=null;         
      //let row; 
      //while ((row = await resultSet.getRow())) {             
      //await resultSet.close();
      for await (const row of resultSet)
      {
          const registro = result_getRegAutenticacion(row);
          rst = getResultado(row[0],registro,getErrorResultado(false,'',''));           
      };
      
      if(rst){
        resultado = rst;
        agregarLogSucces(rutaname_funcion,`Autenticado con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
      }
      else
      {
        const msg_error = `No Existen datos para este Usuario y Clave. Parametros: ${JSON.stringify(parametros)}`;
        agregarLogError(rutaname_funcion,msg_error);
        resultado = getResultado('',{},getErrorResultado(true,msg_error,''));
      }
    }
    else
    {
      agregarLogError(rutaname_funcion,`${result.outBinds.PV_MSG_ERROR}  Parametros: ${JSON.stringify(parametros)}`);
      resultado = getResultado('',{},getErrorResultado(true,result.outBinds.PV_MSG_ERROR,''));
    }     
    
    return resultado;
}

const funInsertLogin = async (parametros,rutaname_funcion,connection) => {
  let resultado ={};
  let objPara = funObjParametros(parametros.data);
  const result = await connection.execute(plsql_INSERTA_LOGIN,objPara,{autoCommit:true});                        
  if (!result.outBinds.PN_ERROR)
  {          
    resultado = getResultado('',{mensaje:'Usuario registrado con exito.'},getErrorResultado(false,'',''));                                                                    
    agregarLogSucces(rutaname_funcion,`Usuario registrado con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
  }
  else{
    agregarLogError(rutaname_funcion,result.outBinds.PV_MSG_ERROR);
    resultado = getResultado('',{},getErrorResultado(true,`Verificar Usuario y Clave: ${result.outBinds.PV_MSG_ERROR}`,''));                            
  }
  return resultado;
}

const funUpdateLogin = async (parametros,rutaname_funcion,connection) => {
  
  let resultado ={};
  let objPara =  funObjParametros(parametros.data);
  const result = await connection.execute(plsql_UPDATELOGIN,objPara,{autoCommit:true}); 
  if (!result.outBinds.PN_ERROR)
  {
    resultado = getResultado(parametros.token,{mensaje:'Usuario actualizado con exito.'},getErrorResultado(false,'',''));                                        
    agregarLogSucces(rutaname_funcion,`Usuario Actualizado con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
  }
  else
  {
    agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: ${result.outBinds.PV_MSG_ERROR}`);
    resultado = getResultado(parametros.token,{},getErrorResultado(true,`${result.outBinds.PV_MSG_ERROR}`,''));
  }
  return resultado;
}

const funRecuperaUsuarioLogin = async (parametros,rutaname_funcion,connection) => {
  let resultado ={};
  let objPara =  funObjParametros(parametros.data);
  const result = await connection.execute(plsql_RECUPERARUSUARIOLOGIN,objPara,{autoCommit:true}); 
  if (!result.outBinds.PN_ERROR)
  {
    const data = {
                  identificacion:parametros.data[0].columna.valor,
                  nombres:result.outBinds.PV_NOMBRES,
                  usuario:parametros.data[1].columna.valor,
                  clave:result.outBinds.PV_CLAVE,
                  correo:parametros.data[2].columna.valor
                };
    resultado = getResultado('',data,getErrorResultado(false,'',''));                                        
    agregarLogSucces(rutaname_funcion,`Recuperacion de Usuario con exito Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
  }
  else
  {
    agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: ${result.outBinds.PV_MSG_ERROR}`);
    resultado = getResultado('',{},getErrorResultado(true,`${result.outBinds.PV_MSG_ERROR}`,''));
  }
  return resultado;
}

const funConsultarDeuda = async (parametros,rutaname_funcion,connection) => {
  let resultado ={};
  let objPara =  funObjParametros(parametros.data);
  //Escoger el numero
   const numeroliq = await consultarNumeroLIquidacion(connection);
  //Procesar PG
  console.log('consulta PG');
   const arrPredios = await consutaPredioPg(objPara.PV_CEDULA.val,numeroliq,connection);  
  //Procesar Oracle y Consulta la liquidacion 
  console.log('consulta ORACLE');
   objPara.PN_NUMERO.val = numeroliq;
   const result = await connection.execute(plsql_CONSULTARDEUDA,objPara,{autoCommit:true}); 
   //console.log('result',result)  
  if (!result.outBinds.PV_MSG_ERROR)
  {
    let encontro=false;    
    const resultSet = result.outBinds.PC_LIQWEB;
    const dataA=[];    
    //se consume el cursor y se debe cerrar manualmente
    //let row;
    //while ((row = await resultSet.getRow())) {
    //await resultSet.close();
    //se consume el cursor y el cursor se cierra implicitamente
    for await (const row of resultSet){
          encontro = true;
          const valor_total = redondear(row[11]);
          const objeto = {
              numero:row[0],
              cuenta:row[1], 
              titulo:row[2], 
              codigo_subconcepto:row[3], 
              valor_exonerado:row[4], 
              validar_orden_cobro:row[5], 
              anio:row[6], 
              liquidacion:row[7], 
              anio_deuda:row[8], 
              observacion:row[9], 
              direccion:row[10], 
              total_pagar:valor_total,
              aplicacion:row[12],
              seccabliq:row[13],
              numero_valida:row[14]
              };
          dataA.push(objeto); 
          //console.log('row',row);
    };    
    //Liquidacion de PG
    if(encontro)
    {
      resultado = getResultado(parametros.token,dataA,getErrorResultado(false,'',''));              
      agregarLogSucces(rutaname_funcion,`Consulta de deuda para ruc : ${parametros.data[0].columna.valor} exitosa. Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
    }
    else
    {                                
      agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: No existe valores pendientes o ya fueron pagados en su totalidad para el ruc : ${parametros.data[0].columna.valor}`);
      resultado = getResultado(parametros.token,{},getErrorResultado(true,`No existe valores pendientes o ya fueron pagados en su totalidad para el ruc : ${parametros.data[0].columna.valor}. Por favor, si tiene alguna duda con sus valores pendientes contactese con el GAD MUNICIPAL DEL CANTON YAGUACHI.`,''));
    }   
  }
  else
  {
      agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: ${result.outBinds.PV_MSG_ERROR}`);
      resultado = getResultado(parametros.token,{},getErrorResultado(true,`${result.outBinds.PV_MSG_ERROR}`,''));
  } 

  return resultado;

}

const funRecaudaELComprobantes  = async (id_json,token,dataReca,connection) => {
      
      const {transaccion,pagados} = dataReca;
      let comprobantes = [];  
      let comp_noreca = [];  
      let error = false;   
      let result_01;
      let idComprobantePago;
      try
      {
        
        for (const reca of pagados) {
          
          if(reca.aplicacion==='SCGP')
          {
            result_01 = null; 
            result_01 = await connection.execute(plsql_RECAUDARENLINEA_02,
                          {    
                          PN_SECCABLIQ:{ dir: objoracle.BIND_IN, val: reca.seccabliq, type: objoracle.NUMBER},
                          PV_SESION:{ dir: objoracle.BIND_IN, val: token, type: objoracle.STRING,maxSize:20 },
                          PV_ID_TRANSACCION:{ dir: objoracle.BIND_IN, val: transaccion.id, type: objoracle.STRING,maxSize:20 },
                          PV_CODE_TRANSACCION:{ dir: objoracle.BIND_IN, val: transaccion.authorization_code, type: objoracle.STRING,maxSize:20 },
                          PN_NUM_COMPROBANTE:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
                          PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
                          },
                          {autoCommit:true});
            
            if(!result_01.outBinds.PV_MSG_ERROR)
            {
                comprobantes.push({num_comprobante:result_01.outBinds.PN_NUM_COMPROBANTE,reca});            
            }
            else
            {
                error = true; 
                comp_noreca.push({reca,error:result_01.outBinds.PV_MSG_ERROR});
                await funInsertaErrorPEL(JSON.stringify({reca,error:result_01.outBinds.PV_MSG_ERROR}),`Inserta comprobante SCGP id_json:${id_json}`);
            }
          }
          else
          {
            idComprobantePago = -1;
            idComprobantePago = await insertaComprobantePg(reca.seccabliq,token,transaccion.id,transaccion.authorization_code,connection);
            if(idComprobantePago === -1)
            {
              error = true;
              comp_noreca.push({reca,error:'ERROR AL INSERTAR COMPROBANTE PG'});
              await funInsertaErrorPEL(JSON.stringify({reca,error:'ERROR AL INSERTAR COMPROBANTE PG'}),`Inserta comprobante PG id_json:${id_json}`);
            }
            else
            {
              comprobantes.push({num_comprobante:idComprobantePago,reca});
            }
          }

        }
        //console.log('funRecaudaELComprobantes ',JSON.stringify({comprobantes,comp_noreca})); 
        return {comprobantes,comp_noreca,error};
    
     }
     catch(e)
     {
       agregarLogError('funRecaudaELComprobantes',`Error [funRecaudaELComprobantes] al insertar comprobante de ingreso a caja ${e.stack}`);
       throw new Error(`Error al registrar comprobantes de ingreso a caja ${e.name} ${e.message}`);
     }

}

const funInsertaSecProcJSON = async(PN_ID_JSON1,PV_NOMBRE_PROCEDIMIENTO1,PV_DESC_PROCEDIMIENTO1) => {
  
  let tempconn;
  try
  {
   tempconn = await getConnection();
   const result = await tempconn.execute(plsql_INSERTASECPROCJSON,
   {     
     PV_NOMBRE_PROCEDIMIENTO:{dir: objoracle.BIND_IN,val:PV_NOMBRE_PROCEDIMIENTO1,type:objoracle.STRING,maxSize:1000},
     PV_DESC_PROCEDIMIENTO:{dir: objoracle.BIND_IN,val:PV_DESC_PROCEDIMIENTO1,type:objoracle.STRING,maxSize:500},
     PN_ID_JSON:{dir:objoracle.BIND_IN,val:PN_ID_JSON1,type:objoracle.NUMBER},
     PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
   },
   {autoCommit:true});
  }
  catch(e)
  {
    agregarLogError('funInsertaErrorPEL',`PN_ID_JSON1 ${PN_ID_JSON1} PV_NOMBRE_PROCEDIMIENTO1 ${PV_NOMBRE_PROCEDIMIENTO1} PV_DESC_PROCEDIMIENTO1 ${PV_DESC_PROCEDIMIENTO1} Error ${e.stack}`);
  }
  finally
  {
    if (tempconn) await getCloseConnection(tempconn);
  }

}

const  funInsertaJson_PagoEnLinea = async(parametros,rutaname_funcion,connection) => {
  
  try
  {
    let vv_error_peljson ='';  
    let resultado = getResultado(parametros.token,{id_json:0},getErrorResultado(false,'',''));              
    const result = await connection.execute(plsql_RECAUDARENLINEA,
    {    
        PV_JSON: JSON.stringify(parametros.data[0].columna.valor),
        PV_SESION: parametros.token,
        PN_ID_JSON:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },  
        PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    },
    {autoCommit:true});
    resultado.data.id_json = result.outBinds.PN_ID_JSON;
    if(result.outBinds.PV_MSG_ERROR)
    {   
      vv_error_peljson = `Error: No se inserto en PAGO_ENLINEA_JSON : ${result.outBinds.PV_MSG_ERROR} parametros: ${JSON.stringify(parametros)}`;
      await funInsertaErrorPEL(vv_error_peljson,`AL Inserta JSON`);
      agregarLogError(rutaname_funcion,vv_error_peljson);
      console.log('Error funInsertaJson_PagoEnLinea',vv_error_peljson);
      resultado.error = getErrorResultado(true, result.outBinds.PV_MSG_ERROR, '');
    } 

    await funInsertaSecProcJSON(resultado.data.id_json,'funInsertaJson_PagoEnLinea','INSERTA JSON EN BASE DE DATOS');

    return resultado;
  }
  catch(e)
  {
    agregarLogError(rutaname_funcion,`Error ${e.stack} `);
    throw e;
  }
}

const funRecaudarEnLinea = async(parametros_in,rutaname_funcion,connection) => {
  const {parametros,id_json} = parametros_in;
  
  let resultado = getResultado(parametros.token,{},getErrorResultado(false,'',''));  
    
  try
  {
    const objCompro = await funRecaudaELComprobantes(id_json,parametros.token,parametros.data[0].columna.valor,connection);    
    const {comprobantes,comp_noreca} = objCompro;
  
    if(comp_noreca.length>0)
    {
      agregarLogError(rutaname_funcion,`Comprobantes no han sido recaudados : ${comp_noreca.toString()} parametros: ${JSON.stringify(parametros)}`);
      resultado.error.hay = true;    
      resultado.error.msg = `Comprobantes no han sido recaudados : ${comp_noreca.toString()} `;
    }  
    if(comprobantes.length>0)
    {
      agregarLogSucces(rutaname_funcion,`Comprobantes han sido recaudados con exito : ${comprobantes.toString()} parametros: ${JSON.stringify(parametros)}`);        
      resultado.data = {comprobantes};
      if(resultado.error.hay)
      {
        resultado.error.msg = `${resultado.error.msg} y Comprobantes han sido recaudados con exito : ${comprobantes.toString()} `;      
        agregarLogError(rutaname_funcion,`Comprobantes no han sido recaudados con exito : ${comprobantes.toString()} Comprobantes no han sido recaudados : ${comp_noreca.toString()} `);
        enviaCorreoLogError(`Comprobantes no han sido recaudados con exito : ${comprobantes.toString()} Comprobantes no han sido recaudados : ${comp_noreca.toString()} `);
      }
    }
    else
    {
      resultado.error.hay = true;        
      resultado.error.msg = `${parametros} y Comprobantes no han sido recaudados : ${comp_noreca.toString()} `;
      enviaCorreoLogError(`No se pudo completar la transaccion de cobro en linea en la DB de la institucion para : ${JSON.stringify(parametros)} ERROR: No se generaron los comprobantes. Hay que ingresarlo Manualmente.`);
    }   
  
    await funInsertaSecProcJSON(id_json,'funRecaudarEnLinea','INSERTA COMPROBANTES PAGADOS');
    
    return resultado;

  }
  catch(e)
  {
    agregarLogError(rutaname_funcion,`Error ${e.stack} `);
    throw e;
  }

}

const funConsultarfacturas = async(parametros,rutaname_funcion,connection) => {
  let resultado ={};
  let objPara = funObjParametros(parametros.data);
  //console.log('funConsultarfacturas objPara',objPara);
  const result = await connection.execute(plsql_CONSULTARFACTURAS,objPara,{autoCommit:true});    
  //console.log('funConsultarfacturas result',result);
  let encontro=false;
  let data =  result.rows.map((obj)=>{
      encontro = true;
      return obj.reduce((obj01,valor,indice)=>{
          obj01[result.metaData[indice].name.toLowerCase()] = valor;
          return obj01;
      },{});                          
  }); 
  //console.log('data',data);  
  if(encontro)
  {
    resultado = getResultado(parametros.token,data,getErrorResultado(false,'',''));              
    agregarLogSucces(rutaname_funcion,`Consulta de facturas para ruc : ${parametros.data[0].columna.valor} exitosa. Resultado: ${JSON.stringify(resultado)} Parametros: ${JSON.stringify(parametros)}`);        
  }
  else
  {                                
    agregarLogError(rutaname_funcion,`parametros: ${JSON.stringify(parametros)} error: No existen documentos electronicos para el ruc : ${parametros.data[0].columna.valor}`);
    resultado = getResultado(parametros.token,{},getErrorResultado(true,`No existen documentos electronicos para el ruc : ${parametros.data[0].columna.valor}. Por favor, si tiene alguna duda con sus valores pendientes contactese con el CBD.`,''));
  } 
  //console.log('funConsultarfacturas resultado',resultado);
  return resultado;
}

const funConsultarComprobantes = async(parametros,rutaname_funcion,connection) => {
  
  let resultado = null;
  try
  {
    //console.log('parametros',parametros);
    
    let objPara = funObjParametros(parametros.data);
    
    console.log('objPara',objPara);

    const result = await connection.execute(plsql_CONSULTACOMPROBANTES,objPara,{outFormat: objoracle.OUT_FORMAT_OBJECT});    

    //const data = result.rows; // Cuando lo envio normalmente
    const data = result.rows.map((row, index) => {
      return {
        // Tabulator recomienda tener un ID único. 
        // Si no tienes uno, podemos usar el índice o el NUM_COMPROBANTE
        id: index + 1, 
        comprobante: row.NUM_COMPROBANTE,
        fechacomprobante: row.FECHA_COMPROBANTE,
        concepto: row.DESCRIPCION,
        valor: row.VALOR_TOTAL, // Convertimos el string a número para que Tabulator pueda sumar/ordenar mejor
        direccion: row.DIRECCION,
        transaction_id: row.TRANSACTION_ID,
        authorization_mode: row.AUTHORIZATION_CODE,
        seccabiqweb: row.SECABLIQWEB
      };
    });
    console.log('resultado',resultado);
    resultado = getResultado(parametros.token,data,getErrorResultado(false,'',''));              
    
  }
  catch(e)
  {
    resultado = getResultado(parametros.token,{},getErrorResultado(true,`Error al consultar comprobantes de Ingreso a Caja para el ruc : ${parametros.data[0].columna.valor}. ${e.toString()}`,''));                  
  }
  console.log('resultado1',resultado);

  return resultado; 

}


const funConnection = async (parametros,rutaname_funcion,f) => {  
  let resultado ={};
  let connection;
  try
  {        
      connection = await getConnection();   
      resultado = await f(parametros,rutaname_funcion,connection);           
        
  }
  catch(e)
  {
    const msg_error = `token: ${parametros.token} Parametros: ${JSON.stringify(parametros)}  error: ${e.toString()} , Hay un invonveniente en la conexion, por favor, intente en unos minutos.`;
    agregarLogError(rutaname_funcion,msg_error);
    resultado = getResultado(parametros.token,{},getErrorResultado(true,e.toString(),'')) ;             
    if(f.name==='funRecaudarEnLinea')
    {
      enviaCorreoLogError(`No se pudo completar la transaccion de cobro en linea en la DB de la institucion para : ${JSON.stringify(parametros)} ERROR: ${e.toString()}. Hay que ingresarlo Manualmente.`);
    }
  }
  finally
  {
    if(connection)
    {
      await getCloseConnection(connection); 
      //console.log('Cerrar o liberar Conexion Oracle finally');  
    }
  }    

  return resultado;

}

async function consultarDeuda(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,consultarDeuda.name),funConsultarDeuda);
  return resultado;
}

async function consultarfacturas(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,consultarfacturas.name),funConsultarfacturas);
  return resultado;         
}

async function autenticacion(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,autenticacion.name),funAutenticacion);
  return resultado;
}

async function logout(parametros){
   const resultado = await funConnection(parametros,path.join(__filename,logout.name),funLogout); 
   return resultado;
}

async function insertaJsonPEL(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,insertaJsonPEL.name),funInsertaJson_PagoEnLinea); 
  return resultado;
}

async function recaudarenlinea(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,recaudarenlinea.name),funRecaudarEnLinea); 
  return resultado;
}

async function updatelogin(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,updatelogin.name),funUpdateLogin);
  return resultado;
}

async function insertlogin(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,insertlogin.name),funInsertLogin);
  return resultado;
}

async function recuperaUsuarioLogin(parametros){
  const resultado = await funConnection(parametros,path.join(__filename,recuperaUsuarioLogin.name),funRecuperaUsuarioLogin);
  return resultado;        
}

async function consultarComprobantes(parametros){
  //console.log('consultarComprobantes');
  const resultado = await funConnection(parametros,path.join(__filename,consultarComprobantes.name),funConsultarComprobantes);
  return resultado;        
}

async function prueba(objeto){
    
    let objetoResultado=null;
    const recaudarenlinea = {
        token: '20240115121520196',
        data: {
          usuario: {
            tipoidentificacion: '04',
            identificacion: '0922321963001',
            nombres: 'DIANA VALERIA -LA BARZALLO PLUAS',
            celular: '09',
            direccion: 'SN',
            correo: 'barzallod@yahoo.com',
            usuario: '0922321963001',
            clave: '123'
          },
          pagados: [ {a:1} ],
          tarjeta: {
            number: '1111',
            bin: '411111',
            type: 'vi',
            transaction_reference: 'DF-498795',
            status: '',
            token: '',
            expiry_year: '2024',
            expiry_month: '1',
            origin: 'Paymentez'
          },
          transaccion: {
            id: 'DF-498795',
            status: 'success',
            current_status: 'APPROVED',
            status_detail: 3,
            payment_date: '2024-01-15T17:59:46.016',
            amount: 42.14,
            installments: 0,
            carrier_code: '00',
            message: 'Response by mock',
            authorization_code: 'VM4LtD',
            dev_reference: 'DIANA VALERIA -LA BARZALLO PLUAS',
            carrier: 'DataFast',
            product_description: 'DIANA VALERIA -LA BARZALLO PLUAS',
            payment_method_type: '0',
            trace_number: '332883',
            lot_number: '000249',
            installments_type: 'Revolving credit'
          }
        }
      };
    const datajson = JSON.stringify(recaudarenlinea); 
    const bdatajson = Buffer.from(datajson, 'utf8');
    try
    {
       
        console.log('consultarDeuda ini',objeto);
        const conection = await objoracle.getConnection(credencial);             
        const sql = `BEGIN
                      INSERT INTO ARE_PAGOENLINEA_JSON(PAGO,SESION, FECHA_INGRESO) VALUES(:PV_JSON,:PV_SESION,SYSDATE);                   
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PV_MSG_ERROR := 'ERROR AL INSERTAR ARE_PAGOENLINEA_JSON '||SQLERRM;
                      END;`;
        const result = await conection.execute(sql,
                            {    
                              PV_JSON: datajson      ,                         
                              PV_SESION:recaudarenlinea.token,
                              PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: null, type: objoracle.STRING,maxSize:1000 }
                            },
                            {autoCommit:true});                                                                       
         //console.log('resultado',result.outBinds);
         const {PV_MSG_ERROR} = result.outBinds;
         //console.log('PV_MSG_ERROR',PV_MSG_ERROR);
         if(PV_MSG_ERROR == null)
         {console.log('Variable nula o undefined');}
         objetoResultado = result.outBinds;     
         const r = await conection.execute(`SELECT PAGO FROM ARE_PAGOENLINEA_JSON WHERE SESION=:PV_SESION`,[recaudarenlinea.token]);
         if (r.rows.length) {
            const lob = r.rows[0][0];  // just show first row
            const d = await lob.getData();            
            console.log('d',JSON.parse(d));            
            objetoResultado = d;
          } else {
            objetoResultado = {msg:'no'};
            console.log('No rows fetched');
          }
         
                             
        close(conection);         
    }
    catch(e)
    {
        const msg = `Error al insertar json2 ${e}`;
        objetoResultado = objetoError(msg);   
        objetoResultado.token = btoa(objeto.token);
        console.log('consultarDeuda error',objetoResultado);                
    }

    return objetoResultado;

}

async function insertaDeudaPQ(dataPQ){
 let numero = 0;
 const conection = await objoracle.getConnection(credencial); 

 try{
    const result01 = await conection.execute(
     `
      BEGIN
       SELECT SEC_DEUDA_NUMERO_PQ.NEXTVAL INTO :PN_NUMERO FROM DUAL;
      END;
     `,
     {
      PN_NUMERO:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER }, 
     },
     {autoCommit:true}
   ); 
   numero = result01.outBinds.PN_NUMERO;

 //el forEach no espera el await, este debe ser reemplazado por for(const registro of dataPQ )
 dataPQ.forEach(async (registro) => {
    
    const param = {
      PN_ID_PREDIO:{ dir: objoracle.BIND_IN, val: registro.id_predio, type: objoracle.NUMBER },
      PV_CODIGO_CATASTRAL:{ dir: objoracle.BIND_IN, val: registro.codigo_catastral, type: objoracle.STRING,maxSize:200 },
      PV_NUMERO_IDENTIFICACION:{ dir: objoracle.BIND_IN, val: registro.numero_identificacion, type: objoracle.STRING,maxSize:30 },
      PV_NOMBRE_PROPIETARIO:{ dir: objoracle.BIND_IN, val: registro.nombre_propietario, type: objoracle.STRING,maxSize:300 },
      PN_ANIO:{ dir: objoracle.BIND_IN, val: parseInt(registro.anio), type: objoracle.NUMBER },
      PN_ID_RUBRO:{ dir: objoracle.BIND_IN, val: registro.id_rubro, type: objoracle.NUMBER },
      PV_DESCRIPCION:{ dir: objoracle.BIND_IN, val: registro.descripcion, type: objoracle.STRING,maxSize:30 },
      PN_VALOR1:{ dir: objoracle.BIND_IN, val: Number(registro.valor1), type: objoracle.NUMBER },
      PN_VALOR2:{ dir: objoracle.BIND_IN, val: Number(registro.valor2), type: objoracle.NUMBER },
      PN_NUMERO:{ dir: objoracle.BIND_INOUT, val: numero, type: objoracle.NUMBER },
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
     };
     //console.log('reg',param);
     //---
     const result = await conection.execute(
      plsql_INSERTADEUDAPQ,
      param,
      {autoCommit:true}
        ); 

    if (result.outBinds.PN_ERROR)
    {
      agregarLogError('insertaDeudaPQ ',result.outBinds.PV_MSG_ERROR);
    }
  
  });
  close(conection);

 }
 catch(e)
 {
   agregarLogError('insertaDeudaPQ: catch ',e.toString());
 }
 finally
 {
  console.log('insertaDeudaPQ entro finally');  
 }

 return numero;
 
}

async function insertaPredioPg(registro,connectionDbOra)
{
  let sec_reg=-1;
  try{
        //const conection = await objoracle.getConnection(credencial); 
        //close(conection);
        //console.log(JSON.stringify(registro));
        const param = {
          PN_SECUENCIA:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
          PV_MODULO:{ dir: objoracle.BIND_IN, val: registro.modulo, type: objoracle.STRING,maxSize:3 },
          PN_ID_CLASE_PREDIO:{ dir: objoracle.BIND_IN, val: registro.id_clase_predio, type: objoracle.NUMBER },
          PN_ID_PREDIO:{ dir: objoracle.BIND_IN, val: Number(registro.id_predio), type: objoracle.NUMBER },
          PN_ANIO_INGRESO:{ dir: objoracle.BIND_IN, val: parseInt(registro.anio_ingreso), type: objoracle.NUMBER },
          PV_CODIGO_VIGENTE:{ dir: objoracle.BIND_IN, val: registro.codigo_vigente, type: objoracle.STRING,maxSize:200 },
          PV_CALLE_PRINCIPAL:{ dir: objoracle.BIND_IN, val: registro.calle_principal, type: objoracle.STRING,maxSize:300 },
          PV_DIRECCION_NUMERO:{ dir: objoracle.BIND_IN, val: registro.direccion_numero, type: objoracle.STRING,maxSize:100 },
          PV_CALLE_SECUNDARIA:{ dir: objoracle.BIND_IN, val: registro.calle_secundaria, type: objoracle.STRING,maxSize:300 },
          PN_ID_TIPO_IDENTIFICACION:{ dir: objoracle.BIND_IN, val: Number(registro.id_tipo_identificacion), type: objoracle.NUMBER },
          PV_NUMERO_IDENTIFICACION:{ dir: objoracle.BIND_IN, val: registro.numero_identificacion, type: objoracle.STRING,maxSize:30 },
          PV_APELLIDO_PATERNO:{ dir: objoracle.BIND_IN, val: registro.apellido_paterno, type: objoracle.STRING,maxSize:100 },
          PV_APELLIDO_MATERNO:{ dir: objoracle.BIND_IN, val: registro.apellido_materno, type: objoracle.STRING,maxSize:100 },
          PV_PRIMER_NOMBRE:{ dir: objoracle.BIND_IN, val: registro.primer_nombre, type: objoracle.STRING,maxSize:100 },
          PV_SEGUNDO_NOMBRE:{ dir: objoracle.BIND_IN, val: registro.segundo_nombre, type: objoracle.STRING,maxSize:100 },
          PV_NOMBRE_COMPLETO:{ dir: objoracle.BIND_IN, val: registro.nombres, type: objoracle.STRING,maxSize:400 },
          PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
          PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
         };
         //console.log(param);
         const result = await connectionDbOra.execute(plsql_INSPREDIOPQ,param,{autoCommit:true}); 
         //console.log( result.outBinds.PN_SECUENCIA);
         sec_reg = result.outBinds.PN_SECUENCIA;

  }
  catch(e)
  {
    sec_reg = -1;
    console.log('Error Inserta Predio Oracle ',e.toString());
  }

  return sec_reg;
}

async function insertaCatastroPg(pn_sec_cab,registro,connectionDbOra)
{
  let vn_sec_reg=0;
  try
  {
    //const conection = await objoracle.getConnection(credencial); 
    //close(conection);
    const param = {
      PN_SECUENCIA:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
      PN_ID_PREDIO:{ dir: objoracle.BIND_IN, val: Number(registro.id_predio), type: objoracle.NUMBER },
      PN_ANIO:{ dir: objoracle.BIND_IN, val: parseInt(registro.anio), type: objoracle.NUMBER },
      PN_SECUENCIA_PG:{ dir: objoracle.BIND_IN, val: registro.secuencia, type: objoracle.NUMBER },
      PN_AVALUO_SOLAR:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_solar), type: objoracle.NUMBER },
      PN_AVALUO_EDIFICACION:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_edificacion), type: objoracle.NUMBER },
      PN_AVALUO_PROPIEDAD:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_propiedad), type: objoracle.NUMBER },
      PN_AVALUO_IMPONIBLE:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_imponible), type: objoracle.NUMBER },
      PN_AVALUO_COMERCIAL:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_comercial), type: objoracle.NUMBER },
      PN_AVALUO_EDIFICA_SINADICION:{ dir: objoracle.BIND_IN, val: Number(registro.avaluo_edifica_sin_adicion), type: objoracle.NUMBER },
      PN_AREA_SOLAR_GRAFICA:{ dir: objoracle.BIND_IN, val: Number(registro.area_solar_grafica), type: objoracle.NUMBER },
      PV_FECHA_EMISION:{ dir: objoracle.BIND_IN, val: registro.fecha_emision, type: objoracle.STRING,maxSize:30 },
      PN_AREA_CONSTRUCCION:{ dir: objoracle.BIND_IN, val: Number(registro.area_construccion), type: objoracle.NUMBER },
      PN_VALOR_EXONERACION:{ dir: objoracle.BIND_IN, val: Number(registro.valor_exoneracion), type: objoracle.NUMBER },
      PV_NUMERO_TC:{ dir: objoracle.BIND_IN, val: registro.numero_tc, type: objoracle.STRING,maxSize:30 },
      PN_SECUENCIA_CAB:{ dir: objoracle.BIND_INOUT, val: pn_sec_cab, type: objoracle.NUMBER },
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
     };
     const result = await connectionDbOra.execute(plsql_INSCATASTROPG,param,{autoCommit:true}); 
     vn_sec_reg = result.outBinds.PN_SECUENCIA;
         
  }
  catch(e)
  {
    vn_sec_reg = -1;
    console.log('Error Inserta Catastro Oracle ',e.toString());
  }

  return vn_sec_reg;
}

async function insertaRubXCataPg(pn_id_predio,pn_anio_DEUDA,pn_secuenciapg,pn_sec_cab,registro,connectionDbOra)
{
  let vn_sec_reg=0;
  try
  {
    //const conection = await objoracle.getConnection(credencial); 
    //close(conection);
    const param = {
     PN_SECUENCIA:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
     PN_IDPREDIO:{ dir: objoracle.BIND_IN, val: pn_id_predio, type: objoracle.NUMBER },
     PN_ANIO:{ dir: objoracle.BIND_IN, val: pn_anio_DEUDA, type: objoracle.NUMBER },
     PN_SECUENCIA_PG:{ dir: objoracle.BIND_IN, val: pn_secuenciapg, type: objoracle.NUMBER },
     PN_SECUENCIA_CAB:{ dir: objoracle.BIND_IN, val: pn_sec_cab, type: objoracle.NUMBER },
     PN_CODIGO_RUBRO:{ dir: objoracle.BIND_IN, val: registro.id_rubro, type: objoracle.NUMBER },
     PV_DESC_RUBRO:{ dir: objoracle.BIND_IN, val: registro.rubro, type: objoracle.STRING,maxSize:200 },
     PN_VALOR:{ dir: objoracle.BIND_IN, val: Number(registro.valor_impuesto), type: objoracle.NUMBER },
     PN_VALOR1:{ dir: objoracle.BIND_IN, val: Number(registro.valor1), type: objoracle.NUMBER },
     PN_VALOR2:{ dir: objoracle.BIND_IN, val: Number(registro.valor2), type: objoracle.NUMBER },
     PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
     PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
     const result = await connectionDbOra.execute(plsql_INSRUBXCATAPG,param,{autoCommit:true}); 
     vn_sec_reg = result.outBinds.PN_SECUENCIA;
         
  }
  catch(e)
  {
    vn_sec_reg = -1;
    console.log('Error Inserta Rubros x Catastro Oracle ',e.toString());
  }

  return vn_sec_reg;
}

async function consultaLiqPG(pn_seccab_liq,pv_session,pv_idtransaccion,pv_codetransaccion,connectionDbOraDb){
  
  let connectionDbOra;
  let comprobante = {};
 /* const ref_recauda = {
    id_usuario : 37,
    id_caja : 1,
    id_asignacion_comprobante : 12,
    id_perfil : 7,
  };*/
  let vv_msg_error='error';
  try
  {
     if(!connectionDbOraDb)
    {
      connectionDbOra = await getConnection();
      console.log('connectionDbOra',connectionDbOra);
    }
    else
    {
      connectionDbOra = connectionDbOraDb;
      console.log('connectionDbOraDb',connectionDbOraDb);
    }  

    //PARA LLAMAR LIQUIDACION EN LA DB
     const objjson = await consultarCabLiqWebJson(pn_seccab_liq,connectionDbOra);
   
    const param = {
      PN_SECCABLIQ:{ dir: objoracle.BIND_IN, val: pn_seccab_liq, type: objoracle.NUMBER },
      PV_SESION:{ dir: objoracle.BIND_IN, val: pv_session, type: objoracle.STRING,maxSize:100 },                                                              
      PV_ID_TRANSACCION:{ dir: objoracle.BIND_IN, val: pv_idtransaccion, type: objoracle.STRING,maxSize:100 },
      PV_CODE_TRANSACCION:{ dir: objoracle.BIND_IN, val: pv_codetransaccion, type: objoracle.STRING,maxSize:100 },
      PV_MODULO:{dir: objoracle.BIND_IN, val: objjson.modulo , type: objoracle.STRING,maxSize:3},
      PV_NUMERO_IDENTIFICACION:{dir: objoracle.BIND_IN, val: objjson.numero_identificacion, type: objoracle.STRING,maxSize:30 },
      PV_APELLIDO_PATERNO:{dir: objoracle.BIND_IN, val: objjson.apellido_paterno, type: objoracle.STRING,maxSize:100 },
      PV_APELLIDO_MATERNO:{dir: objoracle.BIND_IN, val: objjson.apellido_materno, type: objoracle.STRING,maxSize:100 },
      PV_NOMBRES:{dir: objoracle.BIND_IN, val: objjson.nombres , type: objoracle.STRING,maxSize:200 },
      PV_OBSERVACION:{dir: objoracle.BIND_IN, val: objjson.observacion, type: objoracle.STRING,maxSize:1000 },
      PV_DIRECCION:{dir: objoracle.BIND_IN, val: objjson.direccion, type: objoracle.STRING,maxSize:100 },       
      PN_VALOR_RECIBIDO:{ dir: objoracle.BIND_IN, val: objjson.total_recibido, type: objoracle.NUMBER },
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }      
    };
    const result = await connectionDbOra.execute(plsql_INSERTA_RECAPEL_PG,param,{autoCommit:true}); 
    vv_msg_error = result.outBinds.PV_MSG_ERROR;
     
    comprobante = {
      id_comprobante:1,
      numero_comprobante_pago:0,
      id_usuario: 37, //Usuario que cobra
      id_caja: 1, // Codigo de la Caja
      id_asignacion_comprobante : 12,
      id_perfil : 7, // Cajero
      id_tipo_identificacion: objjson.id_tipo_identificacion,
      numero_identificacion: objjson.numero_identificacion,
      nombre_propietario : objjson.nombre_propietario,
      id_clase_predio: objjson.id_clase_predio,
      clave_catastral: objjson.clave_catastral,
      id_predio_periodo : objjson.id_predio_periodo,
      id_predio: objjson.id_predio,
      anio_predio : objjson.anio,
      //anio_pago int4 NOT NULL,--año de la recaudacion
      avaluo_solar : objjson.avaluo_solar,
      avaluo_edificacion : objjson.avaluo_edificacion,
      avaluo_propiedad : objjson.avaluo_propiedad,
      avaluo_imponible : objjson.avaluo_imponible,
      avaluo_comercial : objjson.avaluo_comercial,
      numero_tc : objjson.numero_tc,
      //estado bpchar(1) NOT NULL,
      //coactiva bool NOT NULL,
      //convenio bool NOT NULL,
      valor_nominal : objjson.valor_nominal,
      valor_descuento : objjson.valor_descuento,
      valor_exoneracion : objjson.valor_exoneracion,
      valor_interes : objjson.valor_interes,
      //valor_punitorio : 
      valor_coactiva : objjson.valor_coactiva,
      //valor_convenio numeric(20, 2) NOT NULL,
      valor_abono : objjson.valor_abono,
      valor_mora : objjson.valor_mora,
      //valor_recibido_efectivo numeric(20, 2) NOT NULL,
      //valor_recibido_cheque numeric(20, 2) NOT NULL,
      //valor_recibido_nc_o_transferencia numeric(20, 2) NOT NULL,
      //fecha_pago timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
      //fecha_reverso timestamp NULL,
      total_recibido : objjson.total_recibido,
      //id_tipo_semestre_pago int2 DEFAULT 1 NOT NULL,
      secuencia : objjson.secuencia,
      //estado_registro bool DEFAULT true NOT NULL,
      //usuario_ingreso varchar(20) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      //fecha_ingreso timestamp(0) NOT NULL,
      //ip_ingreso varchar(30) NULL,
      //usuario_modificacion varchar(20) NULL,
      //fecha_modificacion timestamp(0) NULL,
      //ip_modificacion varchar(30) NULL,
      //json_impreso text NOT NULL,
      //id_usuario_reverso int4 NULL,
      //observacion_reverso
      detalle_rubros:objjson.arrRubrosxcatastro
    };   
         
  }
  catch(e)
  {
    comprobante = {
      id_comprobante: 0
    };
    console.log(`Error consultaLiqPG ${vv_msg_error} ${e.toString()}`);
  }
  finally
  {
    if(!connectionDbOraDb)
    {
      await getCloseConnection(connectionDbOra);
    }
  }

  return comprobante;

}

async function updataRecaPEL(pn_secabliqweb,pn_numIdcompro,pv_session,pv_idtransaccion,connectionDbOraDb){
  let connectionDbOra;
  let vn_error=0;
  try
  {
     if(!connectionDbOraDb)
    {
      connectionDbOra = await getConnection();
      console.log('connectionDbOra',connectionDbOra);
    }
    else
    {
      connectionDbOra = connectionDbOraDb;
      console.log('connectionDbOraDb',connectionDbOraDb);
    }  
    //const conection = await objoracle.getConnection(credencial); 
    //close(conection);
    const param = {
      PN_SECCABLIQWEB:{ dir: objoracle.BIND_IN, val: pn_secabliqweb, type: objoracle.NUMBER },
      PN_NUM_COMPROBANTE:{ dir: objoracle.BIND_IN, val: pn_numIdcompro, type: objoracle.NUMBER},  
      PV_SESION:{ dir: objoracle.BIND_IN, val: pv_session, type: objoracle.STRING,maxSize:100},    
      PV_TRANSACTION_ID:{ dir: objoracle.BIND_IN, val: pv_idtransaccion, type: objoracle.STRING,maxSize:100},       
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
    const result = await connectionDbOra.execute(plsql_UPDATE_RECAPEL,param,{autoCommit:true}); 
    vn_error  = result.outBinds.PN_ERROR;
  }
  catch(e)
  {
    console.log('Error: updataRecaPEL',e.toString());
  }
  finally
  {
    if(!connectionDbOraDb)
    {
      await getCloseConnection(connectionDbOra);
    }
  }

  return vn_error;

}


async function insertCabLiqWeb(liqCabCata)
{
  let connectionDbOra;
  let numeroLiq = 0;
  let param={};  
  try
  {
    //console.log('insertCabLiqWeb inicio');
    connectionDbOra = await getConnection();
    param = {
      PN_NUMERO: { dir: objoracle.BIND_IN, val: liqCabCata.numero, type: objoracle.NUMBER },
      PV_MODULO: { dir: objoracle.BIND_IN, val: liqCabCata.modulo, type: objoracle.STRING,maxSize:3 },
      PN_CUENTA: { dir: objoracle.BIND_IN, val: liqCabCata.id_predio, type: objoracle.NUMBER },
      PN_ANIO: { dir: objoracle.BIND_IN, val: liqCabCata.anio, type: objoracle.NUMBER },
      PN_LIQUIDACION: { dir: objoracle.BIND_IN, val: liqCabCata.secuencia, type: objoracle.NUMBER },
      PV_CONCEPTO: { dir: objoracle.BIND_IN, val: liqCabCata.concepto, type: objoracle.STRING,maxSize:300 },
      PV_SUBCONCEPTO:  { dir: objoracle.BIND_IN, val: liqCabCata.subconcepto, type: objoracle.STRING,maxSize:300 },
      PV_CEDULA: { dir: objoracle.BIND_IN, val: liqCabCata.numero_identificacion, type: objoracle.STRING,maxSize:20 },
      PV_NOMBRES:  { dir: objoracle.BIND_IN, val: liqCabCata.nombres, type: objoracle.STRING,maxSize:200 },
      PV_APELLIDO_PATERNO:  { dir: objoracle.BIND_IN, val: liqCabCata.apellido_paterno, type: objoracle.STRING,maxSize:100 },
      PV_APELLIDO_MATERNO:  { dir: objoracle.BIND_IN, val: liqCabCata.apellido_materno, type: objoracle.STRING,maxSize:100 },
      PV_DIRECCION:  { dir: objoracle.BIND_IN, val: liqCabCata.direccion, type: objoracle.STRING,maxSize:100 },
      PV_OBSERVACION:  { dir: objoracle.BIND_IN, val: liqCabCata.observacion, type: objoracle.STRING,maxSize:1000 },
      PV_TITULO_CREDITO:  { dir: objoracle.BIND_IN, val: liqCabCata.numero_tc, type: objoracle.STRING,maxSize:30 },
      PN_VALOR_EXO: { dir: objoracle.BIND_IN, val: liqCabCata.valor_exoneracion, type: objoracle.NUMBER },
      PN_VALOR_NOMINAL: { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_IMPUESTO_PREDIAL: { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_INTERES: { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_MORA : { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_COACTIVA : { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_DESCUENTO : { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_TOTAL : { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PN_SECCABLIQ: { dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PT_DETALLES: { dir: objoracle.BIND_IN, val: liqCabCata.arrRubrosxcatastro, type: "RECAUDA.TAB_RUBRO_LIQ"},
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
    const result               = await connectionDbOra.execute(plsql_INSCABLIQWEB_PG,param,{autoCommit:true}); 
    //console.log('insertCabLiqWeb ejecuto');
    liqCabCata.seccabliq       = result.outBinds.PN_SECCABLIQ;
    liqCabCata.valor_nominal   = result.outBinds.PN_VALOR_NOMINAL;
    liqCabCata.impuestopredial = result.outBinds.PN_IMPUESTO_PREDIAL;
    liqCabCata.valor_interes   = result.outBinds.PN_INTERES;
    liqCabCata.valor_mora      = result.outBinds.PN_MORA;
    liqCabCata.valor_coactiva  = result.outBinds.PN_COACTIVA;
    liqCabCata.valor_descuento = result.outBinds.PN_DESCUENTO;
    liqCabCata.total_recibido  = result.outBinds.PN_TOTAL;
    const vnerror      =  result.outBinds.PN_ERROR;
    const vv_msg_error =  result.outBinds.PV_MSG_ERROR;    
    //console.log('insertCabLiqWeb datos');
    
  }
  catch(e)
  {
    numeroLiq = -1;
    console.log('error insertCabLiqWeb',e.toString());
    console.log('insertCabLiqWeb pn_Numero',liqCabCata.numero);
  }
  finally
  {
    await getCloseConnection(connectionDbOra);
  }

  return numeroLiq;
}



async function insertCabLiqWebPGJson(liqCabCata)
{
  let connectionDbOra;
  try
  {
    
    connectionDbOra = await getConnection();
    const param = {
      PN_SECUENCIA_CAB: {dir: objoracle.BIND_IN, val: liqCabCata.seccabliq, type: objoracle.NUMBER},
      PV_JSON: JSON.stringify(liqCabCata),
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
    const result = await connectionDbOra.execute(plsql_INSCABLIQWEBPGJSON,param,{autoCommit:true}); 
     //console.log('insertCabLiqWebPGJson: pv_msg_error ',result.outBinds.PV_MSG_ERROR);
    
  }
  catch(e)
  {
    console.log('error insertCabLiqWebPGJson',e.toString());
  }
  finally
  {
    await getCloseConnection(connectionDbOra);
  }
}

async function consultarCabLiqWebJson(pn_seccabliq,connectionDbOraDb)
{
  let connectionDbOra;
  let json={};
  try
  {
    if(!connectionDbOraDb)
    {
      connectionDbOra = await getConnection();
    }
    else
    {
      connectionDbOra = connectionDbOraDb;
    }  

    const param = {
      PN_SECCABLIQ: {dir: objoracle.BIND_IN, val: pn_seccabliq, type: objoracle.NUMBER},
      PV_JSON: { dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:32767 },
      PN_ERROR: {dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
    const result = await connectionDbOra.execute(plsql_CONSULTAR_CABLIQWEBPGJSON,param,{autoCommit:true}); 
    json = JSON.parse(result.outBinds.PV_JSON);
    console.log('consultarCabLiqWebJson: pv_msg_error ',result.outBinds.PV_MSG_ERROR);

  }
  catch(e)
  {
     console.log('ERROR consultarCabLiqWebJson',e.toString());
  }
  finally
  {
     if(!connectionDbOraDb)
    {
      await getCloseConnection(connectionDbOra);
    }
    
  }

  return json;

}

async function consultarNumeroLIquidacion(connectionDbOraDb)
{
 let connectionDbOra;
 let numero=0;
  try
  {
    if(!connectionDbOraDb)
    {
      connectionDbOra = await getConnection();      
    }
    else
    {
      connectionDbOra = connectionDbOraDb;      
    } 

    const param = {
      PN_NUMERO:{dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER},
      PN_ERROR:{ dir: objoracle.BIND_INOUT, val: 0, type: objoracle.NUMBER },
      PV_MSG_ERROR:{ dir: objoracle.BIND_INOUT, val: '', type: objoracle.STRING,maxSize:1000 }
    };
    const result = await connectionDbOra.execute(plsql_NUMERO_LIQUIDACION,param,{autoCommit:true}); 
    numero = result.outBinds.PN_NUMERO;    
  }
  catch(e)
  {
   console.log('error consultarNumeroLIquidacion',e.toString());
  }
  finally
  {
     if(!connectionDbOraDb)
    {
      await getCloseConnection(connectionDbOra);
    }
  }
  
  return numero;

}

function close(cn)
{
    cn.release(
        function(err){
            if(err){
                console.error(err.message);
            }
        }
    );
}


exports.close = close;
exports.consultarDeuda = consultarDeuda;
exports.autenticacion = autenticacion;
exports.consultarfacturas = consultarfacturas;
exports.logout = logout;
exports.recaudarenlinea = recaudarenlinea;
exports.insertlogin = insertlogin;
exports.updatelogin = updatelogin;
exports.recuperaUsuarioLogin = recuperaUsuarioLogin;
exports.prueba = prueba;
exports.insertaDeudaPQ = insertaDeudaPQ;
exports.insertaPredioPg = insertaPredioPg;
exports.insertaCatastroPg = insertaCatastroPg;
exports.insertaRubXCataPg = insertaRubXCataPg;
exports.consultaLiqPG = consultaLiqPG;
exports.updataRecaPEL = updataRecaPEL;
exports.insertaJsonPEL = insertaJsonPEL;
exports.insertCabLiqWeb = insertCabLiqWeb;
exports.insertCabLiqWebPGJson = insertCabLiqWebPGJson;
exports.consultarCabLiqWebJson = consultarCabLiqWebJson;
exports.consultarComprobantes = consultarComprobantes;

