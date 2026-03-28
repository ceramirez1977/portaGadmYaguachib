const {getCredencialOra} = require('../gen/rutasScgp');
const oracledb = require('oracledb');
oracledb.initOracleClient();

const credencial = getCredencialOra();

async function inicializaDbPoolOracle(){
    
  try
    {
      
      await oracledb.createPool({
        user: credencial.user,
        password: credencial.password,
        connectionString: credencial.connectString,
        poolMin: 8,        // Conexiones mínimas siempre abiertas
        poolMax: 35,       // Máximo de conexiones simultáneas
        poolIncrement: 5,  // Cuántas abrir si el pool se llena
        poolTimeout: 45,  // Segundos para liberar conexiones inactivas
        queueMax: 150,          // Mayor capacidad de espera en ráfagas
        queueTimeout: 6000      // 6 segundos de espera máxima
      });
      console.log('Creado Pool de conexiones Oracle');
    }
    catch(e)
    {
      console.error('Error al crear pool Oracle ',e);
      process.exit(1);//Si no hay coneccion a Db, la app no debe arrancar
    }
    
}

async function cerrarDbPoolOracle(){
    try{
        await oracledb.getPool().close(10);
        console.log('Pool Oracle cerrado');
    }
    catch(e)
    {
        console.error('Error al cerrar el Pool de Oracle');
    }
}


exports.inicializaDbPoolOracle = inicializaDbPoolOracle;
exports.cerrarDbPoolOracle = cerrarDbPoolOracle;

