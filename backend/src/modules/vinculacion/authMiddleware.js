const repository = require('./vinculacionRepository');

/**
 * Middleware temporal hasta que el equipo de autenticacion entregue JWT real.
 * Espera:
 * - x-user-id: id_usuario de seguimiento.usuario
 * - x-role-name: nombre funcional dentro de vinculacion
 *
 * No confia ciegamente en los headers: valida que el usuario exista y este activo.
 * La autorizacion fina por rol se hace en el servicio, porque depende de cada accion.
 */
async function requireMockUser(req, res, next) {
  try {
    const userId = Number(req.header('x-user-id'));
    const roleName = req.header('x-role-name');

    if (!userId || !roleName) {
      return res.status(401).json({
        error: 'Faltan cabeceras de autenticacion',
        requiredHeaders: ['x-user-id', 'x-role-name'],
      });
    }

    const user = await repository.findActiveUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.authUser = {
      id_usuario: user.id_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      roleName,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireMockUser };
