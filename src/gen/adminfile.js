const fs = require('fs');
var path = require('path');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const {host_gmail,port_gmail,credencialesEmailEmisor,msgCorreoPagoEnLinea,msgCorreoEnviaComprobanteIngreso,msgCorreoUsuarioRegistrado,msgCorreoRecuperarUsuario,msgCorreoLogError} = require('./dataemail');
const {rwrun60,rutadocHtml,rutadocCompIng,creapdfdocelec,correogestionbackend,NOMBREINSTITUCION,DIRECCIONINSTITUCION,TELEFONOINSTITUCION} = require('./rutasScgp');
const {agregarLogError,agregarLogSucces} = require('./gestionarchivo');
const {esperarSeg} = require('./dataReferencial');

const  generaHtml = (tran,archivo,id_json,id_sesion) => 
{

  
const contenidoHTML = `<html>  &//
<head>       &//
<link rel="stylesheet" href="html_css.css"> &//
</head>      &//
<body>&//
 <div id="contenedor">&//
  <img src="logo_institucion.jpg"/>&//
  <div id="principal">&//
   <div id="logo">	   	 &//  
     <p>${NOMBREINSTITUCION}</p>&//
   </div>&//
   <div id="cabecera">&//
     <p>${DIRECCIONINSTITUCION}<br>&//
        ${TELEFONOINSTITUCION}&//
     </p>&//
     <h2>PAGO EN LINEA</h2>&//
   </div>&//
   <div id="resto">	   &//
     <p id="p1">&//
       codigo:${tran.transaccion.authorization_code}<br> &//
       Id:${tran.transaccion.id}<br>&//
       Referencia:${tran.transaccion.dev_reference}<br>&//
       Fecha:${tran.transaccion.payment_date}<br>&//
       Monto:${tran.transaccion.amount}<br>&//
       Estatus:${tran.transaccion.current_status}<br>&//
       StatusDetail:${tran.transaccion.status_detail}<br>&//
       Currier:${tran.transaccion.carrier}<br>&//
       Origen:${tran.tarjeta.origin}&//
       <p id="p2">	     &//
         Cedula/Ruc:${tran.usuario.identificacion}<br>&//
         Nombres:${tran.usuario.nombres}<br>&//
         Correo:${tran.usuario.correo}<br>     &//   
       </p> &// 
       IdJson:${id_json}<br> &//  
       IdSesion:${id_sesion}<br> &//
     </p> &//  
   </div>   &//
  </div>   &//
  </div> &//
</body>&//
</html>
                   `;
try {
        let stream = fs.createWriteStream(archivo);
        let data = String(contenidoHTML).split("&//");
        data.forEach(element => {
            stream.write(element);
        });
        stream.end();
        const fecha01 = new Date(tran.transaccion.payment_date);
        //console.log('fecha',fecha01);
        return null;
}
catch (err) {
     return err.toString();
}

return null;

};

const generarPDF = async (archivo) => 
{
  try
  {
    const filePath = archivo.replace(".html",".pdf");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(archivo, {waitUntil: 'networkidle0'});
    await page.pdf({ path: filePath, format: 'A6', printBackground: true });
    await browser.close();
  }
  catch(e)
  {
    return 'error genera pdf '+e.toString();
  }
  return null;
}

const enviaCorreo = async (opciones) => {
    const credenciales = credencialesEmailEmisor();
    //console.log('credenciales',credenciales);
    let transporte = nodemailer.createTransport({
        host: host_gmail(),
        port: port_gmail(),
        //service:'gmail',
        auth: {
            user:credenciales.user,
            pass:credenciales.pass
        },
        secureConnection: 'false',
        tls: {
            //ciphers: 'SSLv3'
            rejectUnauthorized: false
        }
    });   
   
    let mailOptions = {
        from:credenciales.user,
        to:opciones.to,
        subject:opciones.subject,
        text:opciones.text,
        attachments:opciones.attachments
    };

    let msgEnvioEmail;    
    try
    {
      const info = await transporte.sendMail(mailOptions);
      msgEnvioEmail = `CORREO enviado con exito. response: ${info.response} Opciones: ${JSON.stringify(mailOptions)}`;        
      agregarLogSucces(path.join(__filename,enviaCorreo.name),msgEnvioEmail);
    }
    catch(e)
    {
      msgEnvioEmail = `CORREO no enviado. error: ${e.toString()} Opciones: ${JSON.stringify(mailOptions)}`;        
      agregarLogError(path.join(__filename,enviaCorreo.name),msgEnvioEmail);
    }
    /*transporte.sendMail(mailOptions,(error,info)=>{
      if(error)
      {
        msgEnvioEmail = `CORREO no enviado. error: ${error} Opciones: ${JSON.stringify(mailOptions)}`;        
        agregarLogError(path.join(__filename,enviaCorreo.name),msgEnvioEmail);
      }
      else{
        msgEnvioEmail = `CORREO enviado con exito. response: ${info.response} Opciones: ${JSON.stringify(mailOptions)}`;        
        agregarLogSucces(path.join(__filename,enviaCorreo.name),msgEnvioEmail);
      }
    });   */   

    return msgEnvioEmail;
}

const enviaCorreoRegistroUsuario = async (dataCorreo) => {

  let to = dataCorreo.correo;
  let subject = `CREDENCIALES PARA ACCESO AL PORTAL WEB DEL ${NOMBREINSTITUCION}`;
  let text = msgCorreoUsuarioRegistrado(dataCorreo);
  let attachments = [];

  let opciones = {
    to,
    subject,
    text,
    attachments
  };   
  const msgcorreo = await enviaCorreo(opciones);
  
}

const enviaCorreoRecuperarUsuario = async (dataCorreo) =>{
  let to = dataCorreo.correo;
  let subject = `RECUPERAR CREDENCIALES PARA ACCESO AL PORTAL WEB DEL ${NOMBREINSTITUCION}`;
  let text = msgCorreoRecuperarUsuario(dataCorreo);
  let attachments = [];

  let opciones = {
    to,
    subject,
    text,
    attachments
  };
  
  const msgcorreo = await enviaCorreo(opciones);
  
}

const enviaCorreoPagoEnLinea = async (tran,id_json,IdSession,archivo) => {
  
  let to = tran.usuario.correo;
  let subject = `PAGO EN LINEA EN EL ${NOMBREINSTITUCION}`;
  let text = msgCorreoPagoEnLinea(tran,id_json,IdSession);
  let attachments = [{path:archivo}];

  let opciones = {
    to,
    subject,
    text,
    attachments
  };
 
  const msgcorreo = await enviaCorreo(opciones);
  console.log('msgcorreo',msgcorreo); 
}

const enviaCorreoComprobanteIngreso = async (usuario) => {
     
  let to = usuario.correo;
  let subject = `ENVIO COMPROBANTES DE INGRESO A CAJA POR ${NOMBREINSTITUCION}`;
  let text = msgCorreoEnviaComprobanteIngreso();
  const adjunto=[];
  //usuario.comprobantes.forEach((comprobante)=>{    });
  //console.log('envio correo',JSON.stringify(usuario));
  for(const comprobante of usuario.comprobantes)
  {
    //const filename = `${comprobante.num_comprobante}.pdf`;
    //const path = `${rutadocCompIng}\\CC${comprobante.num_comprobante}.pdf`   
    const filename = `${comprobante.reca.seccabliq}.pdf`;
    const path = `${rutadocCompIng}\\CC${comprobante.reca.seccabliq}.pdf`;   
    //console.log('arc adjuntos',filename,path)
    adjunto.push({filename,path});
  };
  let attachments = adjunto;

   

  let opciones = {
    to,
    subject,
    text,
    attachments
  };

  const msgcorreo = await enviaCorreo(opciones);
  //console.log(msgcorreo);

}

const ejecutaChildProcess = async  (cadena) => {
    
    const util = require('util');
    const { exec } = require('child_process'); 
    const execPromise = util.promisify(exec);
    try
    {
      await execPromise(cadena);
      await esperarSeg(1000);  
    }
    catch(e)
    {
      //console.log('ejecutaChildProcess error ',e.toString());  
      agregarLogError(`gen/adminfile/ejecutaChildProcess`,`Bloque catch(e):  cadena: ${cadena} error: ${e.toString()}`);                   
    }

}

const crearPdfDocElec = async (pv_coddoc,pn_empresa,pn_no_transaccion,pv_nombre_archivo) =>{
  const cadena = creapdfdocelec(pv_coddoc,pn_empresa,pn_no_transaccion,pv_nombre_archivo);
  
  if(cadena)
  {
    await ejecutaChildProcess(cadena);    
  }  
}

const crearHtmltoPdf = async (archivo) => {
  try
  {
    
    const arcpdf = archivo.replace(".html",".pdf");
    const cadena = `CMD /C C:\\"Program Files"\\wkhtmltopdf\\bin\\wkhtmltopdf.exe --enable-local-file-access ${archivo} ${arcpdf}`;
    if(cadena)
    {
     await ejecutaChildProcess(cadena);    
    }

  }
  catch(e)
  {
    return '[crearHtmltoPdf] error genera pdf '+e.toString();
  }

  return null;
}

const crearComprobanteRecauda =  async (nombrearchivo,numerocomprobante) =>{
    /*const cadena =  rwrun60(nombrearchivo,numerocomprobante);
    if(cadena)
    {
      await ejecutaChildProcess(cadena);
    }*/  
    try
    {
      //console.log('crearComprobanteRecauda',nombrearchivo,numerocomprobante);
      const cadena =  rwrun60(nombrearchivo,numerocomprobante);
      await ejecutaChildProcess(cadena);      
    }
    catch(e)
    {
      agregarLogError(`gen/adminfile/crearComprobanteRecauda`,`Bloque catch(e):  Archivo: ${nombrearchivo} Comprobante: ${numerocomprobante} error: ${e.toString()}`);                   
    }  
}

const crearComprobantes= async (usuario) =>
{
  //console.log('crearComprobantes ',usuario);  
  //usuario.comprobantes.forEach( (comprobante) => {});
  for(const comprobante of usuario.comprobantes)  
  {
     //console.log('crearComprobantes comprobante',comprobante);         
     
     const archivo = `${rutadocCompIng}\\CC${comprobante.reca.seccabliq}.pdf`
     //console.log('crearComprobantes archivo',archivo);         
     await crearComprobanteRecauda(archivo,comprobante.reca.seccabliq);        
      //const archivo = `${rutadocCompIng}\\CC${comprobante.num_comprobante}.pdf` 
      //await crearComprobanteRecauda(archivo,comprobante.num_comprobante); 
      //await esperarSeg(5000);//esperemos 3 segundos para luego crearComprobanteRecauda
  }    
}

const procesaEnvioVoucherEmailPEL = async (data,nombrearchivo,id_json) =>{
  let msg=' ',msg1=' ',msg2=' ';  
  try 
   {       
      const archivo = `${rutadocHtml}\\${nombrearchivo}.html`
      msg = generaHtml(data,archivo,id_json,nombrearchivo);
      await esperarSeg(1000);
      msg1 = await crearHtmltoPdf(archivo);
      await esperarSeg(2000);//esperemos 10 segundos para luego enviar el comprobante
      msg2 = await enviaCorreoPagoEnLinea(data,id_json,nombrearchivo,archivo.replace(".html",".pdf"));  
      //codigo anterior para esperar tres segundos ante de ejecutar el codigo
      //Despues que se ha creado el pdf, espero 3 segundos para que el pdf se haya creado y enviar el correo
      //setTimeout(async ()=>{
      //const msg2 = await enviaCorreoPagoEnLinea(data,archivo.replace(".html",".pdf"));  
      //},2000);
            
    } 
    catch (err) {
      agregarLogError(path.join(__filename,procesaEnvioVoucherEmailPEL.name),`Procesa Pago en Linea error: ${err} Cadena: ${msg} Cadena 1: ${msg1} Cadena 2: ${msg2}`);        
      console.error('Error al procesaEnvioVoucherEmailPEL'+err);
    }
}

const enviaCorreoLogError = async (mensaje) =>{
 
  const text = msgCorreoLogError(mensaje);
  
  //correogestionbackend.forEach((correodestino)=>{})
  for(const correodestino of correogestionbackend)
  {
    const opciones = {
      to:correodestino,
      subject:'REVISAR ERROR EN EL SERVIDOR WEB',
      text:text,
      attachments:[]
    };   
    await esperarSeg(1000);//se espera 3 seg y luego se ejecuta enviacorreo
    const msgcorreo = await enviaCorreo(opciones);
    //condigo anterior para esperar 3 seg antes de ejecutar el procedimiento enviacorreo
    //setTimeout(()=>{
    //  const msgcorreo = enviaCorreo(opciones);
    //},3000);
  } 
  
}

module.exports = {
    enviaCorreo,
    procesaEnvioVoucherEmailPEL,    
    crearComprobantes,
    enviaCorreoComprobanteIngreso,
    enviaCorreoRegistroUsuario,
    enviaCorreoRecuperarUsuario,
    crearPdfDocElec,
    enviaCorreoLogError,
    crearComprobanteRecauda,
    generarPDF,
    crearHtmltoPdf
}