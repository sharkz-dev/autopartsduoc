import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay token en el localStorage al iniciar
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Obtener información del usuario actual
          const response = await authService.getCurrentUser();
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Error al verificar la autenticación:', error);
        logout(); // Limpiar token si hay un error
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Función de inicio de sesión
  const login = async (credentials) => {
  setLoading(true);
  setError(null);
  try {
    const response = await authService.login(credentials);
    const { token, user } = response.data;
    
    // Guardar token y datos de usuario en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Log para verificar que el token se está guardando
    console.log('Token guardado:', token);
    
    setUser(user);
    toast.success('Inicio de sesión exitoso');
    return user;
  } catch (error) {
    const message = error.response?.data?.error || 'Error al iniciar sesión';
    setError(message);
    toast.error(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

  // Función de registro
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      const { token, user } = response.data;
      
      // Guardar token y datos de usuario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast.success('Registro exitoso');
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al registrarse';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de cierre de sesión
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setUser(null);
    toast.success('Sesión cerrada correctamente');
  };

  // Función para actualizar datos del perfil
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data.data;
      
      // Actualizar usuario en localStorage y estado
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const mergedUser = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      
      setUser(mergedUser);
      toast.success('Perfil actualizado correctamente');
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar el perfil';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar contraseña
  const updatePassword = async (passwords) => {
    setLoading(true);
    setError(null);
    try {
      await authService.updatePassword(passwords);
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar la contraseña';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Valor que se provee al contexto
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    hasRole,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};