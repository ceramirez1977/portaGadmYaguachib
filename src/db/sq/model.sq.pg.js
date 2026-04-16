const { DataTypes} = require ('sequelize');
const {Sequelize} = require('sequelize');
const {ip_serverweb,getCredencialOra,getConnPG} = require('../../gen/rutasScgp');
const {fechaActualServer} = require('../../gen/dataReferencial');


const credencialOra = getCredencialOra();
const connPG = getConnPG();

const sequelize = new Sequelize(connPG.database,connPG.user,connPG.password,{
  host:connPG.host,
  port:connPG.port,
  dialect:'postgres'
});

const Catastro = sequelize.define(
    'catastro',
    {
        id_predio: {
            type: DataTypes.INTEGER, // int4 NOT NULL,
            primaryKey:true,
        },
        anio: {
            type: DataTypes.DECIMAL(38),  // numeric(38) NOT NULL
            primaryKey:true,
        },
        secuencia: {
            type: DataTypes.SMALLINT,  //  int2 NOT NULL,
            primaryKey:true,
        },
        id_tipo_identificacion: {
            type: DataTypes.SMALLINT  //  int2 NOT NULL,
        },
	    numero_identificacion: {
            type: DataTypes.STRING(20)  //     varchar(15) NULL,
        },
        avaluo_solar: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        avaluo_edificacion: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        avaluo_propiedad: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        avaluo_imponible: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        numero_tc: {
            type: DataTypes.STRING(20)  //    varchar(20) NULL,
        },
        estado: {
            type: DataTypes.CHAR(1)  //    bpchar(1) NOT NULL,
        },
        area_solar_legal: {
            type: DataTypes.DECIMAL(10,2)  //     numeric(10, 2) NULL,
        },
        area_solar_grafica: {
            type: DataTypes.DECIMAL(10,2)  //     numeric(10, 2) NULL,
        },
        observacion: {
            type: DataTypes.TEXT //      text NULL,
        },
        id_tramite: {
            type: DataTypes.BIGINT //  int8 NULL,
        },
        fecha_emision: {
            type: DataTypes.DATEONLY //   date NULL,
        },
        area_construccion: {
            type: DataTypes.DECIMAL(10,2)  //   numeric(10, 2) NOT NULL,
        },
        valor_descuento:{
            type: DataTypes.DECIMAL(20,2)   //   numeric(20, 2) NOT NULL,
        }, 
        valor_mora:{
            type: DataTypes.DECIMAL(20,2)   //   numeric(20, 2) NOT NULL,
        }, 
        valor_coactiva:{
            type: DataTypes.DECIMAL(20,2)   //   numeric(20, 2) NOT NULL,
        }, 
        valor_exoneracion:{
            type: DataTypes.DECIMAL(20,2)   //   numeric(20, 2) NOT NULL,
        }, 
        comprobante_pago:{
            type: DataTypes.INTEGER
        },
        fecha_pago:{
            type: DataTypes.DATE
        },
        estado_registro: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        usuario_modificacion: {
            type: DataTypes.STRING,
            defaultValue: credencialOra.user
        },//
        fecha_modificacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },// timestamp(0) NOT NULL,
        ip_modificacion: {
            type: DataTypes.STRING,
            defaultValue: ip_serverweb
        }// varchar(30) NOT NULL,
    },
    {
      tableName: 'catastro',
      schema: 'valoracion',
      freezeTableName: true,
      timestamps: false,  
    }
);

const Catastrorubro  = sequelize.define(
    'catastro_rubro',
    {
        id_predio: {
            type: DataTypes.INTEGER, // int4 NOT NULL,
            primaryKey:true,
        },
        anio: {
            type: DataTypes.DECIMAL(38),  // numeric(38) NOT NULL
            primaryKey:true,
        },       
        secuencia: {
            type: DataTypes.INTEGER,  //  int4 NOT NULL,
            primaryKey:true,
        },
        id_rubro: {
            type: DataTypes.SMALLINT,  //  int2 NOT NULL,
            primaryKey:true,
        },
        valor1: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        valor2: {
            type: DataTypes.DECIMAL(20,2)  //   numeric(20, 2) NOT NULL,
        },
        estado_registro: {
            type: DataTypes.BOOLEAN  //   bool NOT NULL,
        },        
    },
    {
      tableName: 'catastro_rubro',
      schema: 'valoracion',
      freezeTableName: true,
      timestamps: false,  
    }
);

const Comprobante = sequelize.define(
    'comprobante',
    {
        id_comprobante: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },//int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START 1 CACHE 1 NO CYCLE) NOT NULL,
        numero_comprobante_pago: {
            type: DataTypes.INTEGER//,            
            //autoIncrement: true  // este campo se debe activar cuando este en produccion //allowNull: false            
        },// int8 NOT NULL,--fata registro
	    id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false  
        }, //int8 NOT NULL, --falta crear
	    id_caja: {
            type: DataTypes.INTEGER,
            allowNull: false  
        }, //int8 NOT NULL, --falta crear
	    id_tipo_identificacion: {
            type: DataTypes.INTEGER,
            allowNull: true
        }, //int2 NULL,
	    numero_identificacion: {
           type: DataTypes.STRING,
           allowNull: true
        },//varchar(15) NULL, -- si hay are_predio_pg
	    nombre_propietario: {
            type: DataTypes.TEXT,
            allowNull: false
        }, //varchar(400) NOT NULL, -- si hay are_predio_pg
	    id_clase_predio: {
           type: DataTypes.INTEGER,
           allowNull: false  
        },//  int2 NOT NULL,  -- si hay are_predio_pg
	    clave_catastral: {
            type: DataTypes.STRING,
            allowNull: false
         },// varchar(20) NOT NULL, -- si hay are_predio_pg
	    id_predio_periodo: {
            type: DataTypes.INTEGER,
            allowNull: false  
        },// int2 NOT NULL, --abajo 
	    id_predio: {
            type: DataTypes.INTEGER,
            allowNull: false  
        },// int8 NOT NULL, -- si hay are_predio_pg
	    anio_predio: {
            type: DataTypes.INTEGER,
            allowNull: false  
        },// int4 NOT NULL, -- anio de valoracion.catastro
	    anio_pago: {
            type: DataTypes.INTEGER,
            defaultValue: Sequelize.literal('EXTRACT(YEAR FROM NOW())')
        },// int4 NOT NULL,  -- año de la recaudacion
	    avaluo_solar: {
            type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL, -- si hay are_catastro_pg
	    avaluo_edificacion: {
            type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL, -- si hay are_catastro_pg
	    avaluo_propiedad: {
            type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,-- si hay are_catastro_pg
	    avaluo_imponible: {
            type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,-- si hay are_catastro_pg
	    avaluo_comercial: {
            type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,-- si hay are_catastro_pg
	    numero_tc: {
            type: DataTypes.STRING,
            allowNull: true
        },// varchar(20) NULL,  --numero_tc de valoracion.catastro
	    estado: {
            type: DataTypes.CHAR(1), 
            defaultValue: 'V'
        },// bpchar(1) NOT NULL,--V cobrado en linea P pagado R REVERSADO 
	    coactiva: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },// bool NOT NULL, --false
	    convenio: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },// bool NOT NULL, --false
	    valor_nominal: {
            type: DataTypes.DECIMAL(20,2),   //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,
	    valor_descuento: {
            type: DataTypes.DECIMAL(20,2),   //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,
	    valor_exoneracion: {
            type: DataTypes.DECIMAL(20,2),   //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,--revisar predios exonerados
	    valor_interes: {
            type: DataTypes.DECIMAL(20,2),   //   numeric(20, 2) NOT NULL,
            allowNull: false
        },// numeric(20, 2) NOT NULL,
	    valor_punitorio: {
            type: DataTypes.DECIMAL(20,2),
            defaultValue:0
        },// numeric(20, 2) NOT NULL, --0
	    valor_coactiva: {
            type: DataTypes.DECIMAL(20,2),  
            defaultValue:0
        },// numeric(20, 2) NOT NULL,
	    valor_convenio: {
            type: DataTypes.DECIMAL(20,2),  
            defaultValue:0
        },// numeric(20, 2) NOT NULL, --0
	    valor_abono: {
            type: DataTypes.DECIMAL(20,2),  
            defaultValue:0
        },// numeric(20, 2) NOT NULL, --preguntar si estan cobrando abonos
	    valor_mora: {
            type: DataTypes.DECIMAL(20,2),
            allowNull: false
        },// numeric(20, 2) NOT NULL,
	    valor_recibido_efectivo : {
            type: DataTypes.DECIMAL(20,2),  
            defaultValue:0
        },//numeric(20, 2) NOT NULL, --0
	    valor_recibido_cheque: {
            type: DataTypes.DECIMAL(20,2),  
            defaultValue:0
        },// numeric(20, 2) NOT NULL,--0
	    valor_recibido_nc_o_transferencia: {
            type: DataTypes.DECIMAL(20,2),
            defaultValue:0,
            allowNull: false
        },// numeric(20, 2) NOT NULL, --tarjeta de credito
	    fecha_pago: {
            type: DataTypes.DATE,
            defaultValue: fechaActualServer()
        },// timestamp NOT NULL,--fecha que se hace el cobro
	    fecha_reverso: {
            type: DataTypes.DATE,
            allowNull: true
        },// timestamp NULL,
	    total_recibido: {
            type: DataTypes.DECIMAL(20,2),
            allowNull: false
        },// numeric(20, 2) NOT NULL, --valor_total percibido
	    id_tipo_semestre_pago: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },// int2 DEFAULT 1 NOT NULL,-- 1 
	    secuencia: {
            type: DataTypes.INTEGER,
            allowNull: false
        },// int4 NOT NULL, -- secuencia de valoracion.catastro
	    estado_registro: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },// bool DEFAULT true NOT NULL, --true
	    usuario_ingreso: {
            type: DataTypes.STRING,
            defaultValue: credencialOra.user
        },// varchar(20) NOT NULL, --SCGPWEB
	    fecha_ingreso: {
            type: DataTypes.DATE,
            defaultValue: fechaActualServer()
        },// timestamp(0) NOT NULL, --fechaactual
	    ip_ingreso: {
            type: DataTypes.STRING,
            defaultValue: ip_serverweb
        },// varchar(30) NOT NULL, --"WEB"
	    usuario_modificacion: {
            type: DataTypes.STRING,
            defaultValue: credencialOra.user
        },// varchar(20) NOT NULL,
	    fecha_modificacion: {
            type: DataTypes.DATE,
            defaultValue: fechaActualServer()
        },//  timestamp(0) NOT NULL,
	    ip_modificacion: {
            type: DataTypes.STRING,
            defaultValue: ip_serverweb
        },// varchar(30) NOT NULL,
	    json_impreso: {
            type: DataTypes.TEXT,
            defaultValue: '{}'
        },// text NOT NULL,--json del cobro
	    id_usuario_reverso: {
            type: DataTypes.INTEGER,
            allowNull:true
        }, 
        observacion_reverso : {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
      tableName: 'comprobante',
      schema: 'recaudacion',
      freezeTableName: true,
      timestamps: false,  
    }
);

const ComprobanteDetalle = sequelize.define(
    'comprobante_detalle',
    {
    id_comprobante_detalle: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },// int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START 1 CACHE 1 NO CYCLE) NOT NULL,
	id_comprobante: {
        type: DataTypes.INTEGER,
        allowNull: false
    },// int8 NOT NULL,
	id_rubro: {
        type: DataTypes.INTEGER,
        allowNull: false
    },// int8 NOT NULL,
	id_predio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },// int8 NOT NULL,
	anio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },// int4 NOT NULL,
	descripcion: {
        type: DataTypes.STRING,
        allowNull: true
     },// varchar(200) NOT NULL,
	valor_1: {
        type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
        allowNull: false
    },// numeric(20, 2) NOT NULL,
	valor_2: {
        type: DataTypes.DECIMAL(20,2),  //   numeric(20, 2) NOT NULL,
        defaultValue: 0
    },// numeric(20, 2) DEFAULT 0 NOT NULL,
	estado_registro: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },// bool DEFAULT true NOT NULL,
	usuario_ingreso: {
        type: DataTypes.STRING,
        defaultValue: credencialOra.user
    },// varchar(20) NOT NULL,
	fecha_ingreso: {
        type: DataTypes.DATE,
        defaultValue: fechaActualServer()
    },// timestamp(0) NOT NULL,
	ip_ingreso: {
        type: DataTypes.STRING,
        defaultValue: ip_serverweb
    },// varchar(30) NOT NULL,
	usuario_modificacion: {
        type: DataTypes.STRING,
        defaultValue: credencialOra.user
    },//
	fecha_modificacion: {
        type: DataTypes.DATE,
        defaultValue: fechaActualServer()
    },// timestamp(0) NOT NULL,
	ip_modificacion: {
        type: DataTypes.STRING,
        defaultValue: ip_serverweb
    }// varchar(30) NOT NULL,
},{
    tableName: 'comprobante_detalle',
    schema: 'recaudacion',
    freezeTableName: true,
    timestamps: false,
});


// Relación Uno a Muchos
Comprobante.hasMany(ComprobanteDetalle, { foreignKey: 'id_comprobante', as: 'detalles' });
ComprobanteDetalle.belongsTo(Comprobante, { foreignKey: 'id_comprobante' });

//create posterior
// DEFINIR HOOK AQUÍ (Antes del export)
Comprobante.addHook('afterCreate', async (comprobante, options) => {
  try
  {
    const actualJson = comprobante.toJSON();
    await comprobante.update({ 
      json_impreso: JSON.stringify(actualJson) 
    }, { 
      transaction: options.transaction, // Importante para que use la misma transacción
      hooks: false // Evita bucles infinitos de hooks
    });
  }
  catch(error){
    console.error("Error actualizando JSON en Hook:", error);
  }
});


/*
Catastrorubro.belongsTo(Catastro,{
    targetKey: ['id_predio','anio','secuencia'], foreignKey:'fk_catastro'
});


Catastro.hasMany(Catastrorubro,{
    sourceKey: ['id_predio','anio','secuencia'], foreignKey: 'fk_catastrorubro'
});
*/

module.exports = {
    Catastro,
    Catastrorubro,
    Comprobante,
    ComprobanteDetalle
}

/*
CREATE TABLE valoracion.catastro (
	id_predio int4 NOT NULL,
	anio numeric(38) NOT NULL,
	id_tipo_identificacion int2 NULL,
	numero_identificacion varchar(15) NULL,
	nombre_propietario varchar(400) NOT NULL,
	avaluo_solar numeric(20, 2) NOT NULL,
	avaluo_edificacion numeric(20, 2) NOT NULL,
	avaluo_propiedad numeric(20, 2) NOT NULL,
	avaluo_imponible numeric(20, 2) NOT NULL,
	numero_tc varchar(20) NULL,
	estado bpchar(1) NOT NULL,
	fecha_pago timestamp(0) NULL,
	comprobante_pago int4 NULL,
	valor_descuento numeric(20, 2) NULL,
	valor_mora numeric(20, 2) NULL,
	valor_coactiva numeric(20, 2) NULL,
	valor_exoneracion numeric(20, 2) NULL,
	avaluo_comercial numeric(20, 2) NOT NULL,
	coactiva bool NOT NULL,
	convenio bool NOT NULL,
	tarifa_aplicada numeric(16, 6) NULL,
	estado_registro bool NOT NULL,
	usuario_ingreso varchar(20) NOT NULL,
	fecha_ingreso timestamp(0) NOT NULL,
	ip_ingreso varchar(30) NOT NULL,
	usuario_modificacion varchar(20) NULL,
	fecha_modificacion timestamp(0) NULL,
	ip_modificacion varchar(30) NULL,
	factor_correccion numeric(10, 6) NULL,
	factor_depreciacion numeric(10, 6) NULL,
	secuencia int2 NOT NULL,
	verificacion bool DEFAULT false NULL,
	clave_catastral varchar(100) NULL,
	avaluo_edifica_sin_adicion numeric(20, 2) NULL,
	avaluo_adicional numeric(20, 2) NULL,
	valor_base_metros2 numeric(10, 2) NULL,
	area_solar_legal numeric(10, 2) NULL,
	area_solar_grafica numeric(10, 2) NULL,
	observacion text NULL,
	id_tramite int8 NULL,
	fecha_emision date NULL,
	area_construccion numeric(10, 2) NULL,
	contabilizado varchar(1) NULL,
	fecha_contabiliza timestamp(0) NULL,
	CONSTRAINT pk_catastro PRIMARY KEY (id_predio, anio, secuencia)
);

*/

/*
CREATE TABLE valoracion.catastro_rubro (
	id_predio int4 NOT NULL,
	anio numeric(38) NOT NULL,
	id_rubro int2 NOT NULL,
	valor1 numeric(20, 2) NOT NULL,
	valor2 numeric(20, 2) NOT NULL,
	estado_registro bool NOT NULL,
	usuario_ingreso varchar(20) NOT NULL,
	fecha_ingreso timestamp(0) NOT NULL,
	ip_ingreso varchar(30) NOT NULL,
	usuario_modificacion varchar(20) NULL,
	fecha_modificacion timestamp(0) NULL,
	ip_modificacion varchar(30) NULL,
	secuencia int4 NOT NULL,
	CONSTRAINT pk_catastro_rubro PRIMARY KEY (id_predio, anio, secuencia, id_rubro)
);
*/