const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre de producto'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Por favor ingrese una descripción']
  },
  price: {
    type: Number,
    required: [true, 'Por favor ingrese un precio'],
    min: [0, 'El precio no puede ser negativo']
  },
  wholesalePrice: {
    type: Number,
    min: [0, 'El precio mayorista no puede ser negativo']
  },
  // Nuevos campos para descuentos
  onSale: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: [0, 'El porcentaje de descuento no puede ser negativo'],
    max: [100, 'El porcentaje de descuento no puede ser mayor a 100'],
    default: 0
  },
  salePrice: {
    type: Number,
    min: [0, 'El precio de oferta no puede ser negativo']
  },
  saleEndDate: {
    type: Date
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Por favor ingrese la cantidad en stock'],
    min: [0, 'El stock no puede ser negativo']
  },
  images: [
    {
      type: String
    }
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Por favor seleccione una categoría']
  },
  brand: {
    type: String,
    required: [true, 'Por favor ingrese una marca']
  },
  compatibleModels: [
    {
      make: String,
      model: String,
      year: Number
    }
  ],
  sku: {
    type: String,
    required: [true, 'Por favor ingrese el SKU'],
    unique: true
  },
  partNumber: {
    type: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Por favor indique el distribuidor']
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  avgRating: {
    type: Number,
    default: 0
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

// Crear slug a partir del nombre
ProductSchema.pre('save', function(next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  
  // Actualizar fecha de modificación
  this.updatedAt = Date.now();
  
  // Calcular precio de oferta si está en descuento
  if (this.onSale && this.discountPercentage > 0) {
    this.salePrice = this.price - (this.price * (this.discountPercentage / 100));
  } else {
    this.onSale = false;
    this.discountPercentage = 0;
    this.salePrice = null;
  }
  
  next();
});

// Calcular rating promedio
ProductSchema.methods.calculateAvgRating = function() {
  if (this.ratings.length === 0) {
    this.avgRating = 0;
    return;
  }
  
  const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
  this.avgRating = sum / this.ratings.length;
};

module.exports = mongoose.model('Product', ProductSchema);