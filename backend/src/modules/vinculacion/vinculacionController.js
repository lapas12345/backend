const service = require('./vinculacionService');

/**
 * Controlador HTTP: parsea parametros, llama al servicio y formatea respuestas.
 */
const controller = {
  async getCatalogs(req, res, next) {
    try {
      res.json(await service.getCatalogs());
    } catch (error) {
      next(error);
    }
  },

  async listTeachers(req, res, next) {
    try {
      res.json(await service.listTeachers(req.query.buscar, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async createProject(req, res, next) {
    try {
      const project = await service.createProject(req.body, req.authUser);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  async updateProjectStatus(req, res, next) {
    try {
      const project = await service.updateProjectStatus(Number(req.params.id), req.body.estado, req.authUser);
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async assignRole(req, res, next) {
    try {
      const assignment = await service.assignRole(req.body, req.authUser);
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  },

  async listRoleAssignments(req, res, next) {
    try {
      res.json(await service.listRoleAssignments(req.query, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async assignProject(req, res, next) {
    try {
      const assignment = await service.assignProject(req.body, req.authUser);
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  },

  async listProjectAssignments(req, res, next) {
    try {
      res.json(await service.listProjectAssignments(req.query, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async getObservationTemplate(req, res, next) {
    try {
      const template = await service.getObservationTemplate(
        Number(req.query.id_tipo_informe),
        req.query.id_proyecto ? Number(req.query.id_proyecto) : null,
      );
      res.json(template);
    } catch (error) {
      next(error);
    }
  },

  async createObservationTemplate(req, res, next) {
    try {
      const template = await service.createObservationTemplate(req.body, req.authUser);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  },

  async updateObservationTemplateStatus(req, res, next) {
    try {
      const template = await service.updateObservationTemplateStatus(
        Number(req.params.id),
        req.body.estado,
        req.authUser,
      );
      res.json(template);
    } catch (error) {
      next(error);
    }
  },

  async listDeadlines(req, res, next) {
    try {
      res.json(await service.listDeadlines(req.query, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async upsertDeadline(req, res, next) {
    try {
      const deadline = await service.upsertDeadline(req.body, req.authUser);
      res.status(201).json(deadline);
    } catch (error) {
      next(error);
    }
  },

  async generateReport(req, res, next) {
    try {
      const report = await service.generateReport(req.body, req.authUser, req.ip);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  },

  async listReports(req, res, next) {
    try {
      res.json(await service.listReports(req.query, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async downloadPdf(req, res, next) {
    try {
      const file = await service.downloadPdf(Number(req.params.id), req.authUser, req.ip);
      res.download(file.path, file.filename);
    } catch (error) {
      next(error);
    }
  },

  async downloadZip(req, res, next) {
    try {
      const zip = await service.downloadZip(req.query, req.authUser, req.ip);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
      res.send(zip.buffer);
    } catch (error) {
      next(error);
    }
  },

  async evaluateDeadlines(req, res, next) {
    try {
      const referenceDate = req.body.fecha_referencia || new Date().toISOString().slice(0, 10);
      res.json(await service.evaluateDeadlines(referenceDate, req.authUser));
    } catch (error) {
      next(error);
    }
  },

  async listLogs(req, res, next) {
    try {
      res.json(await service.listLogs(req.query, req.authUser));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
