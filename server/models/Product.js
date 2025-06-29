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
    // Removido required: true para que se genere automáticamente
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
  // Campos para descuentos
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
      userName: String,
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

// Método estático para generar slug único
ProductSchema.statics.generateUniqueSlug = async function(name, excludeId = null) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto guiones
    .replace(/\s+/g, '_')     // Reemplazar espacios con guiones bajos
    .replace(/_+/g, '_')      // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_|_$/g, '')    // Eliminar guiones bajos al inicio y final
    .trim();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingProduct = await this.findOne(query);
    if (!existingProduct) break;
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// Middleware pre-save actualizado
ProductSchema.pre('save', async function(next) {
  // Generar slug si no existe o si el nombre cambió
  if (this.isNew || this.isModified('name') || !this.slug) {
    this.slug = await this.constructor.generateUniqueSlug(this.name, this._id);
  }
  
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