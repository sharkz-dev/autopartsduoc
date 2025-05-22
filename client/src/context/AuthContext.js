import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CORREGIDO: Verificar si hay token en el localStorage al iniciar
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔍 Verificando token existente...');
          
          // IMPORTANTE: Configurar el token en el servicio antes de hacer la llamada
          authService.setAuthToken(token);
          
          // Obtener información del usuario actual
          const response = await authService.getCurrentUser();
          console.log('✅ Usuario obtenido al inicializar:', response.data.data);
          
          // Actualizar tanto el estado como localStorage
          const userData = response.data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.log('❌ No hay token almacenado');
        }
      } catch (error) {
        console.error('❌ Error al verificar la autenticación:', error);
        logout(); // Limpiar token si hay un error
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // CORREGIDO: Función de inicio de sesión
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔐 Iniciando sesión...');
      const response = await authService.login(credentials);
      const { token, user } = response.data;
      
      // Guardar token y configurarlo inmediatamente
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      // Guardar datos de usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Login exitoso:', user);
      console.log('🔑 Token guardado:', token);
      
      setUser(user);
      toast.success('Inicio de sesión exitoso');
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      console.error('❌ Error en login:', message);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // CORREGIDO: Función de registro
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📝 Registrando usuario...');
      const response = await authService.register(userData);
      const { token, user } = response.data;
      
      // Guardar token y configurarlo inmediatamente
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      // Guardar datos de usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Registro exitoso:', user);
      
      setUser(user);
      toast.success('Registro exitoso');
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al registrarse';
      console.error('❌ Error en registro:', message);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // CORREGIDO: Función de cierre de sesión
  const logout = () => {
    console.log('👋 Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    
    // Limpiar token del servicio
    authService.removeAuthToken();
    
    // Limpiar estado
    setUser(null);
    setError(null);
    
    toast.success('Sesión cerrada correctamente');
  };

  // CORREGIDO: Función para actualizar datos del perfil
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Actualizando perfil...', userData);
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data.data;
      
      console.log('✅ Perfil actualizado desde servidor:', updatedUser);
      
      // CRÍTICO: Mantener datos existentes y actualizar solo los nuevos
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const mergedUser = { ...currentUser, ...updatedUser };
      
      // Actualizar localStorage y estado
      localStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);
      
      console.log('✅ Usuario final después de merge:', mergedUser);
      
      toast.success('Perfil actualizado correctamente');
      return mergedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar el perfil';
      console.error('❌ Error al actualizar perfil:', message);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // MEJORADO: Refrescar datos del usuario desde el servidor
  const refreshUser = async () => {
    try {
      console.log('🔄 Refrescando datos del usuario...');
      
      const response = await authService.getCurrentUser();
      const updatedUser = response.data.data;
      
      console.log('✅ Datos actualizados del servidor:', updatedUser);
      
      // Actualizar usuario en localStorage y estado
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('✅ Estado del usuario actualizado completamente');
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Error al refrescar datos del usuario:', error);
      const message = error.response?.data?.error || 'Error al obtener datos actualizados';
      
      // Si es error 401, hacer logout
      if (error.response?.status === 401) {
        console.log('🚪 Token expirado, cerrando sesión...');
        logout();
        return;
      }
      
      toast.error(message);
      throw error;
    }
  };

  // MEJORADO: Actualizar solo el campo del logo (para actualización inmediata)
  const updateUserLogo = (companyLogo) => {
    console.log('🖼️ Actualizando logo inmediatamente:', companyLogo);
    
    const updatedUser = { ...user, companyLogo };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    console.log('✅ Logo actualizado en estado local');
  };

  // Función para actualizar contraseña
  const updatePassword = async (passwords) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔐 Actualizando contraseña...');
      await authService.updatePassword(passwords);
      console.log('✅ Contraseña actualizada');
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar la contraseña';
      console.error('❌ Error al actualizar contraseña:', message);
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

  // NUEVO: Función para obtener datos del usuario de forma síncrona
  const getUserData = () => {
    return user || JSON.parse(localStorage.getItem('user') || 'null');
  };

  // NUEVO: Función para verificar si está autenticado
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = getUserData();
    return !!(token && userData);
  };

  // Log para debugging - mostrar cambios en el usuario
  useEffect(() => {
    if (user) {
      console.log('👤 Usuario en contexto actualizado:', {
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        companyLogo: user.companyLogo,
        hasLogo: !!user.companyLogo
      });
    }
  }, [user]);

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
    refreshUser,
    updateUserLogo,
    hasRole,
    getUserData,
    isAuthenticated: isAuthenticated()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};