import React from 'react';
import { 
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ShoppingBagIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolid
} from '@heroicons/react/24/solid';

const OrderStatusTracker = ({ currentStatus, shipmentMethod = 'delivery', createdAt, paidAt, deliveredAt }) => {
  // Definir los pasos según el método de envío
  const getSteps = () => {
    const baseSteps = [
      {
        id: 'pending',
        title: 'Pedido Recibido',
        description: 'Tu pedido ha sido recibido y confirmado',
        icon: CheckCircleIcon
      },
      {
        id: 'processing',
        title: 'Procesando',
        description: 'Estamos preparando tu pedido',
        icon: ClockIcon
      }
    ];

    if (shipmentMethod === 'delivery') {
      return [
        ...baseSteps,
        {
          id: 'shipped',
          title: 'Enviado',
          description: 'Tu pedido está en camino',
          icon: TruckIcon
        },
        {
          id: 'delivered',
          title: 'Entregado',
          description: 'Tu pedido ha sido entregado',
          icon: CheckCircleIcon
        }
      ];
    } else {
      return [
        ...baseSteps,
        {
          id: 'ready_for_pickup',
          title: 'Listo para Retiro',
          description: 'Tu pedido está listo en tienda',
          icon: ShoppingBagIcon
        },
        {
          id: 'delivered',
          title: 'Retirado',
          description: 'Has retirado tu pedido',
          icon: CheckCircleIcon
        }
      ];
    }
  };

  const steps = getSteps();

  // Determinar el estado de cada paso
  const getStepStatus = (stepId) => {
    const statusOrder = {
      'pending': 1,
      'processing': 2,
      'shipped': 3,
      'ready_for_pickup': 3,
      'delivered': 4,
      'cancelled': -1
    };

    const currentOrder = statusOrder[currentStatus] || 0;
    const stepOrder = statusOrder[stepId] || 0;

    if (currentStatus === 'cancelled') {
      return stepId === 'pending' ? 'completed' : 'cancelled';
    }

    if (stepOrder <= currentOrder) {
      return 'completed';
    } else if (stepOrder === currentOrder + 1) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  // Obtener fecha para cada paso
  const getStepDate = (stepId) => {
    switch (stepId) {
      case 'pending':
        return createdAt;
      case 'processing':
        return paidAt || createdAt;
      case 'delivered':
        return deliveredAt;
      default:
        return null;
    }
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Si el pedido está cancelado, mostrar estado especial
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Pedido Cancelado</h3>
              <p className="text-red-700">Este pedido ha sido cancelado</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Seguimiento del Pedido</h3>
      
      <div className="relative">
        {/* Línea de conexión */}
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* Pasos */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const stepDate = getStepDate(step.id);
            const IconComponent = step.icon;
            
            return (
              <div key={step.id} className="relative flex items-start">
                {/* Icono del paso */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                  status === 'completed' 
                    ? 'bg-green-100 border-green-500' 
                    : status === 'current'
                    ? 'bg-blue-100 border-blue-500 animate-pulse'
                    : status === 'cancelled'
                    ? 'bg-red-100 border-red-500'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircleSolid className="h-6 w-6 text-green-600" />
                  ) : (
                    <IconComponent className={`h-6 w-6 ${
                      status === 'current'
                        ? 'text-blue-600'
                        : status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`} />
                  )}
                </div>
                
                {/* Contenido del paso */}
                <div className="ml-6 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-semibold ${
                        status === 'completed' || status === 'current'
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h4>
                      <p className={`text-sm ${
                        status === 'completed' || status === 'current'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Fecha y estado */}
                    <div className="text-right">
                      {stepDate && status === 'completed' && (
                        <p className="text-sm text-gray-600 font-medium">
                          {formatDate(stepDate)}
                        </p>
                      )}
                      {status === 'current' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-blue-600">En progreso</span>
                        </div>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-xs text-gray-400">Pendiente</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Información adicional para el paso actual */}
                  {status === 'current' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-blue-800 font-medium">
                          {step.id === 'processing' && 'Estamos preparando tu pedido con cuidado'}
                          {step.id === 'shipped' && 'Tu pedido está en camino hacia tu dirección'}
                          {step.id === 'ready_for_pickup' && 'Tu pedido está listo para ser retirado en tienda'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Información especial para entrega */}
                  {status === 'completed' && step.id === 'delivered' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircleSolid className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-800 font-medium">
                          {shipmentMethod === 'delivery' ? '¡Pedido entregado exitosamente!' : '¡Pedido retirado exitosamente!'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Método de entrega:</span>
            <span className="ml-2 text-gray-600">
              {shipmentMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Estado actual:</span>
            <span className="ml-2 text-gray-600">
              {currentStatus === 'pending' && 'Pendiente'}
              {currentStatus === 'processing' && 'Procesando'}
              {currentStatus === 'shipped' && 'Enviado'}
              {currentStatus === 'ready_for_pickup' && 'Listo para retiro'}
              {currentStatus === 'delivered' && (shipmentMethod === 'delivery' ? 'Entregado' : 'Retirado')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTracker;