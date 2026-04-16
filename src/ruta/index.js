const express = require('express');
const router = express.Router();
const controlador = require('../controlador/index');

// define the home page route
router.get('/', function(req, res) {
  res.send('Ing. Cesar Ramirez Avila.');
});
// ruta para autenticarse
router.post('/autenticacion',controlador.autenticacion);

router.post('/logout',controlador.logout);

router.post('/deudaxcedula',controlador.deudaxcedula);

router.post('/consultarfacturas',controlador.consultarfacturas);

router.post('/getreftransaccion',controlador.getRefTransaccion);

router.post('/consultararchivo',controlador.consultararchivo);

router.post('/recaudarenlinea',controlador.recaudarenlinea);

router.post('/insertalogin',controlador.insertalogin);

router.post('/updatelogin',controlador.updatelogin);

router.post('/recuperaUsuarioLogin',controlador.recuperaUsuarioLogin);

router.post('/enviovaucherpagoenlinea',controlador.enviovaucherpagoenlinea);

router.post('/insertaerrorpagoenlinea',controlador.insertaerrorpagoenlinea);

router.post('/consultacomprobantes',controlador.consultacomprobantes);

router.post('/consultarComprobantePDF',controlador.consultarComprobantePDF);



router.get('/prueba',controlador.prueba);



module.exports = router;