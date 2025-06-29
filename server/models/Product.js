const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre de producto'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    // ✅ CORREGIDO: No requerido directamente, se genera automáticamente
    sparse: true // Permite valores únicos pero no requiere que esté presente inicialmente
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
  if (!name || typeof name !== 'string') {
    throw new Error('Nombre requerido para generar slug');
  }

  const baseSlug = name
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres especiales
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto guiones
    .replace(/\s+/g, '_')     // Reemplazar espacios con guiones bajos
    .replace(/_+/g, '_')      // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_|_$/g, '')    // Eliminar guiones bajos al inicio y final
    .trim();

  if (!baseSlug) {
    throw new Error('No se pudo generar slug válido');
  }

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

// ✅ CORREGIDO: Middleware pre-save mejorado
ProductSchema.pre('save', async function(next) {
  try {
    // Generar slug si es nuevo documento o si cambió el nombre
    if (this.isNew || this.isModified('name')) {
      if (!this.name) {
        return next(new Error('Nombre requerido para generar slug'));
      }
      this.slug = await this.constructor.generateUniqueSlug(this.name, this._id);
    }
    
    // Validar que el slug exista antes de guardar
    if (!this.slug) {
      return next(new Error('Slug es requerido'));
    }
    
    // Actualizar fecha de modificación
    this.updatedAt = Date.now();
    
    // Calcular precio de oferta si está en descuento
    if (this.onSale && this.discountPercentage > 0) {
      this.salePrice = Math.round(this.price - (this.price * (this.discountPercentage / 100)));
    } else {
      this.onSale = false;
      this.discountPercentage = 0;
      this.salePrice = null;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Validación post-save para asegurar slug
ProductSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError' && error.errors.slug) {
    next(new Error('Error generando slug único'));
  } else {
    next(error);
  }
});

// Calcular rating promedio
ProductSchema.methods.calculateAvgRating = function() {
  if (this.ratings.length === 0) {
    this.avgRating = 0;
    return;
  }
  
  const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
  this.avgRating = Math.round((sum / this.ratings.length) * 10) / 10; // Redondear a 1 decimal
};

// Índices para optimización
ProductSchema.index({ slug: 1 }, { unique: true, sparse: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });
ProductSchema.index({ category: 1, featured: 1 });
ProductSchema.index({ onSale: 1, discountPercentage: 1 });

module.exports = mongoose.model('Product', ProductSchema);