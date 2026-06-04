const pool = require('../src/config/db');

const DEFAULT_TEST_USER = {
  cedula: process.env.TEST_VINCULACION_CEDULA || '9999999999',
  nombres: process.env.TEST_VINCULACION_NOMBRES || 'Docente',
  apellidos: process.env.TEST_VINCULACION_APELLIDOS || 'Vinculacion Prueba',
  email: process.env.TEST_VINCULACION_EMAIL || 'docente.vinculacion.prueba@uleam.edu.ec',
  telefono: process.env.TEST_VINCULACION_TELEFONO || '0999999999',
  roleName: process.env.TEST_VINCULACION_ROLE_NAME || 'Responsable de vinculación',
  carreraId: process.env.TEST_VINCULACION_ID_CARRERA ? Number(process.env.TEST_VINCULACION_ID_CARRERA) : null,
  periodoId: process.env.TEST_VINCULACION_ID_PERIODO ? Number(process.env.TEST_VINCULACION_ID_PERIODO) : null,
};

async function firstValue(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

async function main() {
  const baseUser = await firstValue(`
    SELECT tipo_usuario, tipo_vinculacion, dedicacion
    FROM seguimiento.usuario
    WHERE estado = 'ACTIVO'
    ORDER BY id_usuario
    LIMIT 1
  `);

  const role = await firstValue(
    'SELECT id_rol, nombre FROM seguimiento.rol WHERE nombre = $1 LIMIT 1',
    [DEFAULT_TEST_USER.roleName],
  );
  if (!role) {
    throw new Error(`No existe el rol "${DEFAULT_TEST_USER.roleName}" en seguimiento.rol`);
  }

  const career = DEFAULT_TEST_USER.carreraId
    ? await firstValue('SELECT id_carrera, nombre FROM seguimiento.carrera WHERE id_carrera = $1 LIMIT 1', [DEFAULT_TEST_USER.carreraId])
    : await firstValue("SELECT id_carrera, nombre FROM seguimiento.carrera WHERE estado = 'ACTIVO' ORDER BY id_carrera LIMIT 1");
  if (!career) {
    throw new Error('No existe una carrera activa para asignar el usuario de prueba');
  }

  const period = DEFAULT_TEST_USER.periodoId
    ? await firstValue('SELECT id_periodo, nombre FROM seguimiento.periodo_academico WHERE id_periodo = $1 LIMIT 1', [DEFAULT_TEST_USER.periodoId])
    : await firstValue("SELECT id_periodo, nombre FROM seguimiento.periodo_academico WHERE estado = 'ACTIVO' ORDER BY fecha_inicio DESC LIMIT 1");
  if (!period) {
    throw new Error('No existe un periodo activo para asignar el usuario de prueba');
  }

  const userValues = {
    tipo_usuario: process.env.TEST_VINCULACION_TIPO_USUARIO || baseUser?.tipo_usuario || 'DOCENTE',
    tipo_vinculacion: process.env.TEST_VINCULACION_TIPO_VINCULACION || baseUser?.tipo_vinculacion || 'VINCULACION',
    dedicacion: process.env.TEST_VINCULACION_DEDICACION || baseUser?.dedicacion || 'TIEMPO COMPLETO',
  };

  const { rows: userRows } = await pool.query(
    `
    INSERT INTO seguimiento.usuario (
      cedula,
      nombres,
      apellidos,
      email,
      telefono,
      contrasena_hash,
      tipo_usuario,
      tipo_vinculacion,
      dedicacion,
      estado,
      rol
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVO', 'DOCENTE')
    ON CONFLICT (email)
    DO UPDATE SET
      cedula = EXCLUDED.cedula,
      nombres = EXCLUDED.nombres,
      apellidos = EXCLUDED.apellidos,
      telefono = EXCLUDED.telefono,
      tipo_usuario = EXCLUDED.tipo_usuario,
      tipo_vinculacion = EXCLUDED.tipo_vinculacion,
      dedicacion = EXCLUDED.dedicacion,
      estado = 'ACTIVO',
      rol = 'DOCENTE'
    RETURNING id_usuario, cedula, nombres, apellidos, email
    `,
    [
      DEFAULT_TEST_USER.cedula,
      DEFAULT_TEST_USER.nombres,
      DEFAULT_TEST_USER.apellidos,
      DEFAULT_TEST_USER.email,
      DEFAULT_TEST_USER.telefono,
      'hash_prueba_sin_login_real',
      userValues.tipo_usuario,
      userValues.tipo_vinculacion,
      userValues.dedicacion,
    ],
  );

  const user = userRows[0];

  const { rows: assignmentRows } = await pool.query(
    `
    INSERT INTO seguimiento.asignacion_rol (
      id_usuario,
      id_rol,
      id_carrera,
      id_periodo,
      fecha_inicio,
      fecha_fin
    )
    VALUES ($1, $2, $3, $4, CURRENT_DATE, NULL)
    ON CONFLICT (id_usuario, id_rol, id_carrera, id_periodo)
    DO UPDATE SET
      fecha_inicio = EXCLUDED.fecha_inicio,
      fecha_fin = NULL
    RETURNING id_asignacion, id_usuario, id_rol, id_carrera, id_periodo, fecha_inicio, fecha_fin
    `,
    [user.id_usuario, role.id_rol, career.id_carrera, period.id_periodo],
  );

  console.log(JSON.stringify({
    usuario: user,
    rol: role,
    carrera: career,
    periodo: period,
    asignacion: assignmentRows[0],
    frontendEnv: {
      VITE_VINCULACION_USER_ID: user.id_usuario,
      VITE_VINCULACION_ROLE_NAME: role.nombre,
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
