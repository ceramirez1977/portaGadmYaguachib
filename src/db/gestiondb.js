const {getCredencialOra} = require('../gen/rutasScgp');
const {agregarLogError} = require('../gen/gestionarchivo');
const objoracle = require('oracledb');
objoracle.initOracleClient();

const credencial = getCredencialOra();

const error_db = [
    {
      codigo:'NJS-503',
      descripcion:'Error: NJS-116: password verifier type 0x939 is not supported by node-oracledb in Thin mode'
    },
    {
      codigo:'Error: NJS-116',
      descripcion:': password verifier type 0x939 is not supported by node-oracledb in Thin mode'
    }
  ];

  
const getConnection = async () => {
    
    let connection;
    try
    {
        connection = await objoracle.getConnection();                
        console.log('conexion abierta');
        return connection;
    }
    catch(e){
        agregarLogError(`getConnection: ${e.toString()} Error name ${e.name} Error mensaje ${e.message} Error Stack ${e.stack}`);  
        throw new Error(`Inconveniente al accesar a la DB. Error name ${e.name} Error mensaje ${e.message} `);
    }

}

const getCloseConnection =  async (connection)=>{
    
    try
    {
       if(connection)
       {
        await connection.close();
       }        
    }
    catch(e)
    {    
        console.log('Error al cerrar o liberar conexion Oracle',e);   
    }  

}

const getPropiedadPlsql = (dir,val,type,maxSize) =>{
    let obj = {
        dir,
        val,
        type
    };
    try
    {
      if(maxSize)
      {
        return {...obj,maxSize};
      }
      return obj;
    }
    catch(e)
    {
        agregarLogError(`getPropiedadPlsql: ${e.toString()}`);  
        return null;
    }
}

const getBindVariable = (name,value,objPara) => {
    
    try
    {
      return {...objPara,
        [name]:value
      };
    }
    catch(e)
    {
        agregarLogError(`getBindVariable: ${e.toString()}`);  
        return null;
    }
}

const getDirDb = (dir) =>{
    const tipodir = {
        'IN'   :objoracle.BIND_IN,
        'INOUT':objoracle.BIND_INOUT,
        'OUT'  :objoracle.BIND_OUT
       };    
    try
    {
        return tipodir[dir];
    }
    catch(e)
    {
        agregarLogError(`getDirDb: ${e.toString()}`);  
        return null;
    }

}

const getTypeDb = (td) =>{
    const tipodato = {
        'NUMBER'  : objoracle.NUMBER,
        'VARCHAR2': objoracle.STRING,
        'DATE'    : objoracle.DATE,        
        'CURSOR'  : objoracle.CURSOR
    };
   try
   {
      return tipodato[td];
   }
   catch(e)
   {
       agregarLogError(`getTypeDb: ${e.toString()}`);  
      return null;
   }

}

const getobjetodb = (nombre,tipodml,columnas) =>{
   return {nombre,tipodml,columnas};
}

const getdataobjetocolumna = (nombre,tipodato,valor,maxlongitud,tipodml) =>{
    return {nombre,tipodato,valor,maxlongitud,tipodml};
}

const getResultado = (token,data,error)=>{
    return {
        token,data,error
    };
}

const getErrorResultado = (hay,msg,solucion)=>{
   return {hay,msg,solucion}
}

module.exports = {
    getConnection,
    getPropiedadPlsql,
    getBindVariable,
    getDirDb,
    getTypeDb,
    getobjetodb,
    getdataobjetocolumna,
    getResultado,
    getErrorResultado,
    getCloseConnection
}