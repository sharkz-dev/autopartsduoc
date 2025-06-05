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
          // Configurar el token en el servicio antes de hacer la llamada
          authService.setAuthToken(token);
          
          // Obtener información del usuario actual
          const response = await authService.getCurrentUser();
          
          // Actualizar tanto el estado como localStorage
          const userData = response.data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
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
      
      // Guardar token y configurarlo inmediatamente
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      // Guardar datos de usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast.success('Inicio de sesión exitoso');
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      console.error('Error en login:', message);
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
      
      // Guardar token y configurarlo inmediatamente
      localStorage.setItem('token', token);
      authService.setAuthToken(token);
      
      // Guardar datos de usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast.success('Registro exitoso');
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al registrarse';
      console.error('Error en registro:', message);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de cierre de sesión
  const logout = () => {
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

  // Función para actualizar datos del perfil
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data.data;
      
      // Mantener datos existentes y actualizar solo los nuevos
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const mergedUser = { ...currentUser, ...updatedUser };
      
      // Actualizar localStorage y estado
      localStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);
      
      toast.success('Perfil actualizado correctamente');
      return mergedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar el perfil';
      console.error('Error al actualizar perfil:', message);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refrescar datos del usuario desde el servidor
  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const updatedUser = response.data.data;
      
      // Actualizar usuario en localStorage y estado
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error al refrescar datos del usuario:', error);
      const message = error.response?.data?.error || 'Error al obtener datos actualizados';
      
      // Si es error 401, hacer logout
      if (error.response?.status === 401) {
        logout();
        return;
      }
      
      toast.error(message);
      throw error;
    }
  };

  // Actualizar solo el campo del logo (para actualización inmediata)
  const updateUserLogo = (companyLogo) => {
    const updatedUser = { ...user, companyLogo };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
      console.error('Error al actualizar contraseña:', message);
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

  // Función para obtener el tipo de carrito automático según el rol
  const getCartType = () => {
    if (!user) return 'B2C';
    return user.role === 'distributor' ? 'B2B' : 'B2C';
  };

  // Función para verificar si puede acceder a precios mayoristas
  const canAccessWholesalePrices = () => {
    return user && user.role === 'distributor' && user.distributorInfo?.isApproved === true;
  };

  // Función para verificar si es distribuidor
  const isDistributor = () => {
    return user && user.role === 'distributor';
  };

  // Función para verificar si es distribuidor aprobado
  const isApprovedDistributor = () => {
    return user && user.role === 'distributor' && user.distributorInfo?.isApproved === true;
  };

  // Función para obtener datos del usuario de forma síncrona
  const getUserData = () => {
    return user || JSON.parse(localStorage.getItem('user') || 'null');
  };

  // Función para verificar si está autenticado
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = getUserData();
    return !!(token && userData);
  };

  // Función para obtener el nombre del rol formateado
  const getRoleDisplayName = () => {
    if (!user) return '';
    
    const roleNames = {
      'client': 'Cliente',
      'distributor': 'Distribuidor',
      'admin': 'Administrador'
    };
    
    return roleNames[user.role] || user.role;
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
    refreshUser,
    updateUserLogo,
    hasRole,
    getUserData,
    isAuthenticated: isAuthenticated(),
    // Funciones específicas para distribuidores
    getCartType,
    canAccessWholesalePrices,
    isDistributor,
    isApprovedDistributor,
    getRoleDisplayName
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};