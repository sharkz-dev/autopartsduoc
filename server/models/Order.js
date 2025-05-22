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
      },
      // Guardar distribuidor para referencias
      distributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    enum: ['mercadopago', 'bankTransfer', 'cash'],
    default: 'mercadopago'
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    email: String
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);