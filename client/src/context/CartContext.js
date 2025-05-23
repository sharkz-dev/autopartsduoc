import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartType, setCartType] = useState('B2C'); // B2C o B2B

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCartType = localStorage.getItem('cartType');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    if (savedCartType) {
      setCartType(savedCartType);
    }
  }, []);

  // Calcular el precio correcto según tipo de carrito y si hay oferta
  const calculateProductPrice = (product) => {
    // Determinar precio base según tipo de cliente
    const basePrice = cartType === 'B2B' && product.wholesalePrice 
      ? product.wholesalePrice 
      : product.price;
    
    // Verificar si hay oferta válida
    const isOnSale = product.onSale && product.discountPercentage > 0;
    
    if (!isOnSale) {
      return basePrice;
    }
    
    // Calcular precio con descuento según tipo de cliente
    if (cartType === 'B2B' && product.wholesalePrice) {
      // Para B2B: Aplicar descuento al precio mayorista
      const discountAmount = product.wholesalePrice * (product.discountPercentage / 100);
      return Math.round(product.wholesalePrice - discountAmount);
    } else {
      // Para B2C: Usar precio de oferta guardado o calcularlo
      return product.salePrice || Math.round(product.price - (product.price * (product.discountPercentage / 100)));
    }
  };

  // Actualizar total y contador cuando cambian los items
  useEffect(() => {
    // Calcular número total de productos
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setCartCount(itemCount);
    
    // Calcular precio total
    const total = cartItems.reduce((sum, item) => {
      // Usar el precio calculado (con oferta si aplica)
      const price = calculateProductPrice(item);
      return sum + (price * item.quantity);
    }, 0);
    setCartTotal(total);
    
    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems, cartType]);

  // Guardar el tipo de carrito cuando cambia
  useEffect(() => {
    localStorage.setItem('cartType', cartType);
  }, [cartType]);

  // Cambiar entre vista B2B y B2C
  const toggleCartType = (type) => {
    setCartType(type);
    
    // Cuando cambia el tipo, debemos recalcular los precios de los productos en el carrito
    // Si hay productos en oferta, sus precios cambiarán según el tipo de carrito
  };

  // Añadir producto al carrito
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevItems.findIndex(item => item._id === product._id);
      
      if (existingItemIndex >= 0) {
        // Si ya existe, actualizar cantidad
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
        
        // Verificar stock
        if (newQuantity > product.stockQuantity) {
          toast.error(`Stock insuficiente. Solo hay ${product.stockQuantity} unidades disponibles.`);
          // Si excede el stock, establecer al máximo disponible
          updatedItems[existingItemIndex].quantity = product.stockQuantity;
        } else {
          updatedItems[existingItemIndex].quantity = newQuantity;
          toast.success(`${product.name} actualizado en el carrito`);
        }
        
        return updatedItems;
      } else {
        // Si no existe, agregar como nuevo item
        // Verificar stock
        if (quantity > product.stockQuantity) {
          toast.error(`Stock insuficiente. Solo hay ${product.stockQuantity} unidades disponibles.`);
          quantity = product.stockQuantity;
        }
        
        toast.success(`${product.name} agregado al carrito`);
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  // Eliminar producto del carrito
  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item._id !== productId);
      toast.success('Producto eliminado del carrito');
      return updatedItems;
    });
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productId, quantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item._id === productId) {
          // Verificar stock
          if (quantity > item.stockQuantity) {
            toast.error(`Stock insuficiente. Solo hay ${item.stockQuantity} unidades disponibles.`);
            return { ...item, quantity: item.stockQuantity };
          }
          return { ...item, quantity };
        }
        return item;
      });
      return updatedItems;
    });
  };

  // Limpiar carrito
  const clearCart = () => {
    setCartItems([]);
    toast.success('Carrito vaciado');
  };

  // Calcular subtotal (sin impuestos ni envío)
  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = calculateProductPrice(item);
      return sum + (price * item.quantity);
    }, 0);
  };

  // Calcular impuestos (por ejemplo, 19%)
  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    return subtotal * 0.19; // 19% de impuesto
  };

  // Calcular envío (por ejemplo, 5000 si el subtotal es menor a 100000)
  const getShippingAmount = () => {
    const subtotal = getSubtotal();
    return subtotal < 100000 ? 5000 : 0; // Envío gratis para compras mayores a 100000
  };

  // Calcular total final
  const getFinalTotal = () => {
    return getSubtotal() + getTaxAmount() + getShippingAmount();
  };

  // Valor que se provee al contexto
  const value = {
    cartItems,
    cartTotal,
    cartCount,
    cartType,
    toggleCartType,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTaxAmount,
    getShippingAmount,
    getFinalTotal,
    calculateProductPrice  // Exponemos esta función para usarla en otros componentes
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};