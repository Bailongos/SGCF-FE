param(
  [string]$OutputPath = (Join-Path $PSScriptRoot 'Documentacion_Tecnica_SGCF_Corregida.md')
)

$content = @'
# Documentacion Tecnica SGCF

Fecha de referencia: 2026-05-21

## 1. Resumen ejecutivo

SGCF es una aplicacion web SPA orientada a la gestion operativa y financiera de alumnos. Este repositorio contiene el frontend real del sistema, construido con Vue 3, TypeScript y Vite. La aplicacion consume una API HTTP externa mediante Axios y aplica autenticacion, guards de rutas, permisos y alcance por carrera desde el cliente.

## 2. Alcance de esta documentacion

Esta version corregida documenta unicamente lo que si esta respaldado por el codigo presente en este repositorio.

Incluye:

- Arquitectura y estructura del frontend.
- Rutas, vistas y modulos visibles en el proyecto.
- Servicios HTTP y comportamiento del cliente.
- Manejo de sesion, roles y permisos en frontend.
- Integraciones SSO visibles en el codigo.

No incluye como hecho confirmado:

- Implementacion interna del backend.
- Diagramas reales del backend.
- Esquema completo de base de datos.
- Endpoint `/health` o servidor Fastify dentro de este repo.

## 3. Tecnologias confirmadas

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios
- ApexCharts y `vue3-apexcharts`
- `xlsx`
- `animejs`
- `@azure/msal-browser`

## 4. Estructura real del frontend

La estructura principal confirmada es la siguiente:

- `src/main.ts`: arranque de la aplicacion.
- `src/App.vue`: shell principal, tema y transiciones.
- `src/router/index.ts`: definicion de rutas y guards.
- `src/stores/auth.ts`: sesion, rol, estado activo y permisos.
- `src/security/permissions.ts`: permisos del lado cliente y presets por rol.
- `src/services`: clientes HTTP por modulo.
- `src/views`: vistas principales de cada modulo.
- `src/page/inicio.vue`: pantalla principal de modulos.
- `src/components`: componentes reutilizables por dominio.
- `src/utils`: utilidades auxiliares.

## 5. Modulos y vistas confirmadas

Las vistas activas confirmadas por el router son:

- `/login` -> `LoginView.vue`
- `/registro` -> `RegisterView.vue`
- `/inicio` -> `src/page/inicio.vue`
- `/alumnos` -> `AlumnosViews.vue`
- `/dashboard-alumnos` -> `DashboardAlumnosView.vue`
- `/analitica` -> `AnaliticaView.vue`
- `/carreras` -> `carrerasView.vue`
- `/cuentas` -> `CuentasView.vue`
- `/metodos-pago` -> `metodosPago.vue`
- `/ciclos-escolares` -> `CiclosEscolares.vue`
- `/roles` -> `RolesView.vue`
- `/observaciones` -> `ObservacionesView.vue`
- `/conceptos` -> `ConceptosView.vue`
- `/admin/usuarios-permisos` -> `AdminUsuariosPermisosView.vue`

Observacion importante:

- `UsuariosView.vue` existe en el codigo, pero no esta conectada como ruta activa. La ruta `/usuarios` redirige a `/admin/usuarios-permisos`.

## 6. Arquitectura funcional del frontend

El frontend sigue este flujo:

1. El usuario navega en una SPA en Vue.
2. Vue Router protege rutas con `requiresAuth`, `permission` y `scopeByCareer`.
3. Pinia mantiene token, usuario, rol, estado y permisos.
4. Axios agrega `Authorization`, `x-user-id` y `x-user-carrera` a las peticiones.
5. Cada modulo consume endpoints REST esperados por medio de servicios en `src/services`.

## 7. Autenticacion y autorizacion confirmadas

Se confirma en el frontend:

- Login local por `POST /auth/login`.
- Registro local por `POST /auth/register`.
- Login con Google por `POST /auth/google`.
- Login con Microsoft por `POST /auth/microsoft`.
- Persistencia de `token` y `user` en `localStorage`.
- Redireccion a `/login` cuando una peticion autenticada responde `401`.
- Validacion de usuario activo antes de permitir acceso a rutas protegidas.
- Validacion de permisos del lado cliente.

El registro local crea usuarios con estos valores desde el frontend:

- `id_rol = 6`
- `id_carrera = 7`
- `activo = false`

## 8. Roles y permisos reales en el frontend

Los permisos visibles y confirmados en `src/security/permissions.ts` incluyen:

- `view.inicio`
- `view.alumnos`
- `view.dashboard.alumnos`
- `view.carreras`
- `view.cuentas`
- `view.metodos_pago`
- `view.ciclos_escolares`
- `view.admin.usuarios_permisos`
- `view.roles`
- `view.observaciones`
- `view.conceptos`
- `action.alumno.create`
- `action.cuenta.create`
- `action.catalogos.manage`
- `filters.carrera.change`

Presets de rol confirmados en frontend:

- `administrador` -> acceso total.
- `coordinador` -> acceso a alumnos, dashboard, cuentas y observaciones de su carrera.
- `caja` -> acceso a cuentas, conceptos y metodos de pago.
- `pendiente` y `sin rol` -> acceso muy limitado.

Nota de precision:

- El frontend si maneja permisos del lado cliente, pero este repositorio no prueba la existencia de tablas o reglas backend para `rol_permisos` o `usuario_permisos`.

## 9. Servicios HTTP confirmados

Los servicios y endpoints esperados por el frontend son:

- `auth.ts`
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/google`
  - `POST /auth/microsoft`
- `alumnos.ts`
  - `GET /alumnos`
  - `POST /alumnos`
  - `PUT /alumnos/:matricula`
  - `DELETE /alumnos/:matricula`
- `cuentas.ts`
  - `GET /cuentas`
  - `POST /cuentas`
  - `PUT /cuentas/:id_cuenta`
  - `DELETE /cuentas/:id_cuenta`
- `carreras.ts`
  - `GET /carreras`
  - `POST /carreras`
  - `PUT /carreras/:id`
  - `DELETE /carreras/:id`
- `ciclos-escolares.ts`
  - `GET /ciclos-escolares`
  - `POST /ciclos-escolares`
  - `PUT /ciclos-escolares/:id_ciclo`
  - `DELETE /ciclos-escolares/:id_ciclo`
- `conceptos.ts`
  - `GET /conceptos`
  - `POST /conceptos`
  - `PUT /conceptos/:clave`
  - `DELETE /conceptos/:clave`
- `metodo-pago.ts`
  - `GET /metodos-pago`
  - `POST /metodos-pago`
  - `PUT /metodos-pago/:id_metodo`
  - `DELETE /metodos-pago/:id_metodo`
- `observaciones.ts`
  - `GET /observaciones`
  - `POST /observaciones`
  - `PUT /observaciones/:id_observacion`
  - `DELETE /observaciones/:id_observacion`
  - `GET /tipos-observacion`
- `roles.ts`
  - `GET /roles`
  - `POST /roles`
  - `PUT /roles/:id_rol`
  - `DELETE /roles/:id_rol`
- `usuarios.ts`
  - `GET /usuarios`
  - `POST /usuarios`
  - `PUT /usuarios/:id_usuario`
  - `DELETE /usuarios/:id_usuario`
- `admin-usuarios.ts`
  - `GET /admin/usuarios` con fallback a `/usuarios`
  - `POST /admin/usuarios` con fallback a `/usuarios`
  - `PUT /admin/usuarios/:id_usuario` con fallback a `/usuarios/:id_usuario`
  - `GET /admin/roles` con fallback a `/roles`
  - `GET /admin/carreras` con fallback a `/carreras`

## 10. Interceptores y comportamiento HTTP real

El cliente Axios implementa:

- `baseURL` desde `VITE_API_URL`.
- Header `Authorization: Bearer <token>` cuando existe token.
- Header `x-user-id`.
- Header `x-user-carrera`.
- Limpieza de sesion y redireccion a `/login` en respuestas `401`, salvo durante el login.

## 11. Integraciones externas confirmadas

Google:

- Se utiliza Google Identity Services cargado por script externo.
- El token recibido se envia al backend por `POST /auth/google`.

Microsoft:

- Se utiliza `@azure/msal-browser` con popup y PKCE para una SPA.
- El `idToken` recibido se envia al backend por `POST /auth/microsoft`.

Nota de consistencia:

- Se ha verificado la consistencia de las variables de entorno para MSAL en `.env.example`, `README.md`, `.env` y `src/services/msal.ts` utilizando de manera uniforme `VITE_MSAL_CLIENT_ID` y `VITE_MSAL_TENANT_ID`, evitando fallos de configuración.

## 12. Modulos funcionales confirmados

- Inicio y navegacion por modulos.
- Gestion de alumnos.
- Dashboard operativo de alumnos.
- Analitica con graficas.
- Gestion de cuentas por cobrar.
- Catalogos de carreras, ciclos escolares, conceptos y metodos de pago.
- Observaciones por alumno.
- Roles.
- Administracion centralizada de usuarios y accesos.
- Registro local y acceso SSO.

## 13. Lo que este repositorio no confirma

Esta documentacion corregida no afirma como hecho lo siguiente, porque no esta implementado ni visible en este repo:

- Backend Fastify dentro del mismo proyecto.
- Endpoint `/health` implementado aqui.
- Estructura real del servidor o controladores backend.
- Modelo entidad relacion completo de PostgreSQL.
- Tablas garantizadas como `rol_permisos`, `usuario_permisos`, `usuarios_identidades` o `bitacora_auditoria`.
- Reglas backend de autorizacion mas alla de lo que el frontend espera consumir.

## 14. Evidencia adicional encontrada

- Existe `test-db.cjs`, que prueba conexion directa a PostgreSQL desde un script auxiliar, pero eso no equivale a un backend documentado dentro de este repo.
- Existe `test-hash.cjs`, que es un script auxiliar ajeno a la arquitectura principal del frontend.

## 15. Verificacion tecnica

El estado actual del frontend fue validado con:

- Revision de `package.json`.
- Revision de rutas, servicios, store y vistas principales.
- Compilacion exitosa con `npm run build`.

## 16. Conclusion corregida

La afirmacion correcta sobre este proyecto es la siguiente:

SGCF, en este repositorio, es un frontend SPA construido con Vue 3, TypeScript y Vite. El proyecto si contiene autenticacion local y federada, permisos en cliente, rutas protegidas, modulos de operacion academico-financiera y una capa de servicios HTTP preparada para consumir una API externa. Sin embargo, este repositorio no contiene evidencia suficiente para documentar como hecho una implementacion concreta del backend, sus diagramas internos o su modelo completo de base de datos. Cualquier documentacion de backend o BD debe marcarse como externa, esperada o pendiente de validacion.
'@

Set-Content -LiteralPath $OutputPath -Value $content -Encoding UTF8
