# SGCF Frontend

Aplicacion frontend para el Sistema Gestor de Control Financiero (SGCF), construida con Vue 3, TypeScript y Vite.

## Requisitos

- Node.js 20+
- npm 10+

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta `VITE_API_URL` al backend local o remoto.
3. Configura SSO si deseas habilitar login federado:
   - `VITE_GOOGLE_CLIENT_ID`: Client ID OAuth 2.0 Web para Google Identity Services.
   - `VITE_MSAL_CLIENT_ID`: Application (client) ID de Azure App Registration.
   - `VITE_MSAL_TENANT_ID`: Tenant ID de Azure AD (o `common`).

## SSO y auth

- Login local se mantiene con `username + password` contra `POST /auth/login`.
- Registro local de usuario via `POST /auth/register` desde la vista `/registro`.
- El registro envia `id_rol=6` (Sin Rol), `id_carrera=null` y `activo=false`; no puede iniciar sesion hasta activacion.
- Google envía `id_token` a `POST /auth/google`.
- Microsoft (MSAL SPA + PKCE por `loginPopup`) envía `id_token` a `POST /auth/microsoft`.
- El frontend guarda unicamente el `token` entregado por backend y aplica guards por rol/estado.

## Pruebas recomendadas

1. Login local
   - Inicia sesion con usuario/password valido.
   - Verifica redireccion a `/inicio`.

1.1 Registro local
   - Ve a `/registro` y crea usuario con `username + password`.
   - Verifica que aparezca mensaje de estado pendiente/inactivo.
   - Confirma que ese usuario no puede loguearse hasta activacion admin.

2. Login Google/Microsoft
   - Configura variables SSO en `.env`.
   - Inicia sesion con los botones "Continuar con Google" y "Continuar con Microsoft".
   - Verifica manejo de errores (token invalido, usuario pendiente/inactivo).

3. Admin de usuarios y permisos
   - Entra como Administrador a `/admin/usuarios-permisos`.
   - Verifica nuevos registros en estado pendiente/inactivo.
   - Asigna rol real (`Coordinador` o `Caja`), carrera y `activo=true`.
   - Guarda cambios y valida que el usuario ya pueda loguearse.

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: validacion TypeScript y build de produccion.
- `npm run preview`: sirve el build generado.
