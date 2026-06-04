# Resumen funcional del módulo de Vinculación

Este documento resume lo que puede hacer el módulo de Vinculación en el prototipo actual.

## Funciones principales

- Consultar catálogos de períodos, carreras, proyectos y tipos de informe.
- Crear informes de Vinculación desde un formulario web.
- Seleccionar rol, período institucional, carrera, proyecto y período de trabajo mensual, trimestral, semestral, final o consolidado.
- Generar PDF automáticamente desde los datos ingresados en el formulario.
- Previsualizar visualmente el PDF antes de generarlo.
- Ocultar o mostrar la previsualización mientras se llena el formulario.
- Descargar PDFs generados.
- Descargar respaldos ZIP por mes, trimestre o semestre.
- Ver historial de informes con filtros por texto y estado.
- Ver seguimiento general por carrera y alertas de pendientes/incumplidos.
- Registrar acciones de generación y descarga en la bitácora institucional.

## Bloques del informe

- `1. Información General`: unidad académica, carrera, proyecto, docente, rol y fecha.
- `2. Actividades realizadas`: registra ítems de actividad, beneficiarios y zona.
- `2.1 Desarrollo de actividades`: cada ítem tiene una actividad textual y una evidencia textual.
- `3. Observaciones`: se genera desde las evidencias textuales del bloque 2.
- Cada observación se enlaza con una actividad y permite subir imágenes que respalden esa evidencia textual.

## Evidencias

- Solo se aceptan imágenes JPG, JPEG y PNG.
- Las imágenes se insertan dentro del PDF.
- Las evidencias no se guardan como archivos independientes; se registra su referencia como evidencia embebida en PDF.
- La evidencia textual queda guardada como dato de la actividad.
- Cada imagen de observación queda relacionada con la observación y con la actividad asociada.

## Estados de informes

- `generado`: informe creado con PDF.
- `pendiente`: informe esperado o en borrador.
- `incumplido`: informe marcado como no entregado.
- `descargado`: PDF descargado por el usuario.
- `cerrado`: informe cerrado al finalizar mes, trimestre o semestre.

## Base de datos

El módulo ya no crea tablas nuevas. Usa tablas existentes:

- `informe_semestral`
- `informe_mensual`
- `actividad`
- `evidencia`
- `observacion`
- `archivo_pdf`
- `asignacion_rol`
- `bitacora_auditoria`

Solo se agregaron campos e índices necesarios para diferenciar informes de Vinculación por docente, rol, tipo de informe y período.

## Roles usados

- Responsable de vinculación
- Líder de proyecto
- Supervisor

Los roles se consultan desde la tabla institucional `rol`.
