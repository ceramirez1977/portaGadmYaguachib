
const MODO_PAYMENTEZ = 0;  // 0 -> DESARROLLO  1   -> PRODUCCION 
const TRAN_DESARROLLO = 'https://ccapi-stg.paymentez.com/v2/transaction/init_reference/';
const TRAN_PRODUCCION = 'https://ccapi.paymentez.com/v2/transaction/init_reference/';

const correogestionbackend = ['maanruna@hotmail.com'];
const usuarioSCGP =  'SCGPWEB';//SCGPWEB
const passSCGP = 'SCGP123';//SCGP123
const hostSCGP_DESARROLLO = 'BASE'; //SERVERWEB CBD
const hostSCGP_PRODUCCION = 'YAGUACHI'; //PRODUCCION
const connstring_DESARROLLO = `192.168.0.113:1521/${hostSCGP_DESARROLLO}`; //DB DESARROLLO
const connstring_PRDUCCION = `192.168.0.101:1521/${hostSCGP_PRODUCCION}`;  //DB PRODUCCION
const user_id_DESARROLLO = `${usuarioSCGP}/${passSCGP}@${hostSCGP_DESARROLLO}`; //QUERY_STRING DESARROLLO
const user_id_PRODUCCION = `${usuarioSCGP}/${passSCGP}@${hostSCGP_PRODUCCION}`;  //QUERY_STRING PRODUCCION

const credencialOra_DESARROLLO = {
  user: usuarioSCGP,
  password:passSCGP,
  connectString:connstring_DESARROLLO
};

const credencialOra_PRODUCCION = {
  user: usuarioSCGP,
  password:passSCGP,
  connectString:connstring_PRDUCCION
};

const ip_serverweb = 'WEB 192.168.0.104';
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
const connPG_DESARROLLO = {
  user: "gadmsy_ad",
  host: "192.168.0.103",
  database: "CATASTRO_YAGUACHI",
  password: "adm1n$21.y4gu4ch1",
  port: 5432
};

const connPG_PRODUCCION = {
  user: "gadmsy_ad",
  host: "192.168.0.103",
  database: "CATASTRO_YAGUACHI",
  password: "adm1n$21.y4gu4ch1",
  port: 5432
};

const rutapadre = 'c:\\datasis\\portal\\documentos\\';
const rutalogerror   = `${rutapadre}log`;
const rutadocHtml    = `${rutapadre}docHtml`;
const rutadocCompIng = `${rutapadre}docCompIng`;
const rutaPdfDocElec = `${rutapadre}docPdf`;
const rutaerrorPelVC = `${rutapadre}errorPelVC`;
const rutaXmlDocElec = 'S:\\cel_documentos\\docAutorizado';

const getClavePaymentez_ECSERVER = () => {
  if(MODO_PAYMENTEZ)//produccion
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
  }
}

const getClavePaymentez_ECCLIENT = () => {
    if(MODO_PAYMENTEZ)//produccion
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
    }
}

const getUserId = () => {
   
    if (MODO_PAYMENTEZ===0)
    {
      return user_id_DESARROLLO;
    }
    else
    {
      return user_id_PRODUCCION;
    }
}

const rwrun60 = (nombrearchivo,numerocomprobante) =>{  
    const user_id = getUserId();
    return `CMD /C START /WAIT c:\\orant\\bin\\rwrun60.exe module=c:\\datasis\\reporte\\ARE1R131802.rep userid=${user_id} DESTYPE='File' DESNAME='${nombrearchivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES P_NUM_COMPROBANTE=${numerocomprobante} P_REIMPRESION='N'`;
}

const creapdfdocelec = (pv_coddoc,pn_empresa,pn_no_transaccion,pv_nombre_archivo) =>{
    let docelec_rep=null;    
    if(pv_coddoc === '01' ) //FACTURA
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2110_01.rep'; }
    else if(pv_coddoc === '04' )// NOTA CREDITO
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2310_03.rep'; }
    else if(pv_coddoc === '05' ) //NOTA DEBITO
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2410_04.rep'; }
    else if(pv_coddoc === '06' ) //GUIA REMISION	
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2510_05.rep'; }
    else if(pv_coddoc === '07' ) //RETENCION
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2210_02.rep';}
    else if(pv_coddoc === '03' ) //LIQUIDACION DE COMPRA
    {docelec_rep = 'S:\\ccel\\rep\\CCEL1R2910_06.rep'; }     
    if(docelec_rep)
    {          
        //return `CMD /C START c:\\orant\\bin\\rwrun60.exe module=${docelec_rep} userid=${user_id_cbd} DESTYPE='File' DESNAME='${pv_nombre_archivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO PN_EMPRESA=${pn_empresa} PN_NO_TRANSACCION=${pn_no_transaccion}`;
        return `CMD /C  "net use S: /delete /y & net use S: "\\\\192.168.0.101\\sistemas ejecutables scgp" Soulreaver2011 /user:sistemas /persistent:no && c:\\orant\\bin\\rwrun60.exe module=${docelec_rep} userid=${user_id_cbd} DESTYPE='File' DESNAME='${pv_nombre_archivo}' desformat='PDF' PRINTJOB='NO' PARAMFORM=NO RUNDEBUG=NO BATCH=YES ERRFILE=C:\\datasis\\portal\\documentos\\error_oracle.txt PN_EMPRESA=${pn_empresa} PN_NO_TRANSACCION=${pn_no_transaccion} && net use S: /delete /y" `;
    }
    return null;    
}

const getEnlacePaymentez = () => {
  
  if (MODO_PAYMENTEZ===0)
  {
   return TRAN_DESARROLLO;
  }
  else
  {
    return TRAN_PRODUCCION;
  }
  
}

const getModoPaymentez = () => {
  
  if (MODO_PAYMENTEZ===0)
  {
   return 'en';
  }
  else
  {
    return 'prod';
  }

}

const getConnPG = () => {
  
  if (MODO_PAYMENTEZ===0)
  {
   return connPG_DESARROLLO;
  }
  else
  {
    return connPG_PRODUCCION;
  }

}

const getCredencialOra = () => {
  
  if (MODO_PAYMENTEZ===0)
  {
   return credencialOra_DESARROLLO;
  }
  else
  {
    return credencialOra_PRODUCCION;
  }

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
    rutaerrorPelVC
};