-- Ajuste sobre tablas existentes para soportar informes de vinculacion sin crear tablas nuevas.
-- La tabla informe_mensual pertenece al modelo institucional existente; aqui solo se agregan
-- campos e indices para diferenciar informes por docente, tipo y periodo de vinculacion.

ALTER TABLE seguimiento.informe_mensual
  ADD COLUMN IF NOT EXISTS id_usuario_vinculacion INTEGER REFERENCES seguimiento.usuario(id_usuario);

-- La restriccion original solo permite un informe mensual por informe_semestral/mes.
-- Se conserva ese comportamiento para registros generales y se abre una clave mas precisa
-- para vinculacion, donde pueden coexistir varios docentes o tipos de informe en el mismo mes.
ALTER TABLE seguimiento.informe_mensual
  DROP CONSTRAINT IF EXISTS uq_mes_por_informe;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mes_por_informe_general
  ON seguimiento.informe_mensual (id_informe_semestral, mes)
  WHERE tipo_informe_vinculacion IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mes_por_informe_vinculacion
  ON seguimiento.informe_mensual (
    id_informe_semestral,
    mes,
    id_usuario_vinculacion,
    tipo_informe_vinculacion,
    periodo_clave_vinculacion
  )
  WHERE tipo_informe_vinculacion IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_informe_mensual_usuario_vinculacion
  ON seguimiento.informe_mensual (id_usuario_vinculacion);
