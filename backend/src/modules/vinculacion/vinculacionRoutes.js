const express = require('express');
const controller = require('./vinculacionController');
const { requireMockUser } = require('./authMiddleware');

const router = express.Router();

// Todas las rutas usan autenticacion simulada hasta integrar JWT real.
router.use(requireMockUser);

router.get('/catalogos', controller.getCatalogs);
router.get('/docentes', controller.listTeachers);
router.post('/proyectos', controller.createProject);
router.patch('/proyectos/:id/estado', controller.updateProjectStatus);
router.get('/asignaciones-rol', controller.listRoleAssignments);
router.post('/asignaciones-rol', controller.assignRole);
router.get('/asignaciones-proyecto', controller.listProjectAssignments);
router.post('/asignaciones-proyecto', controller.assignProject);
router.get('/plantillas-observacion', controller.getObservationTemplate);
router.post('/plantillas-observacion', controller.createObservationTemplate);
router.patch('/plantillas-observacion/:id/estado', controller.updateObservationTemplateStatus);
router.get('/fechas-limite', controller.listDeadlines);
router.post('/fechas-limite', controller.upsertDeadline);

router.post('/informes/generar', controller.generateReport);
router.get('/informes', controller.listReports);
router.get('/informes/:id/pdf', controller.downloadPdf);

router.get('/respaldos/zip', controller.downloadZip);
router.post('/incumplimientos/evaluar', controller.evaluateDeadlines);
router.get('/logs', controller.listLogs);

// Manejador de errores local del modulo para respuestas consistentes.
router.use((error, req, res, next) => {
  console.error('[VINCULACION]', error);
  res.status(error.status || 500).json({
    error: error.message || 'Error interno del modulo de vinculacion',
  });
});

module.exports = router;
