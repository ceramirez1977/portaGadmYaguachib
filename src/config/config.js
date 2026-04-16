const dotenv = require('dotenv');
const path = require('path');

// Solo se configura una vez en todo el proyecto
const entorno = process.env.NODE_ENV || 'desarrollo';
//const entorno = process.env.NODE_ENV || 'produccion';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${entorno}`)
});

const correos = (process.env.CORREOGESTIONBACKEND || "").split(',').map(email => email.trim());

module.exports = {
MODO_PAYMENTEZ : parseInt(process.env.MODO_PAYMENTEZ),  // 0 -> DESARROLLO  1   -> PRODUCCION 
MODO_PAYMENTEZ_FRONTEND : process.env.MODO_PAYMENTEZ_FRONTEND,
CORREOGESTIONBACKEND : correos,  //maanruna@hotmail.com
USUARIOSCGP :  process.env.USUARIOSCGP,//PORTAL_WEB
PASSSCGP : process.env.PASSSCGP,//PORTAL_WEB
HOSTSCGP_SERVICENAME : process.env.HOSTSCGP_SERVICENAME,//HOST DB
HOST_DB : process.env.HOST_DB,//26.34.183.187 IDP DEL SERVIDOR DB
PUERTO_DB : process.env.PUERTO_DB,//1521
HOSTSCGP_SERVICENAME_ORANT : process.env.HOSTSCGP_SERVICENAME_ORANT,
RUTAPADRECARPETA : process.env.RUTAPADRECARPETA,//D:\\DATASIS\\portal\\documentos\\
CARPETALOG : process.env.CARPETALOG,//log
CARPETAHTML : process.env.CARPETAHTML,//docHtml
CARPETACOMPING : process.env.CARPETACOMPING,//docCompIng
CARPETADOCPDF : process.env.CARPETADOCPDF,//docPdf
CARPETAERRORPELVC : process.env.CARPETAERRORPELVC,
SCGP_EJECUTABLES : process.env.SCGP_EJECUTABLES,//scgp_ejecutables
ECSERVER_APPCODE : process.env.ECSERVER_APPCODE,//NUVEISTG-EC-SERVER        
ECSERVER_APPKEY : process.env.ECSERVER_APPKEY, //Kn9v6ICvoRXQozQG2rK92WtjG6l08a
ECCLIENT_APPCODE : process.env.ECCLIENT_APPCODE,//NUVEISTG-EC-CLIENT          
ECCLIENT_APPKEY : process.env.ECCLIENT_APPKEY,//rvpKAv2tc49x6YL38fvtv5jJxRRiPs
RUTA_ORANT : process.env.RUTA_ORANT,//c:\\orant\\bin\\
REPORTE_CIC : process.env.REPORTE_CIC,//D:\\DATASIS\\portal\\archivo\\ARE1R131802.rep #COMPROBANTE INGRESO A CAJA
DOCELEC_REP_FACTU : process.env.DOCELEC_REP_FACTU,//S:\\ccel\\rep\\CCEL1R2110_01.rep
DOCELEC_REP_NCRED : process.env.DOCELEC_REP_NCRED,//S:\\ccel\\rep\\CCEL1R2310_03.rep
DOCELEC_REP_NDEBI : process.env.DOCELEC_REP_NDEBI,//S:\\ccel\\rep\\CCEL1R2410_04.rep
DOCELEC_REP_GREMI : process.env.DOCELEC_REP_GREMI,//S:\\ccel\\rep\\CCEL1R2510_05.rep
DOCELEC_REP_RETEN : process.env.DOCELEC_REP_RETEN,//S:\\ccel\\rep\\CCEL1R2210_02.rep
DOCELEC_REP_LCOMP : process.env.DOCELEC_REP_LCOMP,//S:\\ccel\\rep\\CCEL1R2910_06.rep
RWRUN60 : process.env.RWRUN60,//c:\\orant\\bin\\rwrun60.exe
ERRFILE : process.env.ERRFILE,//D:\\DATASIS\\portal\\documentos\\error_oracle.txt
CARPETACELDOCUMENTO : process.env.CARPETACELDOCUMENTO,//cel_documentos,
CARPETADOCAUTORIZADO : process.env.CARPETADOCAUTORIZADO,
CORREOINSTITUCION : process.env.CORREOINSTITUCION,
CLAVEAPLICORREOINS : process.env.CLAVEAPLICORREOINS,
TRAN_ENLACE : process.env.TRAN_ENLACE,
RUTAXMLDOCELEC : process.env.RUTAXMLDOCELEC,
TXTIPSERVERWEB : process.env.TXTIPSERVERWEB,
PG_USER : process.env.PG_USER,
PG_HOST : process.env.PG_HOST,
PG_DATABASE : process.env.PG_DATABASE,
PG_PASSWORD : process.env.PG_PASSWORD,
PG_PORT : parseInt(process.env.PG_PORT),
NOMBREINSTITUCION : process.env.NOMBREINSTITUCION,
DIRECCIONINSTITUCION : process.env.DIRECCIONINSTITUCION,
TELEFONOINSTITUCION : process.env.TELEFONOINSTITUCION
}