const {rutalogerror} = require('./rutasScgp');

const host_gmail = () => {return 'smtp.gmail.com'};

const port_gmail = () => {return '587'};

const credencialesEmailEmisor = () =>{

    return  {
        user:'facturaciongadyaguachi@gmail.com',
        pass:'lvlkogbtdnvalxps'
    };

}

const msgCorreoPagoEnLinea = (tran,id_json,IdSession) =>{

    let msg = `
Saludos Cordiales.

Usted, ha hecho un pago en linea por valores mantenidos en el GAD MUNICIPAL DEL CANTON YAGUACHI.
Por lo cual, se le comunica la transacción que ha sido generada con exito.

Información detallada:

transacción:
authorization_code:${tran.transaccion.authorization_code}
Id:${tran.transaccion.id}
Referencia:${tran.transaccion.dev_reference}
Fecha:${tran.transaccion.payment_date}
Monto:${tran.transaccion.amount}
Estatus:${tran.transaccion.current_status}
Currier:${tran.transaccion.carrier}
Origen:${tran.tarjeta.origin}

Contribuyente:
Cedula/Ruc:${tran.usuario.identificacion}
Nombres:${tran.usuario.nombres}
Correo:${tran.usuario.correo}    

IdJson:${id_json}
IdSesion:${IdSession}
    `;

    return msg;
}

const msgCorreoEnviaComprobanteIngreso = () =>{
    let msg = `
Saludos Cordiales.

EL GAD MUNICIPAL DEL CANTON YAGUACHI le agradece por sus pagos. 
Por lo cual, se le envia el(los) comprobante(s) de ingreso a caja.

ATTE.
GAD MUNICIPAL DEL CANTON YAGUACHI
     `;

     return msg;
}

const msgCorreoUsuarioRegistrado = (dataCorreo) =>{
    let msg = `
Saludos Cordiales,

Estimado ${dataCorreo.nombres} con identificación ${dataCorreo.identificacion}, le hacemos llegar las credenciales de acceso para poder usar el portal web del GAD MUNICIPAL DEL CANTON YAGUACHI. 
Las cuales son: 
                Usuario: ${dataCorreo.usuario} 
                Clave: ${dataCorreo.clave}
Cabe indicarle que el usuario y clave las puede cambiar en la opcion Administrar del portal web.

ATTE.
GAD MUNICIPAL DEL CANTON YAGUACHI
     `;

     return msg;
}

const msgCorreoRecuperarUsuario = (usuario) =>{
    let msg = `
Saludos Cordiales,

Estimado ${usuario.nombres} con identificación ${usuario.identificacion}, le hacemos llegar las credenciales de acceso para poder usar el portal web del GAD MUNICIPAL DEL CANTON YAGUACHI. 
Las cuales son: 
                Usuario: ${usuario.usuario} 
                Clave: ${usuario.clave}
Cabe indicarle que el usuario y clave las puede cambiar en la opcion Administrar del portal web.

ATTE.
GAD MUNICIPAL DEL CANTON YAGUACHI
     `;

     return msg;
}

const msgCorreoLogError = (mensaje) => {
    let msg = `
     Saludos Cordiales,

     Ha ocurrido un error en el servidor web ${mensaje}. 
     Por favor, revisar el archivo log errores en la ruta ${rutalogerror}.

      ATTE.
      GAD MUNICIPAL DEL CANTON YAGUACHI
     `;

     return msg;
}

module.exports = {
    host_gmail,
    port_gmail,
    credencialesEmailEmisor,
    msgCorreoPagoEnLinea,
    msgCorreoEnviaComprobanteIngreso,
    msgCorreoUsuarioRegistrado,
    msgCorreoRecuperarUsuario,
    msgCorreoLogError
}