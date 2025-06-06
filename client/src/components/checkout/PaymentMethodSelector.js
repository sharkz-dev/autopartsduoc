import React from 'react';
import { CreditCardIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

const PaymentMethodSelector = ({ selectedMethod, setSelectedMethod, shipmentMethod }) => {
  // Si el método de envío es retiro en tienda, permitir pago en efectivo
  const showCashOption = shipmentMethod === 'pickup';
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Método de Pago</h2>
      
      <div className="space-y-4">
        {/* Opción de Webpay (Transbank) */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'webpay' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('webpay')}
        >
          <div className="flex items-center">
            <div className="flex items-center h-5">
              <input
                id="webpay"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === 'webpay'}
                onChange={() => setSelectedMethod('webpay')}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
            </div>
            <div className="ml-3 flex items-center">
              <CreditCardIcon className="h-6 w-6 text-blue-500 mr-2" />
              <div>
                <label htmlFor="webpay" className="font-medium text-gray-700">
                  Webpay Plus
                </label>
                <p className="text-gray-500 text-sm">
                  Paga con tarjeta de crédito o débito a través de Transbank
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <img 
                src="/images/webpay-logo.png" 
                alt="Webpay" 
                className="h-8"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="flex space-x-1">
                {/* Logos de tarjetas aceptadas */}
                <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-gradient-to-r from-red-600 to-red-700 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
              </div>
            </div>
          </div>
          
          {selectedMethod === 'webpay' && (
            <div className="mt-3 ml-7 p-3 bg-blue-50 rounded-md text-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Información de pago:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Acepta tarjetas de crédito y débito</li>
                <li>• Pago seguro con tecnología Transbank</li>
                <li>• Serás redirigido al portal de pago seguro</li>
                <li>• Compatible con 3D Secure</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Opción de Transferencia Bancaria */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'bankTransfer' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('bankTransfer')}
        >
          <div className="flex items-center">
            <div className="flex items-center h-5">
              <input
                id="bankTransfer"
                name="paymentMethod"
                type="radio"
                checked={selectedMethod === 'bankTransfer'}
                onChange={() => setSelectedMethod('bankTransfer')}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
            </div>
            <div className="ml-3 flex items-center">
              <BuildingLibraryIcon className="h-6 w-6 text-green-500 mr-2" />
              <div>
                <label htmlFor="bankTransfer" className="font-medium text-gray-700">
                  Transferencia Bancaria
                </label>
                <p className="text-gray-500 text-sm">
                  Realiza una transferencia electrónica
                </p>
              </div>
            </div>
          </div>
          
          {selectedMethod === 'bankTransfer' && (
            <div className="mt-3 ml-7 p-3 bg-gray-50 rounded-md text-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Datos para transferencia:</h4>
              <p className="mb-1"><span className="font-medium">Banco:</span> Banco Estado</p>
              <p className="mb-1"><span className="font-medium">Titular:</span> AutoParts SpA</p>
              <p className="mb-1"><span className="font-medium">RUT:</span> 76.XXX.XXX-X</p>
              <p className="mb-1"><span className="font-medium">Cuenta Corriente:</span> 123456789</p>
              <p className="mb-1"><span className="font-medium">Email:</span> pagos@AutoParts.com</p>
              <p className="text-red-600 mt-2 text-xs">
                * El pedido se procesará una vez confirmado el pago
              </p>
            </div>
          )}
        </div>
        
        {/* Opción de Pago en Efectivo (solo para retiro en tienda) */}
        {showCashOption && (
          <div 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedMethod === 'cash' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => setSelectedMethod('cash')}
          >
            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  id="cash"
                  name="paymentMethod"
                  type="radio"
                  checked={selectedMethod === 'cash'}
                  onChange={() => setSelectedMethod('cash')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
              </div>
              <div className="ml-3 flex items-center">
                <BanknotesIcon className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <label htmlFor="cash" className="font-medium text-gray-700">
                    Pago en Efectivo (sólo para retiro en tienda)
                  </label>
                  <p className="text-gray-500 text-sm">
                    Paga al momento de retirar tu pedido
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;