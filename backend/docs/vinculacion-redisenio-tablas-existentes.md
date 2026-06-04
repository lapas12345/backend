# Rediseño de Vinculación con tablas existentes

El tutor indicó que el módulo no debe crear tablas nuevas. Por eso se eliminaron las tablas nuevas del prototipo aislado y la persistencia de Vinculación quedó apoyada en tablas institucionales existentes.

## Tablas nuevas eliminadas

- `seguimiento.proyecto_vinculacion`
- `seguimiento.asignacion_rol_vinculacion`
- `seguimiento.asignacion_proyecto_vinculacion`
- `seguimiento.tipo_informe_vinculacion`
- `seguimiento.plantilla_observacion_vinculacion`
- `seguimiento.fecha_limite_informe_vinculacion`
- `seguimiento.informe_vinculacion`
- `seguimiento.descarga_zip_vinculacion`
- `seguimiento.log_vinculacion`

## Tablas existentes reutilizadas

- `seguimiento.informe_semestral`
- `seguimiento.informe_mensual`
- `seguimiento.actividad`
- `seguimiento.evidencia`
- `seguimiento.observacion`
- `seguimiento.archivo_pdf`
- `seguimiento.asignacion_rol`
- `seguimiento.bitacora_auditoria`
- `seguimiento.usuario`
- `seguimiento.rol`
- `seguimiento.carrera`
- `seguimiento.periodo_academico`

## Campos agregados a tablas existentes

- `seguimiento.informe_semestral`: metadatos de rol, tipo de informe, frecuencia, período de trabajo y datos JSON de Vinculación.
- `seguimiento.informe_mensual`: metadatos de rol, tipo de informe, frecuencia, período de trabajo, dueño del informe (`id_usuario_vinculacion`), fechas de descarga/cierre y datos JSON.
- `seguimiento.actividad`: título, orden, beneficiarios numéricos, zona y datos JSON de Vinculación.
- `seguimiento.observacion`: título, orden, actividad relacionada y datos JSON de Vinculación.
- `seguimiento.evidencia`: observación relacionada, tipo MIME, marca de inserción en PDF y datos JSON de Vinculación.
- `seguimiento.archivo_pdf`: período, tipo de informe, rol y fecha de descarga.

## Relaciones implementadas

- `2.1 Desarrollo de actividades` se guarda en `seguimiento.actividad`.
- La evidencia textual de cada actividad se guarda en `seguimiento.actividad.datos_vinculacion`.
- Cada punto de `3. Observaciones` se genera desde una evidencia textual y queda enlazado con `seguimiento.actividad.id_actividad`.
- Las imágenes cargadas en observaciones se guardan en `seguimiento.evidencia` con `id_actividad` e `id_observacion`, de forma que se puede consultar su relación con ambos bloques.
- `Beneficiarios` se recibe como número y se almacena en `seguimiento.actividad.beneficiarios`.

## Restricción de informe mensual

La restricción original `uq_mes_por_informe` permitía un solo informe por `id_informe_semestral` y `mes`. Para Vinculación eso impedía guardar varios docentes o tipos de informe en el mismo proyecto y mes.

La migración `004_vinculacion_propietario_informe.sql` reemplaza esa restricción por dos índices:

- `uq_mes_por_informe_general`: mantiene el comportamiento original para registros no vinculados al módulo.
- `uq_mes_por_informe_vinculacion`: diferencia por docente, tipo de informe y período de Vinculación.
