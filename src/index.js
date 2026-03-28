const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const apiRoute = require('./ruta/index');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { ERROR } = require('sqlite3');
const ejs = require('ejs');
const {getReversarTransaction} = require('./refund/reversar');
const {getConnection} = require('../src/db/gestiondb');
const {enviaCorreoComprobanteIngreso,crearHtmltoPdf,procesaEnvioVoucherEmailPEL} = require('./gen/adminfile');
//const {consutaPredioPg,insertaComprobantePg} = require('../src/db/conexion.pg');
//const {sequelize} = require('../src/db/conexion.sq.pg');
//const {Catastro} = require('./db/sq/model.sq.pg');
const {rutadocHtml} = require('../src/gen/rutasScgp');
const dbora = require('./db/conexion.oracle12c');
const poolOracle = require('./db/poolconexion');

const listaBlanca = ['https://26.123.40.168:5173','https://localhost:5173','https://192.168.0.106:5173'];
const app = express();
//cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
//Motor de vistas
app.set("view engine","ejs");
//configuraciones
app.set('port',process.env.PORT || 3100);
//Cambiar ruta base con el nombre del modulo
app.set('ruta','/apiCBD');
app.set('rutapublica','/apiCBD/public');
//Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
//Routes
app.use(app.get('ruta'),apiRoute);
//recursos esticos fijos
//app.use(app.get('rutapublica'),express.static(path.join(path.dirname(__dirname),'public')));
app.use(app.get('rutapublica'),express.static('public'));
//
app.get('/postgresql', async (req,res)=>{
   
   console.log('Hola Cesar Ramirez Avila Postgresql');
   //const registro = await consutaPredioPg('0904811015',10281); 
   //const objjson = await dbora.consultarCabLiqWebJson(13298);
   //const objjson = await dbora.consultaLiqPG(13294,'01010102','DF-01010102','01010102');
   //const reg = await insertaComprobantePg(13295,'01010102','DF-01010102','01010102');
   //console.log('deuda',JSON.stringify(registro));
   /*const pn_seccab_liq = 10012;
   const pv_session='0101010';
   const pv_idtransaccion='id_tran0101010';
   const pv_codetransaccion = 'code0101010'
   
   */
   /*let msg;
   try{
   const num_error = await dbora.updataRecaPEL(pn_seccab_liq,7770);
     msg = 'exito';
   }
   catch(e)
   {
      msg = 'fracaso'+e.toString();
   }
   console.log(msg)*/
   //console.log('catastro',registro);
   /*let catastroPQ = [];
   registro.forEach(async (cata) =>{
      const rubros = await getRubros(cata.id_predio,cata.anio,cata.secuencia);
      //console.log('rubros',rubros);
      const reg = {
            cab:cata,
            det:rubros
      };
      console.log(reg);
      catastroPQ.push(reg);
   });*/
   //console.log('Catastro',registro);
   //res.json({"data":"Procesado con Exito"});  
   //res.json(JSON.stringify(registro));
   res.send('GAD MUNICIPAL DEL CANTON YAGUACHI');
   
});
//Ruta principal
app.get("/",async (req,res)=>{
   res.send("SALUDOS. GAD MUNICIPAL DEL CANTON YAGUACHI.");
   try
   {        
      //procesaEnvioVoucherEmailPEL(null,'09090909090909',82); 
      //const connection = await getConnection();   
       //console.log('conection',connection);   
      /* const compro = [{num_comprobante:238291,reca:{}},
         {num_comprobante:238292,reca:{}},
         {num_comprobante:238293,reca:{}},
         {num_comprobante:238294,reca:{}}];    
       let OBJ01 = {correo:'cristina97_gc@hotmail.com',comprobantes:compro};
       //let OBJ01 = {correo:'maanruna@gmail.com',comprobantes:compro};
       const enviomsg = enviaCorreoComprobanteIngreso(OBJ01);*/
       //const archivo = `${rutadocHtml}\\2025052311582049.html`
       //console.log(archivo);
       //const msg1 = await crearHtmltoPdf(archivo);
       //await sequelize.authenticate();
       /*const dataCata = await Catastro.findAll({
         where:{
            numero_identificacion: '0925497075',
            estado: 'N',
         },
         order:[
            ['id_predio','ASC'],
            ['anio','ASC'],
         ],
       });
       if(dataCata.length>0){
         dataCata.forEach((catastro)=>{
            const {dataValues} = catastro;  
            console.log(dataValues);
         });
       }*/
       console.log(`Iniciado:`);
   }
   catch(e)
   {
    console.log(`ERROR: ${e.toString()}. `);
     
   }    
   //console.log(path.dirname(__dirname));
});
//refund
app.post("/reversarrefund",async (req,res)=>{
   try
   {
      const id = req.body.text;
      const transaction = {
         transaction:{id}
      };
      let resultado = await getReversarTransaction(transaction);
      console.log(resultado);
      if(resultado.error.hay)   
      {
         res.send(`Error al  reversar transaction ${resultado.error.msg}`);
      }
      else
      {
        res.redirect('/refund');
      }
  }
  catch(e)
  {
   res.send(`Error al  reversar transaction ${e.toString()}`);
  }

});
app.get("/refund",async (req,res)=>{
   res.render('page0001');
});

poolOracle.inicializaDbPoolOracle();

//servidor en protocolo http
app.listen(app.get('port'),()=>{
   console.log(`Servidor Abierto en puerto 3100`);
});


/*
const options ={
   key:fs.readFileSync('C:/datasis/portal/portalCBDb/26.123.40.168-key.pem'),
   cert:fs.readFileSync('C:/datasis/portal/portalCBDb/26.123.40.168.pem')
}
https.createServer(options,app).listen(app.get('port'),()=>{
   console.log(`Servidor Abierto en puerto 3100`);
});
*/

process.on('SIGTERM',poolOracle.cerrarDbPoolOracle);
process.on('SIGINT',poolOracle.cerrarDbPoolOracle);