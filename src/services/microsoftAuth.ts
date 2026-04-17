// src/services/microsoftAuth.ts
import axios, { AxiosError } from 'axios';

/**
 * Interfaz para la respuesta exitosa de Microsoft OAuth 2.0
 */
export interface MicrosoftTokenResponse {
  token_type: 'Bearer';
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  id_token?: string;
  refresh_token?:string;
  scope: string;
}

/**
 * Interfaz para errores de Microsoft OAuth 2.0
 */
export interface MicrosoftAuthError {
  error: string;
  error_description: string;
  error_codes?: number[];
  timestamp?: string;
  trace_id?: string;
  correlation_id?: string;
}

/**
 * Implementación del flujo de Credenciales de Contraseña del Propietario del Recurso (ROPC)
 * para inicio de sesión de Microsoft.
 * 
 * @param tenant El ID del inquilino (GUID) o 'organizations'. No usar 'common' ni 'consumers'.
 * @param clientId El ID de la aplicación registrado en Azure.
 * @param username Correo electrónico del usuario.
 * @param password Contraseña del usuario.
 * @param scope Ámbitos solicitados (ej. 'openid profile offline_access').
 * @param clientSecret Secreto del cliente (solo para aplicaciones confidenciales).
 * @returns Promesa con los tokens de acceso.
 */
export async function loginWithMicrosoftROPC(
  tenant: string,
  clientId: string,
  username: string,
  password: string,
  scope: string = 'openid profile offline_access',
  clientSecret?: string
): Promise<MicrosoftTokenResponse> {
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  // Construcción del payload en formato x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);
  params.append('scope', scope);
  
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }

  try {
    const response = await axios.post<MicrosoftTokenResponse>(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<MicrosoftAuthError>;
      if (axiosError.response?.data) {
        const { error: errorCode, error_description } = axiosError.response.data;
        
        // Manejo específico de errores según requerimiento
        if (errorCode === 'invalid_grant') {
          throw new Error(`Error de autenticación (invalid_grant): ${error_description}`);
        } else if (errorCode === 'invalid_request') {
          throw new Error(`Solicitud mal formada (invalid_request): ${error_description}`);
        }
        
        throw new Error(`Error de Microsoft (${errorCode}): ${error_description}`);
      }
    }
    throw error;
  } finally {
    // SEGURIDAD ESTRICTA: Limpieza inmediata de credenciales en memoria local
    // Nota: JavaScript no permite "borrar" variables string de forma garantizada (son inmutables),
    // pero al salir del scope de la función y no guardar estas variables en ningún estado global
    // o persistente, el recolector de basura (GC) las procesará.
    
    // NO GUARDAR LA CONTRASEÑA BAJO NINGUNA CIRCUNSTANCIA
    password = ''; // Intento de sobreescritura (aunque las strings sean inmutables)
    username = '';
    console.debug('[Security] Credenciales de usuario descartadas de la memoria local.');
  }
}
