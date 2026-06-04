const pool = require('../src/config/db');

async function main() {
  const userId = Number(process.argv[2] || 1);
  const periodId = Number(process.argv[3] || 1);

  const role = await pool.query(
    `
    SELECT id_rol
    FROM seguimiento.rol
    WHERE nombre = $1
    LIMIT 1
    `,
    ['Responsable de vinculación'],
  );

  if (!role.rows.length) {
    throw new Error('No existe el rol Responsable de vinculación. Ejecute la migracion primero.');
  }

  const result = await pool.query(
    `
    INSERT INTO seguimiento.asignacion_rol_vinculacion
      (id_usuario, id_rol, id_periodo, fecha_inicio, estado)
    VALUES ($1, $2, $3, CURRENT_DATE, 'ACTIVO')
    ON CONFLICT (id_usuario, id_rol, id_periodo)
    DO UPDATE SET estado = 'ACTIVO', fecha_fin = NULL
    RETURNING *
    `,
    [userId, role.rows[0].id_rol, periodId],
  );

  console.log('Responsable de vinculacion asignado:', result.rows[0]);
}

main()
  .catch((error) => {
    console.error('Error en bootstrap:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
