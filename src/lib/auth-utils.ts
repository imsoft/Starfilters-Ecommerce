import { verifyJWT } from './auth';
import { isUserAdmin } from './database';
import type { AuthUser } from './auth';

// Función para obtener el usuario autenticado desde las cookies
export const getAuthenticatedUser = (cookies: any): AuthUser | null => {
  try {
    const token = cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    return verifyJWT(token);
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = (cookies: any): boolean => {
  return getAuthenticatedUser(cookies) !== null;
};

// Función para redirigir a login si no está autenticado
export const requireAuth = (cookies: any, redirectTo?: string): AuthUser | null => {
  const user = getAuthenticatedUser(cookies);
  
  if (!user) {
    const loginUrl = redirectTo 
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/login';
    
    // En Astro, esto se maneja en el componente
    return null;
  }
  
  return user;
};

// Función para cerrar sesión (limpiar cookie)
export const logout = (cookies: any) => {
  cookies.delete('auth-token', { path: '/' });
};

// Función para verificar si el usuario es admin (sincrónica - solo para verificación básica)
export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.status === 'active' && user?.emailVerified === true;
};

// Función para verificar si el usuario es admin (asíncrona - verificación completa en BD)
export const isAdminAsync = async (user: AuthUser | null): Promise<boolean> => {
  if (!user) return false;
  return await isUserAdmin(user.id);
};

// Función para middleware de autenticación de administrador
export const requireAdmin = async (cookies: any): Promise<{ redirect: string | null; user: AuthUser | null; isAdmin: boolean }> => {
  const user = getAuthenticatedUser(cookies);
  
  if (!user) {
    return {
      redirect: '/login',
      user: null,
      isAdmin: false
    };
  }
  
  const adminCheck = await isAdminAsync(user);
  
  if (!adminCheck) {
    return {
      redirect: '/profile',
      user,
      isAdmin: false
    };
  }
  
  return {
    redirect: null,
    user,
    isAdmin: true
  };
};

// Función para middleware de autenticación en páginas protegidas
export const authMiddleware = (cookies: any, redirectTo?: string) => {
  const user = getAuthenticatedUser(cookies);
  
  if (!user) {
    const loginUrl = redirectTo 
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/login';
    
    return {
      redirect: loginUrl,
      user: null
    };
  }
  
  return {
    redirect: null,
    user
  };
};
