const result_getRegAutenticacion = (row) =>{
    return {
        tipoidentificacion:row[1],
        identificacion:row[2],
        nombres:row[3],
        celular:row[4],
        direccion:row[5],
        correo:row[6],
        usuario:row[7],
        clave:row[8]
       };
}



module.exports = {
    result_getRegAutenticacion
}