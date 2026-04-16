const { Pool } = require("pg");
const dbora = require('./conexion.oracle12c');
const {Comprobante,ComprobanteDetalle,Catastro} = require('./sq/model.sq.pg');
const {ip_serverweb,getConnPG,getCredencialOra} = require('../gen/rutasScgp');
const {fechaActualServer} = require('../gen/dataReferencial');


const credencialOra = getCredencialOra();
const connPG = getConnPG();

const pool = new Pool({
  user: connPG.user,
  host: connPG.host,
  database: connPG.database,
  password: connPG.password,
  port: connPG.port,
  max:20,
  idleTimeoutMillis: 0, // Tiempo máximo de inactividad de un cliente antes de ser cerrado
  connectionTimeoutMillis: 0, // Tiempo máximo para esperar una conexión del pool
});


async function consutaPredioPg(pv_cedula,pn_numero,connectionDbOra)
{
  
  
  let cliente;
  let liqcab;
  try
  {
     const fecha = new Date();
     const dia = fecha.getDate();
     const mes = fecha.getMonth()+1;
     const anio = fecha.getFullYear();
     const fechaliquida = `${String(dia).padStart(2,'0')}${String(mes).padStart(2,'0')}${anio}`; 
     cliente = await pool.connect();  
     const sql2 = "SELECT * FROM valoracion.get_informacion_predial_unificada($1)";
     const res = await cliente.query(sql2, [pv_cedula]);
     //console.log('entro consutaPredioPg');
     if (res.rows.length === 0) return;

     const catastroMap = new Map();
     const arrCatastro = []; // Este será el arreglo que enviaremos a liquidar
     res.rows.forEach(row => {
            // 1. Crear llave única por Catastro (Predio + Año)
            const llaveCatastro = `${row.id_predio}_${row.anio}_${row.secuencia}`;
            
            if (!catastroMap.has(llaveCatastro)) {
              // Estructura plana: Datos del predio + Datos del catastro en un solo nivel
              const nuevoCatastro = {
                  seccabliq: 0,
                  numero: pn_numero,
                  modulo: row.modulo,
                  concepto: row.concepto.substring(0,300), 
                  subconcepto: row.subconcepto.substring(0,300), 
                  id_tipo_identificacion: row.id_tipo_identificacion, 
                  numero_identificacion: row.numero_identificacion,
                  nombre_propietario: row.nombre_propietario,
                  apellido_paterno: row.apellido_paterno,
                  apellido_materno: row.apellido_materno,
                  nombres: row.nombres.substring(0,200),
                  direccion: row.subconcepto.substring(0,100),
                  observacion: row.observacion.substring(0,1000),
                  id_clase_predio: row.id_clase_predio,
                  clave_catastral: row.clave_catastral,
                  id_predio_periodo: row.id_predio_periodo,
                  id_predio: row.id_predio,
                  anio_predio: row.anio_predio,
                  anio: row.anio,
                  secuencia: row.secuencia,
                  avaluo_solar: parseFloat(row.avaluo_solar),
                  avaluo_edificacion: parseFloat(row.avaluo_edificacion),
                  avaluo_propiedad: parseFloat(row.avaluo_propiedad),
                  avaluo_imponible: parseFloat(row.avaluo_imponible),
                  avaluo_comercial: parseFloat(row.avaluo_comercial),
                  numero_tc: row.numero_tc,
                  fecha_emision: row.fecha_emision,
                  valor_exoneracion: parseFloat(row.valor_exoneracion),
                  fechaliquida: fechaliquida,
                  impuestopredial: 0,    
                  valor_nominal: 0,
                  valor_descuento: 0,
                  valor_interes: 0,
                  valor_coactiva: 0,
                  valor_abono: 0,
                  valor_mora: 0,
                  total_recibido: 0,
                  arrRubrosxcatastro: []
              };
              catastroMap.set(llaveCatastro, nuevoCatastro);
              arrCatastro.push(nuevoCatastro);
            };

            // 2. Insertar los Rubros directamente al catastro correspondiente
            const catastroActual = catastroMap.get(llaveCatastro);
            catastroActual.arrRubrosxcatastro.push({
                ID_RUBRO: row.id_rubro,
                RUBRO: row.rubro_nombre,
                VALOR_IMPUESTO: parseFloat(row.valor_impuesto),
                VALOR1: parseFloat(row.valor1),
                VALOR2: parseFloat(row.valor2)
            });

        });
        

        if (arrCatastro.length > 0) { 
          //console.log('arrCatastro',JSON.stringify(arrCatastro));       
          liqcab = await liquidacionPG(arrCatastro, connectionDbOra);        
        }
        
  }
  catch(e)
  {
   console.log('Error predios ',e.toString());
  }
  finally{
    if (cliente) {
      cliente.release(); // Devuelve el cliente al pool
    }
  }  

  return liqcab;

}


async function liquidacionPG(arrCatastroPG,connectionDbOra)
{
  //console.log('Recibe liquidacionPG ',arrPrediosPG.numero)  
  let aar_LiqCab=[];
  try
  {
      for(const cata of arrCatastroPG)
      {
         const numliq = await dbora.insertCabLiqWeb(cata);
         //console.log('liqCabCata',cata);
         //Inserto el json de la liquidacion para posterior consultarlo cuando se recaude
         try
         {
           dbora.insertCabLiqWebPGJson(cata);
         }
         catch(eICLJson)
         {
          console.log('eICLJson',eICLJson.message);
         }
         //Se inserta la liquidacion, para posterior consultarlo si se paga
         aar_LiqCab.push(cata);
      }
  }
  catch(e)
  {
   console.log('liquidacionPG',e.toString());
  }
 
  return aar_LiqCab;

}

async function insertaComprobantePg(pn_seccab_liq,pv_session,pv_idtransaccion,pv_codetransaccion,connectionDbOra)
{
  //const pn_seccab_liq = 10011;
  //const pv_session='0101010';
  //const pv_idtransaccion='id_tran0101010';
  //const pv_codetransaccion = 'code0101010';
  //consulto los datos de la liqquidacion e inserto en recaudaciones_pagoenlinea
  let idComprobantePago=-1;
  try
  {
    

    const compro = await dbora.consultaLiqPG(pn_seccab_liq,pv_session,pv_idtransaccion,pv_codetransaccion,connectionDbOra);  
    if(compro.id_comprobante === 0){
      idComprobantePago = -1;
      return idComprobantePago;
    }
    //console.log('compro',compro);
    //inserto los registro de los rubros recaudados en comprobante_detalle en postgresql
    
    const detallesMapeados = compro.detalle_rubros.map(rubro => ({
     id_rubro: rubro.ID_RUBRO,
     id_predio: compro.id_predio, // Tomado del objeto principal
     anio: compro.anio_predio,
     descripcion: rubro.RUBRO,
     valor_1: rubro.VALOR_IMPUESTO,
     valor_2: 0 // Valor por defecto según tu modelo
    }));
    

    //inserto la recaudacion en la base de postgresql tabla: comprobante
    let comprobante = await Comprobante.create({
      //numero_comprobante_pago: compro.numero_comprobante_pago,
      id_usuario: compro.id_usuario,
      id_caja : compro.id_caja,
      id_tipo_identificacion : compro.id_tipo_identificacion,
      numero_identificacion : compro.numero_identificacion,
      nombre_propietario : compro.nombre_propietario,
      id_clase_predio : compro.id_clase_predio,
      clave_catastral : compro.clave_catastral,
      id_predio_periodo : compro.id_predio_periodo,
      id_predio : compro.id_predio,
      anio_predio : compro.anio_predio,
      avaluo_solar : compro.avaluo_solar,
      avaluo_edificacion : compro.avaluo_edificacion,
      avaluo_propiedad : compro.avaluo_propiedad,
      avaluo_imponible : compro.avaluo_imponible,
      avaluo_comercial : compro.avaluo_comercial,
      numero_tc : compro.numero_tc,
      valor_nominal : compro.valor_nominal,
      valor_descuento : compro.valor_descuento,
      valor_exoneracion : compro.valor_exoneracion,
      valor_interes : compro.valor_interes,
      valor_coactiva : compro.valor_coactiva,
      valor_abono : compro.valor_abono,
      valor_mora : compro.valor_mora,
      valor_recibido_nc_o_transferencia : 0,
      valor_recibido_cheque : compro.total_recibido, // Por defecto en cheque porque no hay campo para tarjeta de credito
      total_recibido : compro.total_recibido,
      secuencia : compro.secuencia,      
      detalles:detallesMapeados
    },
    {
       // IMPORTANTE: Se indica que incluya la asociación en la creación
       include: [{
        model: ComprobanteDetalle,
        as: 'detalles'
       }]
    }); 
    
   
    //Actualizo el estado a pagado de catasto en postgresql
    const catastroUpdated = await Catastro.update(
      {
        comprobante_pago: comprobante.id_comprobante,
        fecha_pago: fechaActualServer(),
        estado: 'P',
        usuario_modificacion: credencialOra.user,
        fecha_modificacion: fechaActualServer(),
        ip_modificacion: ip_serverweb,
        valor_descuento: comprobante.valor_descuento, 
        valor_mora: comprobante.valor_mora, 
        valor_coactiva: comprobante.valor_coactiva, 
        valor_exoneracion: comprobante.valor_exoneracion 
      },
      {
        where: { 
                 id_predio:comprobante.id_predio,
                 anio:comprobante.anio_predio,
                 secuencia: comprobante.secuencia,
                 estado: 'N',
                 estado_registro: true
                }
      }
    );
    //actualizo el numero de comprobante en recaudaciones_pagoenlinea de oracle
    const numeroIdCompro = Number(comprobante.id_comprobante);
    const num_error = await dbora.updataRecaPEL(pn_seccab_liq,numeroIdCompro,pv_session,pv_idtransaccion,connectionDbOra);
    
    idComprobantePago = comprobante.id_comprobante;

  }
  catch(e)
  {
    idComprobantePago = -1;
    console.log('Error en insertaComprobantePg',e.toString());
  }

  return idComprobantePago;

} 



// Cierra el pool cuando la aplicación se detiene
process.on('SIGINT', async () => {
  console.log('Cerrando el pool de conexiones...');
  await pool.end();
  console.log('Pool de conexiones cerrado.');
  process.exit(0);
});



module.exports = {
  consutaPredioPg,
  liquidacionPG,
  insertaComprobantePg
};