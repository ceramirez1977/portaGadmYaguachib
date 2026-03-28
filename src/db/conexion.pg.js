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
  let sql = ` SELECT DISTINCT 
  CASE a.id_clase_predio 
      WHEN 1 THEN 'AUR'  
      WHEN 2 THEN 'ARU'
      ELSE '' END modulo,
  a.id_clase_predio,
  a.id_predio,
  a.anio anio_ingreso,
  b.codigo_vigente, 
  COALESCE(a.calle_principal, '') calle_principal,
  COALESCE(a.direccion_numero, '') direccion_numero,
  COALESCE(a.calle_secundaria, '') calle_secundaria,
  d.id_tipo_identificacion,
  COALESCE(d.numero_identificacion, '') numero_identificacion,
  COALESCE(d.apellido_paterno, '') apellido_paterno,
  COALESCE(d.apellido_materno, '') apellido_materno,
  COALESCE(d.primer_nombre, '') primer_nombre,
  COALESCE(d.segundo_nombre, '') segundo_nombre,
  CASE d.nombre_completo WHEN NULL THEN d.razon_social ELSE d.nombre_completo END  nombres
FROM catastro.predio a,catastro.predio_codificacion b,catastro.predio_propietario c,ciudadano.ciudadano d
WHERE d.numero_identificacion = '${pv_cedula}'  AND
      a.estado          = 1 and
      a.estado_registro = true and 
      a.id_predio    = b.id_predio AND
      a.anio         = b.anio AND
      a.id_predio    = c.id_predio AND
      c.id_ciudadano = d.id_ciudadano`;
  
  let cliente;
  let arrjPredioPG=[];
  let liqcab;
  try
  {
     
    cliente = await pool.connect();  
    const resultados = await cliente.query(sql);
    for(const reg of resultados.rows)
    {  
        let objPredio = {
          numero: pn_numero,
          modulo: reg.modulo,
          id_clase_predio: reg.id_clase_predio, 
          id_predio: Number(reg.id_predio), 
          anio_ingreso: parseInt(reg.anio_ingreso),
          codigo_vigente: reg.codigo_vigente,
          calle_principal: reg.calle_principal, 
          direccion_numero: reg.direccion_numero, 
          calle_secundaria: reg.calle_secundaria,
          id_tipo_identificacion: Number(reg.id_tipo_identificacion),
          numero_identificacion: reg.numero_identificacion,
          apellido_paterno: reg.apellido_paterno, 
          apellido_materno: reg.apellido_materno,
          primer_nombre: reg.primer_nombre,
          segundo_nombre: reg.segundo_nombre, 
          nombres: reg.nombres,
          arrCatastro:[]
        }; 
        
        const arrCatastro = await consultaCatastroPg(Number(reg.id_predio))
        objPredio.arrCatastro = arrCatastro;
        arrjPredioPG.push(objPredio);
        //console.log('predio',objPredio);
    }
    console.log('Envio consutaPredioPg ',pn_numero)
    liqcab = await liquidacionPG(arrjPredioPG,pn_numero,connectionDbOra);
    //dataRows = (resultados.rows.length>0) ?  resultados.rows:[];
     //
    //if(dataRows.length>0)
    //{
     // for(const reg of dataRows){
        //console.log('reg',reg)
       //Codigo cuanso se insertaba en la base de datos
       /*for(const reg of resultados.rows)
       {  
        let vn_sec_reg_predio = await dbora.insertaPredioPg(reg,connectionDbOra);
        let vn_concata = await consultaCatastroPg(Number(reg.id_predio),vn_sec_reg_predio,connectionDbOra)
        console.log('sec_cab',vn_sec_reg_predio);
       }*/
      /* // ESTE CODIGO NO ESPERA QUE SE HAGA LA CONSULTA DE LA BASE DE DATOS, EL BUCLE TERMINA
         // PRIMERO ANTES QUE SE EJECUTE LAS CONSULTAS A LA DB
       await dataRows.forEach(async (reg) =>{
         //console.log(reg);
         let vn_sec_reg_predio = await dbora.insertaPredioPg(reg);
         let vn_concata = await consultaCatastroPg(Number(reg.id_predio),vn_sec_reg_predio)
         console.log('sec_cab',vn_sec_reg_predio);
       });
      */
    //}

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

  return liqcab;//arrjPredioPG;

}

async function consultaCatastroPg(pn_id_predio)
{
  let sql = `select a.id_predio,
  a.anio,
  a.secuencia,
  COALESCE(a.avaluo_solar,0) avaluo_solar,
  COALESCE(a.avaluo_edificacion,0) avaluo_edificacion,
  COALESCE(a.avaluo_propiedad,0) avaluo_propiedad,
  COALESCE(a.avaluo_imponible,0) avaluo_imponible,
  COALESCE(a.avaluo_comercial,0) avaluo_comercial,
  COALESCE(a.avaluo_edifica_sin_adicion,0) avaluo_edifica_sin_adicion,
  COALESCE(a.area_solar_grafica,0) area_solar_grafica,
  to_char(a.fecha_emision,'ddmmyyyy') fecha_emision,
  COALESCE(a.area_construccion,0) area_construccion,
  COALESCE(a.valor_exoneracion,0) valor_exoneracion,
  a.numero_tc
  from valoracion.catastro a
  where a.id_predio = '${pn_id_predio}' 
  and a.estado          = 'N' 
  and a.estado_registro = true `;
  //PK (ID_PREDIO,ANIO,SECUENCIA)
    let cliente; 
    let arrCatastro=[];   
    try
    {

        cliente = await pool.connect();  
        const resultados = await cliente.query(sql);
        for(const cata of resultados.rows)
        {
          let objCatastro = {
            id_predio: Number(cata.id_predio),
            anio: parseInt(cata.anio),
            secuencia: cata.secuencia,
            avaluo_solar: Number(cata.avaluo_solar),
            avaluo_edificacion: Number(cata.avaluo_edificacion),
            avaluo_propiedad: Number(cata.avaluo_propiedad),
            avaluo_imponible: Number(cata.avaluo_imponible), 
            avaluo_comercial: Number(cata.avaluo_comercial), 
            avaluo_edifica_sin_adicion: Number(cata.avaluo_edifica_sin_adicion),
            area_solar_grafica: Number(cata.area_solar_grafica),
            fecha_emision: cata.fecha_emision,
            area_construccion: Number(cata.area_construccion),
            valor_exoneracion: Number(cata.valor_exoneracion),
            numero_tc: cata.numero_tc,
            arrRubrosxcatastro:[]
            };  
           const arrRXC = await consultaRubrosPg(pn_id_predio,parseInt(cata.anio),cata.secuencia);            
           objCatastro.arrRubrosxcatastro = arrRXC;
           arrCatastro.push(objCatastro);
        }
        //const dataRows = (resultados.rows.length>0) ?  resultados.rows:[];
        //if(dataRows.length>0)
        //{
          //for(const cata of dataRows)
          //resultados.rows devuelve el array con los objetos, si la consulta no tiene datos devuelve un [], y no se ejecuta el codigo
          //Codigo cuando se inertaba en Oracle
          /*for(const cata of resultados.rows)
          {
            //console.log('cata',cata);
            let vn_secreg_cata = await dbora.insertaCatastroPg(pn_sec_reg,cata,connectionDbOra);
            let vn_numconrbcata = await consultaRubrosPg(pn_id_predio,parseInt(cata.anio),cata.secuencia,vn_secreg_cata,connectionDbOra);            
          }*/
          /* // ESTE CODIGO NO ESPERA QUE SE HAGA LA CONSULTA DE LA BASE DE DATOS, EL BUCLE TERMINA
             // PRIMERO ANTES QUE SE EJECUTE LAS CONSULTAS A LA DB
          await dataRows.forEach(async (cata) =>{
           let vn_secreg_cata = await dbora.insertaCatastroPg(pn_sec_reg,cata);
           let vn_numconrbcata = await consultaRubrosPg(pn_id_predio,parseInt(cata.anio),cata.secuencia,vn_secreg_cata);
          });
          */
        //}

    }
    catch(e)
    {
      console.log(`Error al consultar CATASTRO${e.toString()}`);
    }
    finally{
      if (cliente) {
        cliente.release(); // Devuelve el cliente al pool
      }
    } 

    return arrCatastro;
}

async function consultaRubrosPg(pn_id_predio,pn_anio,pn_secuenciapg){
 
  let sql = `SELECT cr.id_rubro,
                   r.descripcion rubro,
                   coalesce(cr.valor1,0)+coalesce(cr.valor2,0) valor_impuesto,
                   coalesce(cr.valor1,0) valor1,
                   coalesce(cr.valor2,0) valor2 
            FROM valoracion.catastro_rubro cr,valoracion.rubro r
            WHERE cr.id_predio = ${pn_id_predio}
            and   cr.anio      = ${pn_anio}
            and   cr.secuencia = ${pn_secuenciapg}
            and   cr.estado_registro = true
            and   cr.id_rubro  = r.id_rubro
            ORDER BY cr.id_rubro`;
            //PK (ID_PREDIO,ANIO,SECUENCIA, ID_RUBRO)
  let cliente;     
  let aarRXC=[];
     try
     {
        
        cliente = await pool.connect();  
        const resultados = await cliente.query(sql);
        for(const rubrosxcata of resultados.rows)
        {
          const objRXC = {
            id_rubro: rubrosxcata.id_rubro,
            rubro: rubrosxcata.rubro, 
            valor_impuesto: Number(rubrosxcata.valor_impuesto),
            valor1: Number(rubrosxcata.valor1),
            valor2: Number(rubrosxcata.valor2)
          };
          aarRXC.push(objRXC);
        }
        //const dataRows = (resultados.rows.length>0) ?  resultados.rows:[];
        //if(dataRows.length>0)
        //{
          //for(const rubrosxcata of dataRows)
          //codigo cuando se insertaba en oracle
          /*for(const rubrosxcata of resultados.rows)
          {
            //console.log('rubrosxcata',rubrosxcata);
            let vn_secreg_cata = await dbora.insertaRubXCataPg(pn_id_predio,pn_anio,pn_secuenciapg,pn_sec_cab,rubrosxcata,connectionDbOra);            
          }*/
          /* // ESTE CODIGO NO ESPERA QUE SE HAGA LA CONSULTA DE LA BASE DE DATOS, EL BUCLE TERMINA
             // PRIMERO ANTES QUE SE EJECUTE LAS CONSULTAS A LA DB
          dataRows.forEach(async (rubrosxcata) =>{
           let vn_secreg_cata = await dbora.insertaRubXCataPg(pn_id_predio,pn_anio,pn_secuenciapg,pn_sec_cab,rubrosxcata);
           //console.log('RUBROSXCATASTRO',rubrosxcata);
          });
          */
        //}

     }
     catch(e)
     {
      console.log(`Error al consultar RUBROS catastro${e.toString()}`);
     } 
     finally{
      if (cliente) {
        cliente.release(); // Devuelve el cliente al pool
      }
    }
     
    return aarRXC;

}

async function liquidacionPG(arrPrediosPG,pn_numero,connectionDbOra)
{
  console.log('Recibe liquidacionPG ',arrPrediosPG.numero)
  const fecha = new Date();
  const dia = fecha.getDate();
  const mes = fecha.getMonth()+1;
  const anio = fecha.getFullYear();
  const fechaliquida = `${String(dia).padStart(2,'0')}${String(mes).padStart(2,'0')}${anio}`;
  let aar_LiqCab=[];
  try
  {
    for(const reg of arrPrediosPG)
    {
      const id_predio_periodo = (reg.id_clase_predio===1)?2:5;
      const { arrCatastro } = reg;
      for(const cata of arrCatastro)
      {
        const { arrRubrosxcatastro } = cata;
        let valornominal=0;
        let impuestopredial=0;
        for(const rubcat of arrRubrosxcatastro)
        {
          
          if(rubcat.id_rubro === 1 || rubcat.id_rubro === 16)
          {
            impuestopredial = rubcat.valor_impuesto;
          }
          valornominal = valornominal + rubcat.valor_impuesto;
        }
        const vn_imppre = impuestopredial - cata.valor_exoneracion; 
        const vn_valnom = valornominal - cata.valor_exoneracion;
        if(vn_valnom>0)
        {
            let vv_concepto = `CODIGO PG: ${reg.id_predio} COD.CATASTRAL: ${reg.codigo_vigente}`;        
                vv_concepto = vv_concepto.substring(0,300);
            let vv_subconcepto = `${reg.calle_principal}${reg.direccion_numero}${reg.calle_secundaria}`;
                vv_subconcepto = vv_subconcepto.substring(0,300);
            let vv_nombres = `${reg.primer_nombre} ${reg.segundo_nombre}`;
                vv_nombres = vv_nombres.substring(0,200);
            const vv_direccion = vv_subconcepto.substring(0,100);
            let vv_observacion = `CODIGO PG # ${reg.id_predio} COD.CATASTRAL: ${reg.codigo_vigente} AVALUO CATASTRAL: ${cata.avaluo_propiedad} `;
                vv_observacion = vv_observacion.substring(0,1000);
            
            
            const liqCabCata = {
                seccabliq: 0,
                numero: pn_numero,
                modulo: reg.modulo,
                concepto: vv_concepto,
                subconcepto: vv_subconcepto,
                id_tipo_identificacion : reg.id_tipo_identificacion,
                numero_identificacion : reg.numero_identificacion,
                nombre_propietario : reg.nombres,
                apellido_paterno: reg.apellido_paterno, 
                apellido_materno: reg.apellido_materno,
                nombres: vv_nombres,
                direccion: vv_direccion,
                observacion: vv_observacion,
                id_clase_predio: reg.id_clase_predio,
                clave_catastral: reg.codigo_vigente,
                id_predio_periodo: id_predio_periodo,
                id_predio : reg.id_predio,
                anio_predio : reg.anio_ingreso,
                anio: cata.anio,            
                secuencia: cata.secuencia,            
                avaluo_solar: cata.avaluo_solar,
                avaluo_edificacion: cata.avaluo_edificacion,
                avaluo_propiedad: cata.avaluo_propiedad,
                avaluo_imponible: cata.avaluo_imponible,
                avaluo_comercial: cata.avaluo_comercial,
                numero_tc: cata.numero_tc,            
                impuestopredial: vn_imppre,    
                valor_nominal: vn_valnom,
                valor_exoneracion: cata.valor_exoneracion,
                fechaliquida: fechaliquida,
                valor_descuento: 0,
                valor_interes: 0,
                valor_coactiva: 0,
                valor_abono: 0,
                valor_mora: 0,
                total_recibido: 0,
                arrRXC:[]
            };
            //genero el descuento o interes, mora, coactiva
            await dbora.getIntMorDesc(liqCabCata);//,connectionDbOra);
            //Asigino el valor nominal y impuesto predial real, para considerar la exoneracion
            liqCabCata.valor_nominal = valornominal;
            liqCabCata.impuestopredial = impuestopredial;
            //asigno los rubros de impuestos a la liquidacion cab
            liqCabCata.arrRXC = arrRubrosxcatastro;
            //Inserto CabLiquidacion
            //console.log('Envio liquidacionPG ',liqCabCata.numero);
            const numliq = await dbora.insertCabLiqWeb(liqCabCata);
            liqCabCata.seccabliq = numliq;
            //console.log('liquidacionPG: Recibe  ',numliq);
            if(liqCabCata.seccabliq ===0 || liqCabCata.seccabliq === -1)
            {
              console.log('Error en secuencia',liqCabCata.seccabliq);
              return [];
            }
            //console.log('liquidacionPG seccabliq',liqCabCata.seccabliq);
            //Inserto DetLiquidacion
            //Rubros de impuestos
            for(const rcat of arrRubrosxcatastro)
            {
              const objxRubro = {
                idrubro: rcat.id_rubro,
                valor: rcat.valor_impuesto,
                seccabliq: liqCabCata.seccabliq
              };
              await dbora.insertDetLiqWeb(objxRubro);
            }
            //Interes, descuento, mora, coactiva
            let objRubro = {
              idrubro: 0,
              valor: 0,
              seccabliq: liqCabCata.seccabliq
            };
            objRubro.idrubro =  1000;//interes
            objRubro.valor = liqCabCata.valor_interes;
            if(liqCabCata.valor_interes>0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            objRubro.idrubro =  1001;//mora
            objRubro.valor = liqCabCata.valor_mora;
            if(liqCabCata.valor_mora>0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            objRubro.idrubro =  1002;//coactiva
            objRubro.valor = liqCabCata.valor_coactiva;
            if(liqCabCata.valor_coactiva>0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            objRubro.idrubro =  1003;//descuento
            objRubro.valor = liqCabCata.valor_descuento;
            if(liqCabCata.valor_descuento!=0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            objRubro.idrubro =  1007;//exoneracion
            objRubro.valor = liqCabCata.valor_exoneracion;
            if(liqCabCata.valor_exoneracion>0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            objRubro.idrubro =  1004;//total de la liquidacion
            objRubro.valor = liqCabCata.total_recibido;
            if(liqCabCata.total_recibido>0)
            {
            await dbora.insertDetLiqWeb(objRubro);
            }
            //Inserto el json de la liquidacion para posterior consultarlo cuando se recaude
            await dbora.insertCabLiqWebPGJson(liqCabCata);
            //agrego la liquidacio al arreglo
            //console.log('liqCabCata',liqCabCata);
            aar_LiqCab.push(liqCabCata);
        }
      }
    }

  }
  catch(e)
  {
   console.log('liquidacionPG',e.toString());
  }
 
  //console.log('aar_LiqCab',aar_LiqCab,'arrPrediosPG',arrPrediosPG)

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
    console.log('compro',compro);
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
      secuencia : compro.secuencia
    }); 
    
    //inserto los registro de los rubros recaudados en comprobante_detalle en postgresql
    const {detalle_rubros} = compro;
    for(const rubro of detalle_rubros){
        const comprodet = await ComprobanteDetalle.create({
        id_comprobante: comprobante.id_comprobante,// int8 NOT NULL,
        id_rubro: rubro.id_rubro,
        id_predio : comprobante.id_predio,
        anio: comprobante.anio_predio,
        descripcion: rubro.rubro,
        valor_1:rubro.valor_impuesto
      });
    }
    /*  //EL FOREACH TERMINA DE EJECUTARSE PRIMERO Y NO ESPERA EL AWAIT DE LA INSERCION DEL COMPROBANTE
    detalle_rubros.forEach(async (rubro)=>{
        const comprodet = await ComprobanteDetalle.create({
        id_comprobante: comprobante.id_comprobante,// int8 NOT NULL,
        id_rubro: rubro.codigo_rubro,
        id_predio : comprobante.id_predio,
        anio: comprobante.anio_predio,
        descripcion: rubro.desc_rubro,
        valor_1:rubro.valor
      });
    });
    */
    
    const {id_comprobante}= comprobante;
    const comprobanteupd = {...comprobante,detalle_rubros:compro.detalle_rubros};  
    //actualizo el json con los datos faltantes
    const comprobanteUpdated = await Comprobante.update(
      {
        json_impreso: JSON.stringify(comprobanteupd)
      },
      {
        where: { id_comprobante }
      }
    );
    //Actualizo el estado a pagado de catasto en postgresql
    const catastroUpdated = await Catastro.update(
      {
        comprobante_pago: id_comprobante,
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
    const numeroIdCompro = Number(id_comprobante);
    const num_error = await dbora.updataRecaPEL(pn_seccab_liq,numeroIdCompro,pv_session,pv_idtransaccion,connectionDbOra);
    
    idComprobantePago = id_comprobante;

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