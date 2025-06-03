const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'La cantidad mínima es 1']
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  shippingAddress: {
    street: {
      type: String,
      required: function() {
        return this.shipmentMethod === 'delivery';
      }
    },
    city: {
      type: String,
      required: function() {
        return this.shipmentMethod === 'delivery';
      }
    },
    state: {
      type: String,
      required: function() {
        return this.shipmentMethod === 'delivery';
      }
    },
    postalCode: {
      type: String,
      required: function() {
        return this.shipmentMethod === 'delivery';
      }
    },
    country: {
      type: String,
      required: function() {
        return this.shipmentMethod === 'delivery';
      }
    }
  },
  // Método de envío: 'delivery' o 'pickup'
  shipmentMethod: {
    type: String,
    required: true,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  // Para retiro en tienda
  pickupLocation: {
    name: String,
    address: String,
    scheduledDate: Date,
    notes: String
  },
   paymentMethod: {
    type: String,
    required: true,
    enum: ['webpay', 'bankTransfer', 'cash'], // Reemplazar 'mercadopago' con 'webpay'
    default: 'webpay' // Cambiar default de 'mercadopago' a 'webpay'
  },
  paymentResult: {
    id: String, // Token de Webpay
    buyOrder: String, // Orden de compra generada para Webpay
    sessionId: String, // ID de sesión de Webpay
    authorizationCode: String, // Código de autorización de la transacción
    status: String, // approved, rejected, pending
    updateTime: String,
    paymentMethod: String, // 'webpay'
    amount: Number, // Monto de la transacción
    responseCode: Number, // Código de respuesta de Transbank
    cardDetail: {
      card_number: String // Últimos 4 dígitos de la tarjeta
    },
    installments: Number, // Número de cuotas
    email: String,
    // Información de anulación/reembolso
    refund: {
      id: String,
      amount: Number,
      status: String,
      processedAt: Date
    }
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  // NUEVO: Campo para almacenar la tasa de IVA aplicada en esta orden
  taxRate: {
    type: Number,
    required: true,
    default: 19,
    min: [0, 'La tasa de IVA no puede ser negativa'],
    max: [100, 'La tasa de IVA no puede ser mayor a 100%']
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    required: true,
    enum: ['B2C', 'B2B'],
    default: 'B2C'
  },
  // NUEVO: Campos adicionales para auditoría de cambios fiscales
  fiscalInfo: {
    appliedTaxRate: {
      type: Number,
      default: function() { return this.taxRate; }
    },
    taxCalculationDate: {
      type: Date,
      default: Date.now
    },
    // Para futuras actualizaciones fiscales si es necesario
    taxRecalculated: {
      type: Boolean,
      default: false
    },
    taxRecalculatedAt: Date,
    taxRecalculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de modificación
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Asegurar que fiscalInfo.appliedTaxRate coincida con taxRate
  if (this.isModified('taxRate')) {
    if (!this.fiscalInfo) {
      this.fiscalInfo = {};
    }
    this.fiscalInfo.appliedTaxRate = this.taxRate;
    this.fiscalInfo.taxCalculationDate = Date.now();
  }
  
  next();
});

// Método para recalcular impuestos (para uso administrativo si es necesario)
OrderSchema.methods.recalculateTax = async function(newTaxRate, userId = null) {
  const SystemConfigService = require('../services/systemConfig.service');
  
  // Calcular nuevo impuesto
  const newTaxPrice = await SystemConfigService.calculateTax(this.itemsPrice);
  const oldTaxPrice = this.taxPrice;
  const oldTaxRate = this.taxRate;
  
  // Actualizar valores
  this.taxPrice = newTaxPrice;
  this.taxRate = newTaxRate;
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
  
  // Registrar la recalculación
  this.fiscalInfo = this.fiscalInfo || {};
  this.fiscalInfo.taxRecalculated = true;
  this.fiscalInfo.taxRecalculatedAt = Date.now();
  this.fiscalInfo.taxRecalculatedBy = userId;
  this.fiscalInfo.appliedTaxRate = newTaxRate;
  
  await this.save();
  
  return {
    previousTaxRate: oldTaxRate,
    newTaxRate: newTaxRate,
    previousTaxPrice: oldTaxPrice,
    newTaxPrice: newTaxPrice,
    totalPriceChange: newTaxPrice - oldTaxPrice
  };
};

// Método estático para obtener estadísticas de IVA por período
OrderSchema.statics.getTaxStatistics = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$taxRate',
        orderCount: { $sum: 1 },
        totalTaxCollected: { $sum: '$taxPrice' },
        totalOrderValue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  return stats;
};

// Método virtual para obtener información fiscal formateada
OrderSchema.virtual('taxInfo').get(function() {
  return {
    rate: this.taxRate,
    percentage: `${this.taxRate}%`,
    amount: this.taxPrice,
    appliedAt: this.fiscalInfo?.taxCalculationDate || this.createdAt,
    wasRecalculated: this.fiscalInfo?.taxRecalculated || false
  };
});

// Índices para optimizar consultas
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ taxRate: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'fiscalInfo.taxRecalculated': 1 });

module.exports = mongoose.model('Order', OrderSchema);