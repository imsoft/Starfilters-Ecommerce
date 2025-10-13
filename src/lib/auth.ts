import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Configuración
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_EXPIRES_IN = '7d';

// Interfaces
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  emailVerified: boolean;
}

// Funciones de hash y verificación de contraseñas
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Funciones de tokens
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateJWT = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      emailVerified: user.emailVerified
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyJWT = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      status: decoded.status,
      emailVerified: decoded.emailVerified
    };
  } catch (error) {
    return null;
  }
};

// Funciones de validación
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Función para validar datos de registro
export const validateRegisterData = (data: RegisterData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar email
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Email inválido');
  }
  
  // Validar contraseña
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }
  
  // Validar nombres
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('El apellido debe tener al menos 2 caracteres');
  }
  
  // Validar teléfono si se proporciona
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Número de teléfono inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para validar datos de login
export const validateLoginData = (data: LoginData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Email inválido');
  }
  
  if (!data.password || data.password.length < 1) {
    errors.push('Contraseña requerida');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para validar cambio de contraseña
export interface ChangePasswordData {
  newPassword: string;
  confirmPassword: string;
}

export const validateChangePasswordData = (data: ChangePasswordData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.newPassword) {
    errors.push('Nueva contraseña requerida');
  } else {
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }
  
  if (!data.confirmPassword) {
    errors.push('Confirmación de contraseña requerida');
  } else if (data.newPassword !== data.confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
