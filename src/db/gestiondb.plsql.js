const plsql_AGE_PU_AUTENTICAR_WEB = `BEGIN 
AGE_PU_AUTENTICAR_WEB(:PV_USUARIO,
                      :PV_CLAVE,  
                      :PN_ERROR,
                      :PV_MSG_ERROR,                                                                                                
                      :PC_USUARIO);
  END;`;


const plsql_INSERTA_LOGIN = `DECLARE
  CURSOR EXISTE_IDENTIFICACION_C(PV_IDEN VARCHAR2) IS
  SELECT DISTINCT 'S' FROM AGE_LOGIN WHERE IDENTIFICACION = PV_IDEN;
  ----
  CURSOR EXISTE_USUARIO_C(PV_USER VARCHAR2) IS
  SELECT DISTINCT 'S' FROM AGE_LOGIN WHERE USUARIO = PV_USER;
  -----
  VN_SECUENCIA NUMBER;
  VV_EXISTE VARCHAR2(1);
BEGIN 
  ----- verifica existencia de identificacion
  OPEN EXISTE_IDENTIFICACION_C(:PV_IDENTIFICACION);
  FETCH EXISTE_IDENTIFICACION_C INTO VV_EXISTE;
  CLOSE EXISTE_IDENTIFICACION_C;
  VV_EXISTE := NVL(VV_EXISTE,'N');
  IF VV_EXISTE='S' THEN                       
  :PN_ERROR  := 1;
  :PV_MSG_ERROR := 'Identificacion '||:PV_IDENTIFICACION||' esta registrada en el GADM DE YAGUACHI. Si sigue teniendo inconveniente con el registro por favor contactese con la institución';
   return;
  END IF;
  -------verifica existencia de usuario
  OPEN EXISTE_USUARIO_C(:PV_USUARIO);
  FETCH EXISTE_USUARIO_C INTO VV_EXISTE;
  CLOSE EXISTE_USUARIO_C;
  VV_EXISTE := NVL(VV_EXISTE,'N');
  IF VV_EXISTE='S' THEN
  :PN_ERROR  := 1; 
  :PV_MSG_ERROR := 'Debe ingresar un Usuario diferente a '||:PV_USUARIO||'.';
   return;
  END IF;
  -------registro de nuevo usuario                       
  select SEC_AGE_LOGIN.nextval INTO VN_SECUENCIA  from dual;
  INSERT INTO AGE_LOGIN(SECUENCIA, USUARIO, CLAVE, TIPO_IDENTIFICACION, IDENTIFICACION, NOMBRES, CELULAR, DIRECCION, CORREO, ESTADO)
  VALUES(VN_SECUENCIA,:PV_USUARIO,:PV_CLAVE,:PV_TIPO_IDENTIFICACION,:PV_IDENTIFICACION,:PV_NOMBRES,:PV_CELULAR,:PV_DIRECCION,:PV_CORREO,'A');
EXCEPTION
  WHEN OTHERS THEN
     rollback;
     :PN_ERROR := 1;
     :PV_MSG_ERROR := 'ERROR AL INSERTAR REGISTRO '||SQLERRM;
END;`;

const plsql_UPDATELOGIN = `DECLARE                      
CURSOR EXISTE_USUARIO_C(PV_IDEN VARCHAR2,PV_USER VARCHAR2) IS
SELECT DISTINCT 'S' FROM AGE_LOGIN WHERE IDENTIFICACION != PV_IDEN AND USUARIO = PV_USER;
-----
VN_SECUENCIA NUMBER;
VV_EXISTE VARCHAR2(1);
BEGIN                        
-------verifica existencia de usuario
OPEN EXISTE_USUARIO_C(:PV_IDENTIFICACION,:PV_USUARIO);
FETCH EXISTE_USUARIO_C INTO VV_EXISTE;
CLOSE EXISTE_USUARIO_C;
VV_EXISTE := NVL(VV_EXISTE,'N');
IF VV_EXISTE='S' THEN
 :PN_ERROR  := 1; 
 :PV_MSG_ERROR := 'Usuario digitado ya existe. Debe ingresar un Usuario diferente a '||:PV_USUARIO||'. ';
 return;
END IF;
-------actualizacion de usuario                       
UPDATE AGE_LOGIN SET USUARIO=:PV_USUARIO, CLAVE=:PV_CLAVE,  NOMBRES=:PV_NOMBRES, CELULAR=:PV_CELULAR, DIRECCION=:PV_DIRECCION, CORREO=:PV_CORREO
WHERE IDENTIFICACION = :PV_IDENTIFICACION;
                       
EXCEPTION
WHEN OTHERS THEN
   rollback;
   :PN_ERROR := 1;
   :PV_MSG_ERROR := 'ERROR AL ACTUALIZAR REGISTRO '||SQLERRM;
END;`;

const plsql_LOGOUT = `UPDATE AGE_SESSION_WEB SET ESTADO =:PV_ESTADO, FECHA_FIN=SYSDATE
WHERE ID = :PV_SESION
RETURNING id, ROWID INTO :PV_IDS, :PV_RIDS`;

const plsql_RECUPERARUSUARIOLOGIN =  `DECLARE                      
CURSOR EXISTE_USUARIO_C(PV_IDEN VARCHAR2,PV_USER VARCHAR2,PV_EMAIL VARCHAR2) IS
SELECT DISTINCT 'S' ,CLAVE,NOMBRES
FROM AGE_LOGIN 
WHERE IDENTIFICACION = PV_IDEN 
  AND USUARIO        = PV_USER
  AND CORREO         = PV_EMAIL;
-----
VV_EXISTE VARCHAR2(1);                       
BEGIN                        
-------verifica existencia de usuario                       
OPEN EXISTE_USUARIO_C(:PV_IDENTIFICACION,:PV_USUARIO,:PV_CORREO);
FETCH EXISTE_USUARIO_C INTO VV_EXISTE,:PV_CLAVE,:PV_NOMBRES;
CLOSE EXISTE_USUARIO_C;
VV_EXISTE := NVL(VV_EXISTE,'N');
IF VV_EXISTE='N' THEN
 :PN_ERROR  := 1; 
 :PV_MSG_ERROR := 'Identificacion : '||:PV_IDENTIFICACION||', Usuario: '||:PV_USUARIO||' y Correo: '||:PV_CORREO||' digitados no existen en los registros del GAD MUNICIPAL DEL CANTON SAN JACINTO DE YAGUACHI. Por favor, vuelva a digitarlos respetando mayuscula y minuscula.';
 return;
END IF;                       
                       
EXCEPTION
WHEN OTHERS THEN                          
   :PN_ERROR := 1;
   :PV_MSG_ERROR := 'ERROR AL CONSULTAR IDENTIFICACION, USUARIO Y CORREO PARA RECUPERAR CLAVE '||SQLERRM;
END;`;


const plsql_CONSULTARDEUDA = `BEGIN
ARE_PU_LIQUIDACION_WEB(:PV_CEDULA,
                       :PN_NUMERO,
                       :PV_MSG_ERROR,
                       :PC_LIQWEB);
END;`;

const plsql_RECAUDARENLINEA = `BEGIN
                      INSERT INTO ARE_PAGOENLINEA_JSON(PAGO,SESION, FECHA_INGRESO) VALUES(:PV_JSON,:PV_SESION,SYSDATE); 
                      SELECT ID INTO :PN_ID_JSON FROM ARE_PAGOENLINEA_JSON WHERE DBMS_LOB.SUBSTR(PAGO, 32767, 1)  = :PV_JSON AND SESION=:PV_SESION;                   
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PV_MSG_ERROR := 'ERROR AL INSERTAR ARE_PAGOENLINEA_JSON '||SQLERRM;
                      END;`;

const plsql_INSERTASECPROCJSON = `
                    DECLARE        
                      VN_SEC NUMBER;
                    BEGIN       
                      :PV_MSG_ERROR := ' ';
                      VN_SEC := RECAUDA.ARE_FU_PELJSON_SP(:PV_NOMBRE_PROCEDIMIENTO,:PV_DESC_PROCEDIMIENTO,:PN_ID_JSON);
                    EXCEPTION
                      WHEN OTHERS THEN
                       :PV_MSG_ERROR := 'ERROR AL INSERTAR SECUENCIA PROCESO JSON '||SQLERRM;
                    END;`;

const plsql_INSERTAERROR_PEL = `
                      DECLARE
                        VN_SEC NUMBER;
                      BEGIN
                            VN_SEC := RECAUDA.ARE_FU_ERROR_PEL(:PV_DESCRIPCION1,:PV_DESCRIPCION2);
                      EXCEPTION
                        WHEN OTHERS THEN
                           :PV_MSG_ERROR := 'ERROR AL INSERTAR ARE_FU_ERROR_PEL '||SQLERRM;
                      END;`;

const plsql_RECAUDARENLINEA_02 = ` BEGIN
       ARE_PU_RECAUDAPAGOENLINEA(:PN_SECCABLIQ,
                                 :PV_SESION,
                                 :PV_ID_TRANSACCION,
                                 :PV_CODE_TRANSACCION,
                                 :PN_NUM_COMPROBANTE,
                                 :PV_MSG_ERROR);
     END;
    `;   

const plsql_CONSULTARFACTURAS = `SELECT A.EMPRESA,A.NO_TRANSACCION,A.CODDOC,B.NOMBRE,A.ESTAB||'-'||A.PTOEMI||'-'||A.SECUENCIA SECUENCIA_DOCELE,A.FECHA_EMISION,A.CLAVEACCESO,A.FECHA_AUTORIZACION_SRI,A.ARCHIVO_FISICO_XML,A.COMP_DESDE,A.FECHA_INGRESO
    FROM CCEL_TRANSACCION A,CCEL_TIPO_COMPROBANTE B 
    WHERE A.IDENTIFICACIONCOMPRADOR = :PV_CEDULA AND
       A.CODDOC = B.CODIGO AND
       A.ESTADO = 7
    ORDER BY TO_DATE(A.FECHA_EMISION,'DD/MM/YYYY') DESC,A.CODDOC,A.ESTAB,A.PTOEMI,A.SECUENCIA DESC`; 

const plsql_INSERTADEUDAPQ = ` 
    BEGIN
      PU_DEUDA_PQ(:PN_ID_PREDIO,
        :PV_CODIGO_CATASTRAL,
        :PV_NUMERO_IDENTIFICACION,
        :PV_NOMBRE_PROPIETARIO,
        :PN_ANIO,
        :PN_ID_RUBRO,
        :PV_DESCRIPCION,
        :PN_VALOR1,
        :PN_VALOR2,
        :PN_NUMERO,
        :PN_ERROR,
        :PV_MSG_ERROR);
    END;
   `;      

const plsql_INSPREDIOPQ = ` 
DECLARE
 VR_REG ARE_PREDIO_PG%ROWTYPE;
 VB_ERROR BOOLEAN;
 VV_MSG_ERROR VARCHAR2(1000);
BEGIN
  :PN_ERROR := 0;
  VR_REG.SECUENCIA        := NULL;
  VR_REG.MODULO           := :PV_MODULO;
  VR_REG.ID_CLASE_PREDIO  := :PN_ID_CLASE_PREDIO; 
  VR_REG.ID_PREDIO        := :PN_ID_PREDIO;
  VR_REG.ANIO_INGRESO     := :PN_ANIO_INGRESO;
  VR_REG.CODIGO_VIGENTE   := :PV_CODIGO_VIGENTE;
  VR_REG.CALLE_PRINCIPAL  := :PV_CALLE_PRINCIPAL;
  VR_REG.DIRECCION_NUMERO := :PV_DIRECCION_NUMERO;
  VR_REG.CALLE_SECUNDARIA := :PV_CALLE_SECUNDARIA;
  VR_REG.ID_TIPO_IDENTIFICACION := :PN_ID_TIPO_IDENTIFICACION;
  VR_REG.NUMERO_IDENTIFICACION := :PV_NUMERO_IDENTIFICACION; 
  VR_REG.APELLIDO_PATERNO := :PV_APELLIDO_PATERNO; 
  VR_REG.APELLIDO_MATERNO := :PV_APELLIDO_MATERNO; 
  VR_REG.PRIMER_NOMBRE    := :PV_PRIMER_NOMBRE; 
  VR_REG.SEGUNDO_NOMBRE   := :PV_SEGUNDO_NOMBRE; 
  VR_REG.NOMBRE_COMPLETO  := :PV_NOMBRE_COMPLETO;
  RECAUDA.PKG_ARE_PG.PU_INS_PREDIO(VR_REG,VB_ERROR,VV_MSG_ERROR);
  IF VB_ERROR THEN
   :PN_ERROR := 1;
   :PV_MSG_ERROR := VV_MSG_ERROR; 
  END IF;
  :PN_SECUENCIA := VR_REG.SECUENCIA;
  --commit;
END;    
   `; 

 const plsql_INSCATASTROPG = `
 DECLARE
  VR_REG ARE_CATASTRO_PG%ROWTYPE;
  VB_ERROR BOOLEAN;
  VV_MSG_ERROR VARCHAR2(1000);
  VD_FECHA_EMISION DATE;
 BEGIN
  :PN_ERROR := 0; 
  IF :PV_FECHA_EMISION IS NOT NULL THEN
   VD_FECHA_EMISION := TO_DATE(:PV_FECHA_EMISION,'DDMMYYYY');
  END IF;
  VR_REG.SECUENCIA := NULL;
  VR_REG.ANIO              := :PN_ANIO; 
  VR_REG.SECUENCIA_PG      := :PN_SECUENCIA_PG; 
  VR_REG.AVALUO_SOLAR      := :PN_AVALUO_SOLAR;
  VR_REG.AVALUO_EDIFICACION:= :PN_AVALUO_EDIFICACION; 
  VR_REG.AVALUO_PROPIEDAD  := :PN_AVALUO_PROPIEDAD; 
  VR_REG.AVALUO_IMPONIBLE  := :PN_AVALUO_IMPONIBLE;
  VR_REG.AVALUO_COMERCIAL  := :PN_AVALUO_COMERCIAL; 
  VR_REG.AVALUO_EDIFICA_SINADICION := :PN_AVALUO_EDIFICA_SINADICION; 
  VR_REG.AREA_SOLAR_GRAFICA := :PN_AREA_SOLAR_GRAFICA; 
  VR_REG.FECHA_EMISION      := VD_FECHA_EMISION; 
  VR_REG.AREA_CONSTRUCCION  := :PN_AREA_CONSTRUCCION;
  VR_REG.SECUENCIA_CAB      := :PN_SECUENCIA_CAB;
  VR_REG.VALOR_EXONERACION  := :PN_VALOR_EXONERACION;
  VR_REG.NUMERO_TC          := :PV_NUMERO_TC;
  RECAUDA.PKG_ARE_PG.PU_INS_CATASTRO(:PN_ID_PREDIO,VR_REG,VB_ERROR,VV_MSG_ERROR);
  IF VB_ERROR THEN
   :PN_ERROR := 1;
   :PV_MSG_ERROR := VV_MSG_ERROR; 
  END IF;
  :PN_SECUENCIA     := VR_REG.SECUENCIA;
  :PN_SECUENCIA_CAB := VR_REG.SECUENCIA_CAB;

END;
`;

const plsql_INSRUBXCATAPG = `
DECLARE
 VR_REG ARE_RUBROS_X_CATASTRO_PG%ROWTYPE;
 VB_ERROR BOOLEAN;
 VV_MSG_ERROR VARCHAR2(1000);
BEGIN


	:PN_ERROR            := 0; 
	VR_REG.SECUENCIA     := NULL; 
	VR_REG.CODIGO_RUBRO  := :PN_CODIGO_RUBRO; 
	VR_REG.DESC_RUBRO    := :PV_DESC_RUBRO;
  VR_REG.VALOR         := :PN_VALOR;	
	VR_REG.VALOR1        := :PN_VALOR1;
	VR_REG.VALOR2        := :PN_VALOR2;
  VR_REG.SECUENCIA_CAB := :PN_SECUENCIA_CAB;
	RECAUDA.PKG_ARE_PG.PU_INS_RUBROSXCATASTRO(:PN_IDPREDIO,:PN_ANIO,:PN_SECUENCIA_PG,VR_REG,VB_ERROR,VV_MSG_ERROR);
	IF VB_ERROR THEN
	   :PN_ERROR     := 1;
	   :PV_MSG_ERROR := VV_MSG_ERROR; 
	END IF;
	:PN_SECUENCIA     := VR_REG.SECUENCIA;
  :PN_SECUENCIA_CAB := VR_REG.SECUENCIA_CAB;

END;
`;

const plsql_CONSULTALIQ_PG = `
DECLARE
 VB_ERROR BOOLEAN;
BEGIN

RECAUDA.PKG_ARE_PORCOBRAR_SW.PU_CONSULTA_LIQ_PQ(:PN_SECCABLIQ,
                                                :PV_SESION,                                                              
                                                :PV_ID_TRANSACCION,
                                                :PV_CODE_TRANSACCION,
                                                :PN_ID_TIPO_IDENTIFICACION,
                                                :PV_NUMERO_IDENTIFICACION,
                                                :PV_NOMBRE_COMPLETO,
                                                :PN_ID_CLASE_PREDIO,
                                                :PN_ID_PREDIO_PERIODO,
                                                :PV_CODIGO_CATASTRAL,
                                                :PN_ID_PREDIO,
                                                :PN_ANIO,
                                                :PN_SECUENCIA_PG,
                                                :PN_AVALUO_SOLAR,
                                                :PN_AVALUO_EDIFICACION,
                                                :PN_AVALUO_PROPIEDAD,
                                                :PN_AVALUO_IMPONIBLE,
                                                :PN_AVALUO_COMERCIAL,
                                                :PV_NUMERO_TC,
                                                :PN_VALOR_NOMINAL,
                                                :PN_VALOR_DESCUENTO,
                                                :PN_VALOR_EXONERACION,
                                                :PN_VALOR_INTERES,
                                                :PN_VALOR_COACTIVA,
                                                :PN_VALOR_MORA,
                                                :PN_VALOR_ABONO,
                                                :PN_VALOR_RECIBIDO,                   
                                                VB_ERROR,
                                                :PV_MSG_ERROR,
                                                :PC_RUBROS);
  IF VB_ERROR THEN
   :PN_ERROR := 1;
  END IF;

END;
`;

const plsql_UPDATE_RECAPEL = `
DECLARE 
BEGIN
  :PN_ERROR := 0;
  UPDATE ARE_RECAUDACIONES_PAGOENLINEA SET NUM_COMPROBANTE=:PN_NUM_COMPROBANTE
  WHERE SECABLIQWEB = :PN_SECCABLIQWEB;
  --
  UPDATE ARE_CABLIQUIDACION_WEB  SET ESTADO_PAGO ='P'
  WHERE SECUENCIA = :PN_SECCABLIQWEB;
  ---
  UPDATE ARE_CABLIQWEBPG_JSON SET TRANSACTION_ID = :PV_TRANSACTION_ID, SESION = :PV_SESION
  WHERE SECUENCIA_CAB = :PN_SECCABLIQWEB;
  ---
  ----SE ACTUALIZA NUMERO DE COMPROBANTE 
  ARE_PU_AUDITORIA_PEL('ARE_RECAUDACIONES_PAGOENLINEA',:PN_SECCABLIQWEB,'ACTUALIZA EL NUMERO COMPROBANTE QUE VIENE DE PG EN ARE_RECAUDACIONES_PAGOENLINEA POR MEDIO DE SECUENCIA LIQUIDACION '||TO_CHAR(:PN_SECCABLIQWEB));
  ----SE ACTUALIZA ESTADO DE  LIQUIDACION 
  ARE_PU_AUDITORIA_PEL('ARE_CABLIQUIDACION_WEB',:PN_SECCABLIQWEB,'ACTUALIZA EL ESTADO A PAGADO EN ARE_CABLIQUIDACION_WEB '||TO_CHAR(:PN_SECCABLIQWEB));
  ----SE ACTUALIZA ID_TRANSACCION Y SESSION DE LA LIQUIDACION 
  ARE_PU_AUDITORIA_PEL('ARE_CABLIQWEBPG_JSON',:PN_SECCABLIQWEB,'ACTUALIZA ARE_CABLIQWEBPG_JSON '||TO_CHAR(:PN_SECCABLIQWEB)||' ID TRANSACCION: '||:PV_TRANSACTION_ID||' SESSION: '||:PV_SESION);
 EXCEPTION
   WHEN OTHERS THEN
    :PN_ERROR := 1;
    :PV_MSG_ERROR := SUBSTR('ERROR ACTUALIZA ARE_RECAUDACIONES_PAGOENLINEA '||SQLERRM,1,1000);
 END;
`;


const plsql_INSCABLIQWEB_PG = `
DECLARE
 VB_ERROR BOOLEAN;
BEGIN

  VB_ERROR := FALSE;
  RECAUDA.PKG_ARE_PORCOBRAR_SW.PU_INSCABLIQWEB_PG(:PN_NUMERO,
                                                  :PV_MODULO,
                                                  :PN_CUENTA,
                                                  :PN_ANIO,
                                                  :PN_LIQUIDACION,
                                                  :PV_CONCEPTO,
                                                  :PV_SUBCONCEPTO,
                                                  :PV_CEDULA,
                                                  :PV_NOMBRES,
                                                  :PV_APELLIDO_PATERNO,
                                                  :PV_APELLIDO_MATERNO,
                                                  :PV_DIRECCION,
                                                  :PV_OBSERVACION,
                                                  :PV_TITULO_CREDITO,
                                                  :PN_VALOR_EXO,
                                                  :PN_VALOR_NOMINAL,
                                                  :PN_IMPUESTO_PREDIAL,
                                                  :PN_INTERES,
                                                  :PN_MORA,
                                                  :PN_COACTIVA,
                                                  :PN_DESCUENTO,
                                                  :PN_TOTAL,
                                                  :PN_SECCABLIQ,
                                                  :PT_DETALLES,
                                                  VB_ERROR,
                                                  :PV_MSG_ERROR
                                                  );
  IF VB_ERROR THEN
    :PN_ERROR := 1;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
       :PN_ERROR := 1;
       :PV_MSG_ERROR := 'ERROR plsql_INSCABLIQWEB_PG '||SQLERRM;
END;
`;


const plsql_INSCABLIQWEBPGJSON = `BEGIN
                      INSERT INTO ARE_CABLIQWEBPG_JSON(SECUENCIA_CAB, LIQJSONPG, FECHA_INGRESO) VALUES(:PN_SECUENCIA_CAB,:PV_JSON,SYSDATE); 
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PV_MSG_ERROR := 'ERROR AL INSERTAR ARE_PAGOENLINEA_JSON '||SQLERRM;
                      END;`;

const plsql_CONSULTAR_CABLIQWEBPGJSON = `BEGIN
                         :PN_ERROR := 0;
                         SELECT DBMS_LOB.SUBSTR(LIQJSONPG, 32767, 1) INTO :PV_JSON
                         FROM ARE_CABLIQWEBPG_JSON
                         WHERE SECUENCIA_CAB = :PN_SECCABLIQ; 
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PN_ERROR := 1; 
                          :PV_MSG_ERROR := 'ERROR AL CONSULTAR ARE_PAGOENLINEA_JSON '||SQLERRM;
                      END;`;

const plsql_INSERTA_RECAPEL_PG = `
                      DECLARE
                        VB_ERROR BOOLEAN;
                      BEGIN
                         :PN_ERROR := 0;
                         VB_ERROR := FALSE;
                         RECAUDA.PKG_ARE_PORCOBRAR_SW.PU_INSERTA_RECAPEL_PG(:PN_SECCABLIQ,
                                  :PV_SESION,
                                  :PV_ID_TRANSACCION,
                                  :PV_CODE_TRANSACCION,
                                  :PV_MODULO,
                                  :PV_NUMERO_IDENTIFICACION,
                                  :PV_APELLIDO_PATERNO,
                                  :PV_APELLIDO_MATERNO,
                                  :PV_NOMBRES,
                                  :PV_OBSERVACION,
                                  :PV_DIRECCION,
                                  :PN_VALOR_RECIBIDO,
                                  VB_ERROR,
                                  :PV_MSG_ERROR); 
                          IF VB_ERROR THEN
                            :PN_ERROR := 1;
                          END IF;
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PN_ERROR := 1; 
                          :PV_MSG_ERROR := 'ERROR AL CONSULTAR ARE_PAGOENLINEA_JSON '||SQLERRM;
                      END;`;                      

const plsql_NUMERO_LIQUIDACION = `
                      BEGIN
                          :PN_ERROR := 0;
                          SELECT sec_areporcobrar.NEXTVAL INTO :PN_NUMERO FROM DUAL;    
                      EXCEPTION
                        WHEN OTHERS THEN
                          :PN_ERROR := 1; 
                          :PV_MSG_ERROR := 'ERROR AL CONSULTAR NUMERO LIQUIDACION '||SQLERRM;
                      END;`;   

const plsql_CONSULTACOMPROBANTES =  `
    SELECT A.NUM_COMPROBANTE,TO_CHAR(A.FECHA_COMPROBANTE,'DD-MON-YYYY HH24:MI:SS') FECHA_COMPROBANTE,B.DESCRIPCION,LTRIM(RTRIM(TO_CHAR(A.VALOR_TOTAL,'999999990.99'))) VALOR_TOTAL, A.DIRECCION, A.TRANSACTION_ID, A.AUTHORIZATION_CODE, A.SECABLIQWEB
    FROM ARE_RECAUDACIONES_PAGOENLINEA A,ARE_DETALLE_SUBTRAN B 
    WHERE A.ESTADO_PAGO IN ('P','C') AND
          A.NUMERO_IDENTIFICACION = :PV_CEDULA AND
          A.CODIGO_TRANSACCION = B.CODIGO_TRANSACCION AND
          A.CODIGO_SUBTRANSACCION = B.CODIGO_SUBTRANSACCION AND
          A.CODIGO_DETALLE_SUBTRAN = B.CODIGO_DETALLE_SUBTRAN
    ORDER BY A.FECHA_COMPROBANTE DESC,A.NUM_COMPROBANTE
`; 
                  

module.exports = {
    plsql_AGE_PU_AUTENTICAR_WEB,
    plsql_INSERTA_LOGIN,
    plsql_UPDATELOGIN,
    plsql_LOGOUT,
    plsql_RECUPERARUSUARIOLOGIN,
    plsql_CONSULTARDEUDA,
    plsql_RECAUDARENLINEA,
    plsql_RECAUDARENLINEA_02,
    plsql_CONSULTARFACTURAS,
    plsql_INSERTADEUDAPQ,
    plsql_INSPREDIOPQ,
    plsql_INSCATASTROPG,
    plsql_INSRUBXCATAPG,
    plsql_CONSULTALIQ_PG,
    plsql_UPDATE_RECAPEL,
    plsql_INSERTASECPROCJSON,
    plsql_INSERTAERROR_PEL,
    plsql_INSCABLIQWEB_PG,    
    plsql_INSCABLIQWEBPGJSON,
    plsql_CONSULTAR_CABLIQWEBPGJSON,
    plsql_INSERTA_RECAPEL_PG,
    plsql_NUMERO_LIQUIDACION,
    plsql_CONSULTACOMPROBANTES
}