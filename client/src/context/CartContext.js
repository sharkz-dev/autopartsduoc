import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext'; // ✅ AGREGADO: Importar AuthContext
import { publicSystemConfigService } from '../services/systemConfig.service';
import toast from 'react-hot-toast';

const CartContext = createContext();

// Estados iniciales
const initialState = {
  cartItems: [],
  cartType: 'B2C', // Se actualizará automáticamente según el usuario
  taxRate: 19, // Porcentaje de IVA por defecto
  isLoading: false
};

// Tipos de acciones
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART_TYPE: 'SET_CART_TYPE',
  SET_TAX_RATE: 'SET_TAX_RATE',
  SET_LOADING: 'SET_LOADING',
  LOAD_CART: 'LOAD_CART'
};

// Reducer para manejar el estado del carrito
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.cartItems.find(item => item._id === action.payload._id);
      
      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + (action.payload.quantity || 1), 
          action.payload.stockQuantity
        );
        
        if (newQuantity > existingItem.quantity) {
          toast.success(`${action.payload.name} agregado al carrito`);
        } else {
          toast.warning('Cantidad máxima en stock alcanzada');
        }
        
        return {
          ...state,
          cartItems: state.cartItems.map(item =>
            item._id === action.payload._id
              ? { ...item, quantity: newQuantity }
              : item
          )
        };
      } else {
        toast.success(`${action.payload.name} agregado al carrito`);
        return {
          ...state,
          cartItems: [...state.cartItems, { ...action.payload, quantity: action.payload.quantity || 1 }]
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM:
      const itemToRemove = state.cartItems.find(item => item._id === action.payload);
      if (itemToRemove) {
        toast.success(`${itemToRemove.name} eliminado del carrito`);
      }
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item._id !== action.payload)
      };
    
    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item._id === action.payload.id
            ? { ...item, quantity: Math.min(action.payload.quantity, item.stockQuantity) }
            : item
        )
      };
    
    case CART_ACTIONS.CLEAR_CART:
      toast.success('Carrito vaciado');
      return {
        ...state,
        cartItems: []
      };
    
    case CART_ACTIONS.SET_CART_TYPE:
      return {
        ...state,
        cartType: action.payload
      };
    
    case CART_ACTIONS.SET_TAX_RATE:
      return {
        ...state,
        taxRate: action.payload
      };
    
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        cartItems: action.payload.cartItems || [],
        cartType: action.payload.cartType || 'B2C'
      };
    
    default:
      return state;
  }
};

// Proveedor del contexto
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, getCartType, canAccessWholesalePrices } = useAuth(); // ✅ AGREGADO: Usar AuthContext

  // ✅ EFECTO PARA ACTUALIZAR AUTOMÁTICAMENTE EL TIPO DE CARRITO
  useEffect(() => {
    if (user) {
      const userCartType = getCartType();
      console.log(`🛒 Actualizando tipo de carrito automáticamente: ${userCartType} para usuario ${user.role}`);
      
      dispatch({
        type: CART_ACTIONS.SET_CART_TYPE,
        payload: userCartType
      });
    } else {
      // Si no hay usuario, usar B2C por defecto
      dispatch({
        type: CART_ACTIONS.SET_CART_TYPE,
        payload: 'B2C'
      });
    }
  }, [user, getCartType]);

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          
          // Determinar el tipo de carrito según el usuario
          const cartType = user ? getCartType() : 'B2C';
          
          dispatch({
            type: CART_ACTIONS.LOAD_CART,
            payload: {
              cartItems: cartData,
              cartType: cartType
            }
          });
        }
      } catch (error) {
        console.error('Error al cargar carrito desde localStorage:', error);
      }
    };

    // Solo cargar del localStorage si ya tenemos información del usuario
    if (user !== undefined) { // undefined significa que aún está cargando
      loadCartFromStorage();
    }
  }, [user, getCartType]);

  // Cargar porcentaje de IVA actual al inicializar
  useEffect(() => {
    const loadTaxRate = async () => {
      try {
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
        const response = await publicSystemConfigService.getTaxRate();
        
        if (response.data.success) {
          dispatch({
            type: CART_ACTIONS.SET_TAX_RATE,
            payload: response.data.data.rate
          });
        }
      } catch (error) {
        console.error('Error al cargar porcentaje de IVA:', error);
        // Mantener valor por defecto si hay error
      } finally {
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadTaxRate();
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(state.cartItems));
      // Ya no guardamos cartType en localStorage porque es automático
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }, [state.cartItems]);

  // Función para actualizar el porcentaje de IVA (para uso interno cuando cambie la configuración)
  const refreshTaxRate = async () => {
    try {
      const response = await publicSystemConfigService.getTaxRate();
      if (response.data.success) {
        dispatch({
          type: CART_ACTIONS.SET_TAX_RATE,
          payload: response.data.data.rate
        });
      }
    } catch (error) {
      console.error('Error al refrescar porcentaje de IVA:', error);
    }
  };

  // Funciones del carrito
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { ...product, quantity }
    });
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: productId
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({
        type: CART_ACTIONS.UPDATE_QUANTITY,
        payload: { id: productId, quantity }
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // ✅ FUNCIÓN MODIFICADA: Ya no permite cambio manual
  const toggleCartType = () => {
    // Mostrar mensaje informativo de que es automático
    const currentType = state.cartType === 'B2C' ? 'Cliente' : 'Mayorista';
    toast.info(`Modo ${currentType} - Automático según tu tipo de cuenta`);
  };

  // Cálculos mejorados con IVA dinámico y precios según usuario
  const getSubtotal = () => {
    return state.cartItems.reduce((total, item) => {
      // ✅ LÓGICA ACTUALIZADA: Usar precio según el tipo de usuario y permisos
      let price = item.price; // Precio por defecto (minorista)
      
      if (state.cartType === 'B2B' && canAccessWholesalePrices() && item.wholesalePrice) {
        price = item.wholesalePrice;
      }
      
      return total + (price * item.quantity);
    }, 0);
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    return Math.round(subtotal * (state.taxRate / 100));
  };

  const getShippingAmount = () => {
    const subtotal = getSubtotal();
    // Envío gratuito sobre $100,000 (esto también podría ser configurable)
    return subtotal >= 100000 ? 0 : 5000;
  };

  const getFinalTotal = () => {
    return getSubtotal() + getTaxAmount() + getShippingAmount();
  };

  // Función para calcular cantidad total de items en el carrito
  const getCartCount = () => {
    return state.cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ FUNCIÓN NUEVA: Obtener información de precios para mostrar en UI
  const getPriceInfo = (item) => {
    const hasWholesaleAccess = canAccessWholesalePrices();
    const showWholesalePrice = state.cartType === 'B2B' && hasWholesaleAccess && item.wholesalePrice;
    
    return {
      displayPrice: showWholesalePrice ? item.wholesalePrice : item.price,
      originalPrice: item.price,
      wholesalePrice: item.wholesalePrice,
      isUsingWholesalePrice: showWholesalePrice,
      hasWholesaleAccess,
      savings: showWholesalePrice ? (item.price - item.wholesalePrice) : 0
    };
  };

  // Información adicional
  const getCartSummary = () => {
    const subtotal = getSubtotal();
    const taxAmount = getTaxAmount();
    const shippingAmount = getShippingAmount();
    const total = getFinalTotal();
    const itemCount = state.cartItems.length;
    const totalQuantity = getCartCount();
    
    return {
      subtotal,
      taxAmount,
      taxRate: state.taxRate,
      taxPercentage: `${state.taxRate}%`,
      shippingAmount,
      total,
      itemCount,
      totalQuantity,
      cartType: state.cartType,
      canAccessWholesale: canAccessWholesalePrices(),
      isAutomatic: true // ✅ INDICAR QUE EL TIPO ES AUTOMÁTICO
    };
  };

  const value = {
    // Estado
    cartItems: state.cartItems,
    cartType: state.cartType,
    taxRate: state.taxRate,
    isLoading: state.isLoading,
    
    // Cantidad total para el badge del carrito
    cartCount: getCartCount(),
    
    // Funciones
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCartType, // ✅ MODIFICADA: Ya no cambia tipo, solo muestra mensaje
    refreshTaxRate,
    
    // Cálculos
    getSubtotal,
    getTaxAmount,
    getShippingAmount,
    getFinalTotal,
    getCartSummary,
    getCartCount,
    getPriceInfo, // ✅ NUEVA: Para obtener información de precios
    
    // ✅ NUEVAS PROPIEDADES INFORMATIVAS
    isCartTypeAutomatic: true,
    canAccessWholesalePrices: canAccessWholesalePrices()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;