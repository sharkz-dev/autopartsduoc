const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese un email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'distributor', 'admin'], // ✅ AGREGADO: rol distributor
    default: 'client'
  },
  // ✅ NUEVO: Información específica para distribuidores
  distributorInfo: {
    companyName: {
      type: String,
      required: function() {
        return this.role === 'distributor';
      }
    },
    companyRUT: {
      type: String,
      required: function() {
        return this.role === 'distributor';
      }
    },
    companyLogo: String,
    businessLicense: String,
    creditLimit: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  phone: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Firmar JWT y devolver
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Comparar contraseña ingresada con contraseña encriptada
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ NUEVO: Método para verificar si es distribuidor aprobado
UserSchema.methods.isApprovedDistributor = function() {
  return this.role === 'distributor' && this.distributorInfo?.isApproved === true;
};

// ✅ NUEVO: Método para obtener el tipo de carrito automático
UserSchema.methods.getCartType = function() {
  return this.role === 'distributor' ? 'B2B' : 'B2C';
};

// ✅ NUEVO: Método para verificar si puede ver precios mayoristas
UserSchema.methods.canAccessWholesalePrices = function() {
  return this.role === 'distributor' && this.distributorInfo?.isApproved === true;
};

module.exports = mongoose.model('User', UserSchema);