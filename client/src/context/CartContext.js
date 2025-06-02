import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { publicSystemConfigService } from '../services/systemConfig.service';
import toast from 'react-hot-toast';

const CartContext = createContext();

// Estados iniciales
const initialState = {
  cartItems: [],
  cartType: 'B2C', // 'B2C' (cliente final) o 'B2B' (mayorista)
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
      const newType = action.payload;
      toast.success(`Modo cambiado a ${newType === 'B2B' ? 'Mayorista' : 'Cliente final'}`);
      return {
        ...state,
        cartType: newType
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

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        const savedCartType = localStorage.getItem('cartType');
        
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          dispatch({
            type: CART_ACTIONS.LOAD_CART,
            payload: {
              cartItems: cartData,
              cartType: savedCartType || 'B2C'
            }
          });
        }
      } catch (error) {
        console.error('Error al cargar carrito desde localStorage:', error);
      }
    };

    loadCartFromStorage();
  }, []);

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
      localStorage.setItem('cartType', state.cartType);
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }, [state.cartItems, state.cartType]);

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

  const setCartType = (type) => {
    dispatch({
      type: CART_ACTIONS.SET_CART_TYPE,
      payload: type
    });
  };

  // ✅ NUEVA FUNCIÓN: toggleCartType que faltaba
  const toggleCartType = (newType) => {
    if (newType && newType !== state.cartType) {
      setCartType(newType);
    } else {
      // Si no se especifica tipo, alternar entre B2C y B2B
      const toggledType = state.cartType === 'B2C' ? 'B2B' : 'B2C';
      setCartType(toggledType);
    }
  };

  // Cálculos mejorados con IVA dinámico
  const getSubtotal = () => {
    return state.cartItems.reduce((total, item) => {
      const price = state.cartType === 'B2B' && item.wholesalePrice 
        ? item.wholesalePrice 
        : item.price;
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

  // ✅ NUEVA FUNCIÓN: Calcular cantidad total de items en el carrito
  const getCartCount = () => {
    return state.cartItems.reduce((total, item) => total + item.quantity, 0);
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
      totalQuantity
    };
  };

  const value = {
    // Estado
    cartItems: state.cartItems,
    cartType: state.cartType,
    taxRate: state.taxRate,
    isLoading: state.isLoading,
    
    // ✅ AGREGADO: Cantidad total para el badge del carrito
    cartCount: getCartCount(),
    
    // Funciones
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCartType,
    toggleCartType, // ✅ AGREGADO: Función que faltaba
    refreshTaxRate,
    
    // Cálculos
    getSubtotal,
    getTaxAmount,
    getShippingAmount,
    getFinalTotal,
    getCartSummary,
    getCartCount // ✅ AGREGADO: Para acceso directo al conteo
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