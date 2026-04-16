
const path = require('node:path');
const config = require('../config/config');

const MODO_PAYMENTEZ = config.MODO_PAYMENTEZ;  // 0 -> DESARROLLO  1   -> PRODUCCION 
const TRAN_ENLACE = config.TRAN_ENLACE;
const MODO_PAYMENTEZ_FRONTEND = config.MODO_PAYMENTEZ_FRONTEND;

const correogestionbackend = config.CORREOGESTIONBACKEND;//['maanruna@hotmail.com'];
const usuarioSCGP = config.USUARIOSCGP;// 'SCGPWEB';//SCGPWEB
const passSCGP = config.PASSSCGP;//'SCGP123';//SCGP123

//const hostSCGP_DESARROLLO = 'BASE'; //SERVERWEB CBD
//const hostSCGP_PRODUCCION = 'YAGUACHI'; //PRODUCCION
//const connstring_DESARROLLO = `192.168.0.113:1521/${hostSCGP_DESARROLLO}`; //DB DESARROLLO
//const connstring_PRDUCCION = `192.168.0.101:1521/${hostSCGP_PRODUCCION}`;  //DB PRODUCCION
//const user_id_DESARROLLO = `${usuarioSCGP}/${passSCGP}@${hostSCGP_DESARROLLO}`; //QUERY_STRING DESARROLLO
//const user_id_PRODUCCION = `${usuarioSCGP}/${passSCGP}@${hostSCGP_PRODUCCION}`;  //QUERY_STRING PRODUCCION

const connstring_ORA = `${config.HOST_DB}:${config.PUERTO_DB}/${config.HOSTSCGP_SERVICENAME}`;  //DB PRODUCCION
const user_id_ORA = `${usuarioSCGP}/${passSCGP}@${config.HOSTSCGP_SERVICENAME_ORANT}`;  //QUERY_STRING PRODUCCION

const CORREOINSTITUCION = config.CORREOINSTITUCION;
const CLAVEAPLICORREOINS = config.CLAVEAPLICORREOINS;
const NOMBREINSTITUCION = config.NOMBREINSTITUCION;
const DIRECCIONINSTITUCION = config.DIRECCIONINSTITUCION;
const TELEFONOINSTITUCION = config.TELEFONOINSTITUCION;

//const credencialOra_DESARROLLO = {
//  user: usuarioSCGP,
//  password:passSCGP,
//  connectString:connstring_DESARROLLO
//};

//const credencialOra_PRODUCCION = {
//  user: usuarioSCGP,
//  password:passSCGP,
//  connectString:connstring_PRDUCCION
//};

const credencialOra_ORA = {
  user: usuarioSCGP,
  password:passSCGP,
  connectString:connstring_ORA
};

const ip_serverweb = config.TXTIPSERVERWEB;//'WEB 192.168.0.104';
// Coloca aquí tus credenciales
/*const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sgm",
  password: "123456",
  port: 5433,
});*/
//database: "CATASTRO_YAGUACHI", //desarrollo
//database: "api_core",
//const connPG_DESARROLLO = {
//  user: "gadmsy_ad",
//  host: "192.168.0.103",
//  database: "CATASTRO_YAGUACHI",
//  password: "adm1n$21.y4gu4ch1",
//  port: 5432
//};

//const connPG_PRODUCCION = {
//  user: "gadmsy_ad",
//  host: "192.168.0.103",
//  database: "CATASTRO_YAGUACHI",
//  password: "adm1n$21.y4gu4ch1",
//  port: 5432
//};

const connPG_PG = {
  user: config.PG_USER,
  host: config.PG_HOST,
  database: config.PG_DATABASE,
  password: config.PG_PASSWORD,
  port: config.PG_PORT
};

const rutapadre = config.RUTAPADRECARPETA;//'c:\\datasis\\portal\\documentos\\';
const rutalogerror   = `${config.RUTAPADRECARPETA}${config.CARPETALOG}`;//log
const rutadocHtml    = `${config.RUTAPADRECARPETA}${config.CARPETAHTML}`;//docHtml
const rutadocCompIng = `${config.RUTAPADRECARPETA}${config.CARPETACOMPING}`;//docCompIng
const rutaPdfDocElec = `${config.RUTAPADRECARPETA}${config.CARPETADOCPDF}`;//docPdf
const rutaerrorPelVC = `${config.RUTAPADRECARPETA}${config.CARPETAERRORPELVC}`;
const rutaXmlDocElec = `${config.RUTAXMLDOCELEC}`;

const getClavePaymentez_ECSERVER = () => {
  return {
            appcode: config.ECSERVER_APPCODE,
            appkey:  config.ECSERVER_APPKEY
          };

 /* if(MODO_PAYMENTEZ)//produccion
  {
    return {
            appcode: 'BOMBEROSDAULE-EC-SERVER',
            appkey:  'T5TKLH29kKpJpiZwnEMTmO65qJEtSu'
          };
  }
  else//desarrollo
  {
     return {
        appcode: 'TESTECUADORSTG-EC-SERVER',
        appkey:  '67vVmLALRrbSaQHiEer40gjb49peos'
      };
  }*/
}

const getClavePaymentez_ECCLIENT = () => {
   
  return {
            appcode: config.ECCLIENT_APPCODE,
            appkey:  config.ECCLIENT_APPKEY
          };

  /*if(MODO_PAYMENTEZ)//produccion
    {
      return {
              appcode: 'TESTECUADORSTG-EC-CLIENT',
              appkey:  'Qc8ZYnaSt1x6lKlk6Ax6Iwc5OIf7Q6'
            };
    }
    else//desarrollo
    {
       return {
          appcode: 'TESTECUADORSTG-EC-CLIENT',
          appkey:  'd4pUmVHgVpw2mJ66rWwtfWaO2bAWV6'
        };
    }*/
}


const rwrun60 = (nombrearchivo,numerocomprobante) =>{  
    //return `CMD /C START /WAIT c:\\orant\\bin\\rwrun60.exe module=c:\\datasis\\reporte\\ARE1R131802.rep userid=${user_id} DESTYPE='File' DESNAME='${nombrearchivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES P_NUM_COMPROBANTE=${numerocomprobante} P_REIMPRESION='N'`;
    //console.log('rwrun60',`CMD /C START /WAIT ${config.RWRUN60} module=${config.REPORTE_CIC} userid=${user_id_ORA} DESTYPE='File' DESNAME='${nombrearchivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES BACKGROUND=YES P_NUM_COMPROBANTE=${numerocomprobante} P_REIMPRESION='N'`)
    return `CMD /C START /WAIT ${config.RWRUN60} module=${config.REPORTE_CIC} userid=${user_id_ORA} DESTYPE='File' DESNAME='${nombrearchivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES P_NUM_COMPROBANTE=${numerocomprobante} P_REIMPRESION='N'`;
}

const creapdfdocelec = (pv_coddoc,pn_empresa,pn_no_transaccion,pv_nombre_archivo) =>{
    let docelec_rep=null;    
    if(pv_coddoc === '01' ) //FACTURA
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2110_01.rep'; }
     {docelec_rep = config.DOCELEC_REP_FACTU; }    
    else if(pv_coddoc === '04' )// NOTA CREDITO
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2310_03.rep'; }
    {docelec_rep = config.DOCELEC_REP_NCRED; }
    else if(pv_coddoc === '05' ) //NOTA DEBITO
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2410_04.rep'; }
    {docelec_rep = config.DOCELEC_REP_NDEBI; }
    else if(pv_coddoc === '06' ) //GUIA REMISION	
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2510_05.rep'; }
    {docelec_rep = config.DOCELEC_REP_GREMI; }
    else if(pv_coddoc === '07' ) //RETENCION
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2210_02.rep';}
    {docelec_rep = config.DOCELEC_REP_RETEN;}
    else if(pv_coddoc === '03' ) //LIQUIDACION DE COMPRA
    //{docelec_rep = 'S:\\ccel\\rep\\CCEL1R2910_06.rep'; }     
    {docelec_rep = config.DOCELEC_REP_LCOMP; }  
    if(docelec_rep)
    {          
        //return `CMD /C START c:\\orant\\bin\\rwrun60.exe module=${docelec_rep} userid=${user_id_cbd} DESTYPE='File' DESNAME='${pv_nombre_archivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO PN_EMPRESA=${pn_empresa} PN_NO_TRANSACCION=${pn_no_transaccion}`;
        //return `CMD /C  "net use S: /delete /y & net use S: "\\\\192.168.0.101\\sistemas ejecutables scgp" Soulreaver2011 /user:sistemas /persistent:no && c:\\orant\\bin\\rwrun60.exe module=${docelec_rep} userid=${user_id_cbd} DESTYPE='File' DESNAME='${pv_nombre_archivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES ERRFILE=C:\\datasis\\portal\\documentos\\error_oracle.txt PN_EMPRESA=${pn_empresa} PN_NO_TRANSACCION=${pn_no_transaccion} && net use S: /delete /y" `;
         return `CMD /C  "net use S: /delete /y & net use S: \\\\${config.HOST_DB}\\${config.SCGP_EJECUTABLES} Manager@ /user:Administrador /persistent:no && ${config.RWRUN60} module=${docelec_rep} userid=${user_id_ORA} DESTYPE='File' DESNAME='${pv_nombre_archivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES ERRFILE=${config.ERRFILE} PN_EMPRESA=${pn_empresa} PN_NO_TRANSACCION=${pn_no_transaccion} && net use S: /delete /y" `;
    }
    return null;    
}

const getEnlacePaymentez = () => {
  
  return TRAN_ENLACE; 
  
}

const getModoPaymentez = () => {
  
  return MODO_PAYMENTEZ_FRONTEND;  

}

const getConnPG = () => {
  
   return connPG_PG;

  /*if (MODO_PAYMENTEZ===0)
  {
   return connPG_DESARROLLO;
  }
  else
  {
    return connPG_PRODUCCION;
  }*/

}

const getCredencialOra = () => {
  
  return credencialOra_ORA;

  /*if (MODO_PAYMENTEZ===0)
  {
   return credencialOra_DESARROLLO;
  }
  else
  {
    return credencialOra_PRODUCCION;
  }*/

}

module.exports = {
    rutadocHtml,
    rutadocCompIng,
    rwrun60,
    creapdfdocelec,
    rutaXmlDocElec,
    rutaPdfDocElec,
    rutalogerror,
    correogestionbackend,
    getClavePaymentez_ECSERVER,
    getEnlacePaymentez,
    getModoPaymentez,
    ip_serverweb,
    getConnPG,
    getCredencialOra,
    rutaerrorPelVC,
    CORREOINSTITUCION,
    CLAVEAPLICORREOINS,
    NOMBREINSTITUCION,
    DIRECCIONINSTITUCION,
    TELEFONOINSTITUCION
};