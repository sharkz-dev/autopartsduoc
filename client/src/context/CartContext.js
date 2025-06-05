import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { publicSystemConfigService } from '../services/systemConfig.service';
import toast from 'react-hot-toast';

const CartContext = createContext();

// Estados iniciales
const initialState = {
  cartItems: [],
  cartType: 'B2C',
  taxRate: 19,
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
  const { user, getCartType, canAccessWholesalePrices } = useAuth();

  // Efecto para actualizar automáticamente el tipo de carrito
  useEffect(() => {
    if (user) {
      const userCartType = getCartType();
      
      dispatch({
        type: CART_ACTIONS.SET_CART_TYPE,
        payload: userCartType
      });
    } else {
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

    if (user !== undefined) {
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
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }, [state.cartItems]);

  // Función para calcular precio final considerando descuentos y tipo de usuario
  const calculateFinalPrice = (item) => {
    const hasWholesaleAccess = canAccessWholesalePrices();
    
    // Determinar precio base según el tipo de usuario
    let basePrice = item.price; // Precio minorista por defecto
    
    if (state.cartType === 'B2B' && hasWholesaleAccess && item.wholesalePrice) {
      basePrice = item.wholesalePrice; // Usar precio mayorista
    }
    
    // Aplicar descuento si el producto está en oferta
    if (item.onSale && item.discountPercentage > 0) {
      // Aplicar descuento al precio base correcto (mayorista o minorista)
      const discountedPrice = Math.round(basePrice * (1 - item.discountPercentage / 100));
      return discountedPrice;
    }
    
    return basePrice;
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

  const toggleCartType = () => {
    const currentType = state.cartType === 'B2C' ? 'Cliente' : 'Mayorista';
    toast.info(`Modo ${currentType} - Automático según tu tipo de cuenta`);
  };

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

  // Cálculos usando precio final con descuentos
  const getSubtotal = () => {
    const subtotal = state.cartItems.reduce((total, item) => {
      const finalPrice = calculateFinalPrice(item);
      const itemTotal = finalPrice * item.quantity;
      return total + itemTotal;
    }, 0);
    
    return subtotal;
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    const taxAmount = Math.round(subtotal * (state.taxRate / 100));
    return taxAmount;
  };

  const getShippingAmount = () => {
    const subtotal = getSubtotal();
    const shippingAmount = subtotal >= 100000 ? 0 : 5000;
    return shippingAmount;
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const tax = getTaxAmount();
    const shipping = getShippingAmount();
    const total = subtotal + tax + shipping;
    
    return total;
  };

  const getCartCount = () => {
    return state.cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Función de información de precios completa
  const getPriceInfo = (item) => {
    const hasWholesaleAccess = canAccessWholesalePrices();
    const isUsingWholesalePrice = state.cartType === 'B2B' && hasWholesaleAccess && item.wholesalePrice;
    
    // Precio base según el tipo de usuario
    const basePrice = isUsingWholesalePrice ? item.wholesalePrice : item.price;
    
    // Precio final con descuentos aplicados
    const finalPrice = calculateFinalPrice(item);
    
    // Verificar si está en oferta
    const isOnSale = item.onSale && item.discountPercentage > 0;
    
    // Calcular ahorros
    let savings = 0;
    
    if (isOnSale) {
      // Ahorro por descuento
      savings = basePrice - finalPrice;
    } else if (isUsingWholesalePrice) {
      // Ahorro por precio mayorista vs minorista
      savings = item.price - item.wholesalePrice;
    }
    
    return {
      basePrice,
      finalPrice,
      originalPrice: item.price,
      wholesalePrice: item.wholesalePrice,
      isUsingWholesalePrice,
      isOnSale,
      discountPercentage: item.discountPercentage,
      savings,
      hasWholesaleAccess
    };
  };

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
      isAutomatic: true
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
    toggleCartType,
    refreshTaxRate,
    
    // Cálculos
    getSubtotal,
    getTaxAmount,
    getShippingAmount,
    getFinalTotal,
    getCartSummary,
    getCartCount,
    getPriceInfo,
    calculateFinalPrice, // Exponer función de cálculo
    
    // Propiedades informativas
    isCartTypeAutomatic: true,
    canAccessWholesalePrices: canAccessWholesalePrices()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;