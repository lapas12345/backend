-- Ajustes del modulo de vinculacion reutilizando tablas existentes.
-- No crea tablas nuevas; solo agrega campos funcionales a tablas institucionales.

ALTER TABLE seguimiento.informe_semestral
  ADD COLUMN IF NOT EXISTS rol_vinculacion VARCHAR(80),
  ADD COLUMN IF NOT EXISTS tipo_informe_vinculacion VARCHAR(120),
  ADD COLUMN IF NOT EXISTS frecuencia_vinculacion VARCHAR(30),
  ADD COLUMN IF NOT EXISTS periodo_clave_vinculacion VARCHAR(10),
  ADD COLUMN IF NOT EXISTS trimestre_vinculacion INTEGER,
  ADD COLUMN IF NOT EXISTS semestre_vinculacion INTEGER,
  ADD COLUMN IF NOT EXISTS datos_vinculacion JSONB;

ALTER TABLE seguimiento.informe_mensual
  ADD COLUMN IF NOT EXISTS rol_vinculacion VARCHAR(80),
  ADD COLUMN IF NOT EXISTS tipo_informe_vinculacion VARCHAR(120),
  ADD COLUMN IF NOT EXISTS frecuencia_vinculacion VARCHAR(30),
  ADD COLUMN IF NOT EXISTS periodo_clave_vinculacion VARCHAR(10),
  ADD COLUMN IF NOT EXISTS trimestre_vinculacion INTEGER,
  ADD COLUMN IF NOT EXISTS semestre_vinculacion INTEGER,
  ADD COLUMN IF NOT EXISTS datos_vinculacion JSONB,
  ADD COLUMN IF NOT EXISTS fecha_descarga_pdf TIMESTAMP,
  ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP;

ALTER TABLE seguimiento.actividad
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(180),
  ADD COLUMN IF NOT EXISTS orden INTEGER,
  ADD COLUMN IF NOT EXISTS beneficiarios INTEGER,
  ADD COLUMN IF NOT EXISTS zona_vinculacion VARCHAR(180),
  ADD COLUMN IF NOT EXISTS datos_vinculacion JSONB;

ALTER TABLE seguimiento.observacion
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(180),
  ADD COLUMN IF NOT EXISTS orden INTEGER,
  ADD COLUMN IF NOT EXISTS id_actividad INTEGER REFERENCES seguimiento.actividad(id_actividad) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS datos_vinculacion JSONB;

ALTER TABLE seguimiento.evidencia
  ADD COLUMN IF NOT EXISTS id_observacion INTEGER REFERENCES seguimiento.observacion(id_observacion) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS incluida_en_pdf BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS datos_vinculacion JSONB;

ALTER TABLE seguimiento.archivo_pdf
  ADD COLUMN IF NOT EXISTS periodo_clave_vinculacion VARCHAR(10),
  ADD COLUMN IF NOT EXISTS tipo_informe_vinculacion VARCHAR(120),
  ADD COLUMN IF NOT EXISTS rol_vinculacion VARCHAR(80),
  ADD COLUMN IF NOT EXISTS fecha_descarga_pdf TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_informe_mensual_vinculacion
  ON seguimiento.informe_mensual (id_informe_semestral, periodo_clave_vinculacion, tipo_informe_vinculacion);

CREATE INDEX IF NOT EXISTS idx_evidencia_observacion_vinculacion
  ON seguimiento.evidencia (id_observacion);
