# Modulo de Vinculacion - API Backend

Este documento describe el modulo aislado de vinculacion creado dentro de `backend/src/modules/vinculacion`.

## Objetivo

Permitir que docentes con roles de vinculacion generen informes PDF oficiales desde datos estructurados, evidencias en imagen y plantillas de observaciones configurables. La API trabaja aislada del frontend y del modulo existente de reportes/tutorias.

## Archivos principales

- `server.js`: monta la ruta `/api/vinculacion`.
- `src/modules/vinculacion/vinculacionRoutes.js`: define endpoints REST.
- `src/modules/vinculacion/authMiddleware.js`: autenticacion temporal por headers.
- `src/modules/vinculacion/vinculacionController.js`: traduce HTTP a servicio.
- `src/modules/vinculacion/vinculacionService.js`: reglas de negocio.
- `src/modules/vinculacion/vinculacionRepository.js`: consultas SQL.
- `src/modules/vinculacion/vinculacionPdfGenerator.js`: generacion PDF con Puppeteer.
- `src/modules/vinculacion/zipBuilder.js`: ZIP sin dependencias externas.
- `src/modules/vinculacion/periodUtils.js`: calculo de claves de mes/trimestre/semestre.
- `database/migrations/001_vinculacion.sql`: migracion inicial.
- `storage/vinculacion/pdfs`: carpeta donde se guardan PDFs generados.

## Autenticacion temporal

Hasta integrar JWT real, todos los endpoints esperan:

```http
x-user-id: 1
x-role-name: Supervisor
```

Roles aceptados:

- `Responsable de vinculación`
- `Líder de proyecto`
- `Supervisor`

El middleware valida que `x-user-id` exista en `seguimiento.usuario` y que el usuario este activo. El servicio valida que el usuario tenga el rol indicado en `seguimiento.asignacion_rol`.

## Tablas reutilizadas

Se reutilizan:

- `seguimiento.usuario`
- `seguimiento.carrera`
- `seguimiento.periodo_academico`
- `seguimiento.rol`
- `seguimiento.asignacion_rol`

## Tablas nuevas

La migracion crea:

- `seguimiento.proyecto_vinculacion`
- `seguimiento.asignacion_rol_vinculacion`
- `seguimiento.asignacion_proyecto_vinculacion`
- `seguimiento.tipo_informe_vinculacion`
- `seguimiento.plantilla_observacion_vinculacion`
- `seguimiento.fecha_limite_informe_vinculacion`
- `seguimiento.informe_vinculacion`
- `seguimiento.descarga_zip_vinculacion`
- `seguimiento.log_vinculacion`

Tambien amplia el `CHECK` de `seguimiento.rol.nombre` para aceptar los roles de vinculacion.

## Estados del informe

- `pendiente`
- `generado`
- `incumplido`
- `descargado`
- `cerrado`

En esta version el informe nace como `generado` cuando el PDF se crea correctamente. No hay borrador.

## Tipos de informe iniciales

Sin POA:

- Informe mensual supervisor
- Informe trimestral supervisor
- Informe semestral supervisor
- Informe mensual líder
- Informe trimestral líder
- Informe semestral líder
- Informe mensual responsable
- Informe trimestral responsable
- Informe final semestral responsable
- Consolidado mensual responsable

## Evidencias

Las evidencias se reciben durante la generacion del informe, se insertan dentro del PDF y luego se descartan. No se guardan archivos originales en el servidor.

Restricciones:

- Solo `image/jpeg` y `image/png`.
- Maximo 10 MB por imagen.
- Maximo 50 MB total por informe.
- Maximo 30 evidencias por informe.

El PDF final si queda guardado en el servidor.

## Claves de periodo

La API usa `periodo_clave` para evitar informes duplicados:

- Mes: `M01`, `M02`, ..., `M12`
- Trimestre: `T01`, `T02`, `T03`, `T04`
- Semestre: `S01`, `S02`

La restriccion unica es:

```sql
(id_usuario, id_periodo, id_proyecto, id_tipo_informe, periodo_clave)
```

## Endpoints

Base URL:

```http
/api/vinculacion
```

### GET `/catalogos`

Devuelve periodos, carreras, proyectos y tipos de informe.

### POST `/proyectos`

Solo `Responsable de vinculación`.

Body:

```json
{
  "id_periodo": 1,
  "id_carrera": 1,
  "nombre": "Proyecto de vinculacion",
  "descripcion": "Descripcion opcional",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-06-30"
}
```

### GET `/docentes`

Solo `Responsable de vinculación`.

Lista docentes activos para asignar roles/proyectos.

```http
?buscar=Juan
```

### PATCH `/proyectos/:id/estado`

Solo `Responsable de vinculación`.

Permite cerrar o inactivar un proyecto.

```json
{
  "estado": "CERRADO"
}
```

### GET `/asignaciones-rol`

Solo `Responsable de vinculación`.

Lista docentes con roles de vinculacion por periodo.

Filtros:

```http
?id_periodo=1&rol_nombre=Supervisor
```

### POST `/asignaciones-rol`

Solo `Responsable de vinculación`.

Asigna un rol general de vinculacion a un docente dentro de un periodo.

```json
{
  "id_usuario": 1,
  "rol_nombre": "Supervisor",
  "id_periodo": 1,
  "fecha_inicio": "2026-01-01",
  "fecha_fin": null
}
```

### GET `/asignaciones-proyecto`

Solo `Responsable de vinculación`.

Lista asignaciones de docentes a proyectos.

Filtros:

```http
?id_periodo=1&id_proyecto=1
```

### POST `/asignaciones-proyecto`

Solo `Responsable de vinculación`.

Asigna un docente a un proyecto en un periodo con un rol de vinculacion.

```json
{
  "id_usuario": 1,
  "id_proyecto": 1,
  "id_periodo": 1,
  "rol_nombre": "Supervisor",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": null
}
```

### GET `/plantillas-observacion`

Query:

```http
?id_tipo_informe=1&id_proyecto=1
```

Devuelve titulos configurados para el bloque `3. Observaciones`.

### POST `/plantillas-observacion`

Solo `Responsable de vinculación`.

Permite crear puntos de observacion por tipo de informe. Si `id_proyecto` es `null`, aplica como plantilla general; si se envia `id_proyecto`, aplica solo a ese proyecto.

Body:

```json
{
  "id_tipo_informe": 1,
  "id_proyecto": 1,
  "titulo": "Fotografías en el Punto Digital",
  "orden": 3
}
```

### PATCH `/plantillas-observacion/:id/estado`

Solo `Responsable de vinculación`.

Body:

```json
{
  "estado": "INACTIVO"
}
```

### GET `/fechas-limite`

Solo `Responsable de vinculación`.

Lista fechas limite manuales. Filtros opcionales:

```http
?id_periodo=1&id_tipo_informe=1
```

### POST `/fechas-limite`

Solo `Responsable de vinculación`.

Crea o actualiza una fecha limite para un periodo/tipo/mes-trimestre-semestre. La API calcula `periodo_clave`.

Body mensual:

```json
{
  "id_periodo": 1,
  "id_tipo_informe": 1,
  "mes": 1,
  "fecha_limite": "2026-02-05"
}
```

Body trimestral:

```json
{
  "id_periodo": 1,
  "id_tipo_informe": 2,
  "trimestre": 1,
  "fecha_limite": "2026-04-10"
}
```

### POST `/informes/generar`

Genera el PDF final, guarda el PDF y registra el informe como `generado`.

Body ejemplo:

```json
{
  "id_periodo": 1,
  "id_carrera": 1,
  "id_proyecto": 1,
  "id_tipo_informe": 1,
  "mes": 1,
  "actividades": {
    "desarrollo": "Actividad 1",
    "beneficiarios": 25,
    "zona": "Punto Digital El Carmen",
    "evidencias": [],
    "items": [
      {
        "id": "actividad-1",
        "titulo": "Actividad 1",
        "descripcion": "Socializacion del proyecto con estudiantes.",
        "evidencia_textual": "Registro de socializacion firmado.",
        "beneficiarios": 25,
        "zona": "Punto Digital El Carmen",
        "evidencias": []
      }
    ]
  },
  "observaciones": [
    {
      "id": "observacion-1",
      "titulo": "Registro de socializacion firmado.",
      "detalle": "Imagen que respalda la evidencia textual de la actividad.",
      "id_actividad": "actividad-1",
      "evidencias": [
        {
          "nombre": "socializacion.jpg",
          "mimeType": "image/jpeg",
          "dataUrl": "data:image/jpeg;base64,..."
        }
      ]
    }
  ]
}
```

### GET `/informes`

Lista informes. El responsable ve todo; lideres y supervisores ven solo sus informes.

Filtros opcionales:

```http
?id_periodo=1&id_carrera=1&estado=generado
```

### GET `/informes/:id/pdf`

Descarga PDF individual. Registra log `DESCARGAR_PDF_VINCULACION` y marca fecha de descarga. Si estaba `generado`, pasa a `descargado`.

### GET `/respaldos/zip`

Genera ZIP al momento de descargar. Solo incluye PDFs.

Query:

```http
?id_periodo=1&tipo_descarga=MENSUAL&periodo_clave=M01
```

Registra log `DESCARGAR_ZIP_VINCULACION` y registro en `descarga_zip_vinculacion`.

### POST `/incumplimientos/evaluar`

Solo `Responsable de vinculación`.

Evalua fechas limite manuales:

- informes generados/descargados vencidos pasan a `cerrado`;
- informes no entregados pasan a `incumplido`.

Body:

```json
{
  "fecha_referencia": "2026-06-01"
}
```

### GET `/logs`

Solo `Responsable de vinculación`.

Filtros:

```http
?id_usuario=1&accion=GENERAR_INFORME_VINCULACION
```

Acciones registradas:

- `GENERAR_INFORME_VINCULACION`
- `DESCARGAR_PDF_VINCULACION`
- `DESCARGAR_ZIP_VINCULACION`

## Migracion

Aplicar manualmente:

```bash
psql "$DATABASE_URL" -f database/migrations/001_vinculacion.sql
```

O ejecutar el contenido del archivo desde una herramienta como DBeaver, pgAdmin o Supabase SQL editor.

## Variables de entorno

Archivo esperado: `.env`.

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/db_seguimiento_docente
DATABASE_SSL=false
PORT=3001
CHROME_EXECUTABLE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
VINCULACION_STORAGE_ROOT=D:\backend\backend\storage\vinculacion
```

En Windows local, `CHROME_EXECUTABLE_PATH` puede apuntar a Edge o Chrome. En servidor Linux/cloud se puede omitir si `@sparticuz/chromium` resuelve el ejecutable.
`VINCULACION_STORAGE_ROOT` es opcional; si no se define, los PDFs se guardan en `backend/storage/vinculacion`.

## Notas para frontend

Cuando se conecte React:

1. Convertir imagenes seleccionadas a `dataUrl`.
2. Enviar solo JPG/JPEG/PNG.
3. Enviar headers temporales `x-user-id` y `x-role-name`.
4. Consumir `GET /catalogos` para poblar periodos, carreras, proyectos y tipos.
5. Consumir `GET /plantillas-observacion` para cargar bloque `3. Observaciones`.

## Pendientes deliberados

- Integrar JWT real.
- Conectar frontend definitivo.
- Ajustar HTML/CSS del PDF con el formato institucional exacto.
- Definir fechas limite reales por tipo de informe y periodo.
- Automatizar evaluacion de incumplimientos con tarea programada.
