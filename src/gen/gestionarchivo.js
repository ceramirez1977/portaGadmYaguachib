const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const {rutalogerror,rutaerrorPelVC} = require('./rutasScgp');

const agregarlineaarchivo = (archivo,mensaje) => {
    const fecha = new Date();
    const msg = `${mensaje} ${fecha} ${os.EOL}`;
    
    fs.appendFile(archivo, msg)
        .catch((err) => {
            // Si falla (ej. la carpeta no existe), intentamos crear la carpeta una sola vez
            if (err.code === 'ENOENT') {
               return fs.mkdir(path.dirname(archivo), { recursive: true })
                    .then(() => fs.appendFile(archivo, msg));
            } else {
                console.error('Error crítico escribiendo log:', err);
                throw err;
            }
        })
        .catch(err => console.error('Error crítico escribiendo log:', err));

    /*
     //Este bloque funciona cuando declaro arriba const fs = require('fs')
    try
    {
        fs.appendFile(archivo,msg,(err)=>{
            if(err)
            {
                console.log('Error al escribir en archivo');
            }
            else
            {
                console.log('Escritura con exito');
            }
        })  

    }
    catch(e){
        const mensaje = `Error en [agregarlineaarchivo] al agregar texto ${mensaje} en archivo ${archivo}`;
        console.log(mensaje);
    }*/

}

const agregarLogError = (rutanombrefun,mensaje)=>{
    const msg = `${rutanombrefun} ${mensaje}`;
    const fecha = new Date();
    const archivo = `${rutalogerror}\\error_${fecha.getDate().toString().padStart(2,'0')}${(fecha.getMonth()+1).toString().padStart(2,'0')}${fecha.getFullYear()}.txt`;        
    setTimeout(()=>{
        agregarlineaarchivo(archivo,msg);
      },2000);
}

const agregarLogSucces = (rutanombrefun,mensaje)=>{
    const msg = `${rutanombrefun} ${mensaje}`;
    const fecha = new Date();
    const archivo = `${rutalogerror}\\succes_${fecha.getDate().toString().padStart(2,'0')}${(fecha.getMonth()+1).toString().padStart(2,'0')}${fecha.getFullYear()}.txt`;        
    setTimeout(()=>{
        agregarlineaarchivo(archivo,msg);
      },2000);
}

const gestionaErrorPelVC = async (idUsuario, datosCobro = null) => {
   const fecha = new Date(); 
   //Con esto solo no lo permitira en la fecha que le estoy poniendo
   //const archivo = path.join(rutaerrorPelVC, `${idUsuario}_${fecha.getDate().toString().padStart(2,'0')}${(fecha.getMonth()+1).toString().padStart(2,'0')}${fecha.getFullYear()}.json`);
   //Aqui debe solucionar el error primero 
   const archivo = path.join(rutaerrorPelVC, `${idUsuario}.json`);
   
    try {
        // Asegurar que la carpeta exista
        //await fs.mkdir(rutaerrorPelVC, { recursive: true });

        // ESCRIBIR (Cuando falla la DB)
        if (datosCobro) {
            // Guardamos el JSON completo del cobro
            await fs.writeFile(archivo, JSON.stringify(datosCobro, null, 2));
            return { status: 'guardado' };
        }

        // CONSULTAR (Para bloquear al usuario)
        try {
           await fs.access(archivo);
           return { bloqueado: true, archivo: archivo };
        } 
        catch{
           return { bloqueado: false };
        }

    } 
    catch (error) {
        agregarLogError('gestionarContingencia',`Error al crear archivo por error ne cobro en linea ${idUsuario}`);
        console.error("Error en sistema de archivos:", error); 
        return {bloqueado: false , status:'error'}       
    }

}

module.exports = {
    agregarLogError,
    agregarLogSucces,
    gestionaErrorPelVC
}