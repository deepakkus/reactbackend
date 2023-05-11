var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({status: false})
});

const AdminController = require('../../../Controller/Auth/Admin');
//const PatientController = require('../../../Controller/Admin/Patient');

router.post('/admin/login', AdminController.login);
router.post('/admin/register', AdminController.register);
//router.use(middleware); // ========> auth setup 


/** ================================= Admin section ================================ */
router.get('/admin', AdminController.getProfile);
router.put('/admin', AdminController.update);

//router.post('/admin/patient', PatientController.create);
//router.put('/admin/patient/:id', PatientController.update);
//router.delete('/admin/patient/:id', PatientController.Delete);
//router.get('/admin/patient', PatientController.viewAll);
//router.get('/admin/patient-details/:id', PatientController.viewSingel);
module.exports = router;
