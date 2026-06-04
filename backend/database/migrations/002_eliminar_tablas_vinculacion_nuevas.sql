-- Elimina las tablas nuevas creadas para el prototipo aislado de vinculacion.
-- Motivo: el modulo debe reutilizar tablas existentes de la base institucional.
-- No elimina tablas base como usuario, rol, carrera, periodo_academico,
-- informe_mensual, actividad, evidencia, observacion ni archivo_pdf.

DROP TABLE IF EXISTS seguimiento.log_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.descarga_zip_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.informe_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.fecha_limite_informe_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.plantilla_observacion_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.tipo_informe_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.asignacion_proyecto_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.asignacion_rol_vinculacion CASCADE;
DROP TABLE IF EXISTS seguimiento.proyecto_vinculacion CASCADE;
