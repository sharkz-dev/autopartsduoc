const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre de categoría'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Método estático para generar slug único
CategorySchema.statics.generateUniqueSlug = async function(name, excludeId = null) {
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
    
    const existingCategory = await this.findOne(query);
    if (!existingCategory) break;
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// Middleware pre-save actualizado
CategorySchema.pre('save', async function(next) {
  // Solo generar slug si es un documento nuevo o si el nombre cambió
  if (this.isNew || this.isModified('name')) {
    this.slug = await this.constructor.generateUniqueSlug(this.name, this._id);
  }
  
  next();
});

module.exports = mongoose.model('Category', CategorySchema);