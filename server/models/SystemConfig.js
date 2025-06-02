const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'La clave de configuración es requerida'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'El valor de configuración es requerido']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['number', 'string', 'boolean', 'object'],
    default: 'string'
  },
  category: {
    type: String,
    required: true,
    enum: ['tax', 'payment', 'shipping', 'general', 'email'],
    default: 'general'
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validationRules: {
    min: Number,
    max: Number,
    required: Boolean,
    regex: String
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
SystemConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método estático para obtener configuración por clave
SystemConfigSchema.statics.getConfig = async function(key, defaultValue = null) {
  try {
    const config = await this.findOne({ key });
    return config ? config.value : defaultValue;
  } catch (error) {
    console.error(`Error al obtener configuración ${key}:`, error);
    return defaultValue;
  }
};

// Método estático para establecer configuración
SystemConfigSchema.statics.setConfig = async function(key, value, userId = null) {
  try {
    const updateData = { 
      value, 
      updatedAt: Date.now() 
    };
    
    if (userId) {
      updateData.lastModifiedBy = userId;
    }

    const config = await this.findOneAndUpdate(
      { key },
      updateData,
      { new: true, upsert: false }
    );
    
    return config;
  } catch (error) {
    console.error(`Error al establecer configuración ${key}:`, error);
    throw error;
  }
};

// Método estático para obtener el porcentaje de IVA actual
SystemConfigSchema.statics.getTaxRate = async function() {
  return await this.getConfig('tax_rate', 19); // 19% por defecto
};

// Método estático para actualizar el porcentaje de IVA
SystemConfigSchema.statics.setTaxRate = async function(rate, userId = null) {
  return await this.setConfig('tax_rate', rate, userId);
};

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);