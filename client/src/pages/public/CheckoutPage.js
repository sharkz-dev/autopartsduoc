import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api';
import { getProductImageUrl } from '../../utils/imageHelpers';
import api from '../../services/api';
import ShipmentMethodSelector from '../../components/checkout/ShipmentMethodSelector';
import ShippingAddressForm from '../../components/checkout/ShippingAddressForm';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';
import axios from 'axios';
import toast from 'react-hot-toast';

// Ubicaciones de retiro en tienda (simuladas)
const PICKUP_LOCATIONS = [
  {
    id: 1,
    name: 'Tienda Central - Santiago',
    address: 'Av. Providencia 1234, Providencia, Santiago',
    hours: 'Lunes a Viernes: 9:00 - 18:30, Sábado: 9:00 - 14:00'
  },
  {
    id: 2,
    name: 'Sucursal Sur - Santiago',
    address: 'Gran Avenida 5678, La Cisterna, Santiago',
    hours: 'Lunes a Viernes: 9:00 - 18:00, Sábado: 9:00 - 13:00'
  },
  {
    id: 3,
    name: 'Sucursal Viña del Mar',
    address: 'Av. Libertad 980, Viña del Mar',
    hours: 'Lunes a Viernes: 9:30 - 18:30, Sábado: 10:00 - 14:00'
  }
];

const CheckoutPage = () => {
  const { cartItems, taxRate, getSubtotal, getTaxAmount, getShippingAmount, getFinalTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Estados del formulario
  const [shipmentMethod, setShipmentMethod] = useState('delivery');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Chile',
    notes: ''
  });
  const [pickupLocation, setPickupLocation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('webpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ NUEVO: Estado para forzar re-render del resumen
  const [summaryKey, setSummaryKey] = useState(0);
  
  // Cargar dirección guardada del usuario
  useEffect(() => {
    if (user && user.address) {
      setShippingAddress({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        postalCode: user.address.postalCode || '',
        country: user.address.country || 'Chile',
        notes: ''
      });
    }
  }, [user]);
  
  // Si no hay items en el carrito, redirigir al carrito
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);
  
  // Cuando cambia el método de envío, actualizar método de pago si es necesario
  useEffect(() => {
    if (shipmentMethod === 'delivery' && paymentMethod === 'cash') {
      setPaymentMethod('webpay');
    }
    // ✅ NUEVO: Limpiar pickupLocation cuando se cambia a delivery
    if (shipmentMethod === 'delivery') {
      setPickupLocation(null);
      setSummaryKey(prev => prev + 1); // Forzar actualización del resumen
    }
  }, [shipmentMethod, paymentMethod]);
  
  // ✅ NUEVO: Efecto para actualizar resumen cuando cambia pickupLocation
  useEffect(() => {
    setSummaryKey(prev => prev + 1); // Forzar re-render del resumen
  }, [pickupLocation]);
  
  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  // ✅ NUEVO: Callback para manejar cambio de ubicación de retiro
  const handlePickupLocationChange = (selectedLocation) => {
    setPickupLocation(selectedLocation);
    setError(''); // Limpiar errores previos
  };
  
  // ✅ SIMPLIFICADO: Validar formulario antes de enviar
  const validateForm = () => {

    
    // Validar método de envío
    if (shipmentMethod === 'delivery') {
      // Validar dirección para delivery
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
        setError('Por favor, complete todos los campos de la dirección de envío');
        return false;
      }
      
    } else if (shipmentMethod === 'pickup') {
      // ✅ SIMPLIFICADO: Solo verificar que pickupLocation esté establecido
      if (!pickupLocation) {
        setError('Por favor, seleccione una tienda para retiro');
        return false;
      }
      
    }
    
    
    return true;
  };
  
  // ✅ SIMPLIFICADO: Enviar pedido
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    
    
    if (!validateForm()) {
      
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Preparar datos de la orden
      const orderData = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity
        })),
        shipmentMethod,
        paymentMethod,
        itemsPrice: getSubtotal(),
        taxPrice: getTaxAmount(),
        shippingPrice: getShippingAmount(),
        totalPrice: getFinalTotal()
      };
      
      
      // Añadir datos según el método de envío
      if (shipmentMethod === 'delivery') {
        orderData.shippingAddress = shippingAddress;
     
      } else if (shipmentMethod === 'pickup') {
        // SIMPLIFICADO: Usar pickupLocation directamente
        if (!pickupLocation) {
          throw new Error('No se ha seleccionado una ubicación de retiro');
        }
        
        orderData.pickupLocation = {
          name: pickupLocation.name,
          address: pickupLocation.address,
          notes: pickupLocation.notes || ''
        };
        
        
      }
      
    
      
      // Crear la orden usando el servicio importado
      const response = await orderService.createOrder(orderData);
      const order = response.data.data;
      

      
      // Manejar según el método de pago
      if (paymentMethod === 'webpay') {
        
        try {
          const transactionResponse = await api.post(`/payment/create-transaction/${order._id}`);
          const transactionData = transactionResponse.data.data;
          
 
          
          localStorage.setItem('currentOrderId', order._id);
          window.location.href = `${transactionData.url}?token_ws=${transactionData.token}`;
        } catch (webpayError) {
          throw new Error('Error al procesar el pago con Webpay');
        }
      } else {
      
        clearCart();
        navigate(`/order-confirmation/${order._id}`);
      }
    } catch (err) {

      let errorMessage = 'Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    
    }
  };
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmitOrder}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Columna izquierda: formulario */}
          <div className="lg:col-span-8">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
              <div className="p-6">
                {/* ✅ ACTUALIZADO: Selector de método de envío con callback */}
                <ShipmentMethodSelector 
                  selectedMethod={shipmentMethod}
                  setSelectedMethod={setShipmentMethod}
                  pickupLocations={PICKUP_LOCATIONS}
                  onPickupLocationChange={handlePickupLocationChange}
                />
                
                {/* Formulario de dirección (solo para delivery) */}
                <ShippingAddressForm 
                  shippingAddress={shippingAddress}
                  setShippingAddress={setShippingAddress}
                  hidden={shipmentMethod !== 'delivery'}
                />
                
                {/* Selector de método de pago */}
                <PaymentMethodSelector 
                  selectedMethod={paymentMethod}
                  setSelectedMethod={setPaymentMethod}
                  shipmentMethod={shipmentMethod}
                />
              </div>
            </div>
            
            {/* Resumen del carrito */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Resumen del Pedido</h2>
              </div>
              
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item._id} className="py-3 flex justify-between">
                      <div className="flex items-center">
                        {item.images && item.images.length > 0 ? (
                          <img 
                            src={getProductImageUrl(item)}
                            alt={item.name}
                            className="h-16 w-16 object-cover rounded mr-4"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150";
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded mr-4 flex items-center justify-center text-gray-500">
                            Sin imagen
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Columna derecha: resumen */}
          <div className="lg:col-span-4">
            {/* ✅ NUEVO: Key para forzar re-render cuando cambie la ubicación */}
            <div key={summaryKey} className="bg-white shadow-sm rounded-lg overflow-hidden mb-6 sticky top-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Resumen de compra</h2>
              </div>
              
              <div className="px-6 py-4">
                {/* Detalles de costos */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(getSubtotal())}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Impuestos ({taxRate}%)</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(getTaxAmount())}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Envío</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getShippingAmount() === 0 ? 'Gratis' : formatCurrency(getShippingAmount())}
                    </p>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-base font-medium text-gray-900">Total</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(getFinalTotal())}</p>
                    </div>
                  </div>
                </div>
                
                {/* ✅ ACTUALIZADO: Método de envío seleccionado */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Método de envío seleccionado</h3>
                  <p className="text-sm text-gray-600">
                    {shipmentMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
                  </p>
                  
                  {/* ✅ MEJORADO: Mostrar información de pickup location */}
                  {shipmentMethod === 'pickup' && (
                    <div className="mt-2">
                      {pickupLocation ? (
                        <div className="text-sm">
                          <p className="font-medium text-green-700">✅ Tienda seleccionada:</p>
                          <p className="text-gray-700">{pickupLocation.name}</p>
                          <p className="text-gray-500 text-xs">{pickupLocation.address}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600">⚠️ Selecciona una tienda arriba</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Método de pago seleccionado */}
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Método de pago seleccionado</h3>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === 'webpay' && 'WebPay'}
                    {paymentMethod === 'bankTransfer' && 'Transferencia Bancaria'}
                    {paymentMethod === 'cash' && 'Efectivo (al retirar)'}
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || (shipmentMethod === 'pickup' && !pickupLocation)}
                  className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                    loading || (shipmentMethod === 'pickup' && !pickupLocation)
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : shipmentMethod === 'pickup' && !pickupLocation ? (
                    'Selecciona una tienda primero'
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>
                
                <Link to="/cart" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-500">
                  Volver al carrito
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;