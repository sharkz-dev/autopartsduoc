const SystemConfig = require('../models/SystemConfig');

// @desc    Obtener todas las configuraciones
// @route   GET /api/system-config
// @access  Private (admin)
exports.getConfigurations = async (req, res, next) => {
  try {
    const configs = await SystemConfig.find()
      .populate('lastModifiedBy', 'name email')
      .sort({ category: 1, key: 1 });

    // Agrupar por categoría para mejor organización
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: configs.length,
      data: groupedConfigs,
      raw: configs // Para facilitar procesamiento en frontend
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener una configuración específica
// @route   GET /api/system-config/:key
// @access  Private (admin)
exports.getConfiguration = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOne({ key: req.params.key })
      .populate('lastModifiedBy', 'name email');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar una configuración
// @route   PUT /api/system-config/:key
// @access  Private (admin)
exports.updateConfiguration = async (req, res, next) => {
  try {
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'El valor es requerido'
      });
    }

    const config = await SystemConfig.findOne({ key: req.params.key });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    if (!config.isEditable) {
      return res.status(400).json({
        success: false,
        error: 'Esta configuración no es editable'
      });
    }

    // Validar el valor según el tipo
    if (config.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return res.status(400).json({
          success: false,
          error: 'El valor debe ser un número válido'
        });
      }

      // Validar rangos si están definidos
      if (config.validationRules) {
        if (config.validationRules.min !== undefined && numValue < config.validationRules.min) {
          return res.status(400).json({
            success: false,
            error: `El valor mínimo permitido es ${config.validationRules.min}`
          });
        }
        if (config.validationRules.max !== undefined && numValue > config.validationRules.max) {
          return res.status(400).json({
            success: false,
            error: `El valor máximo permitido es ${config.validationRules.max}`
          });
        }
      }

      config.value = numValue;
    } else if (config.type === 'boolean') {
      config.value = Boolean(value);
    } else {
      config.value = value;
    }

    config.lastModifiedBy = req.user.id;
    await config.save();

    // Obtener la configuración actualizada con datos poblados
    const updatedConfig = await SystemConfig.findById(config._id)
      .populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedConfig,
      message: 'Configuración actualizada correctamente'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener porcentaje de IVA actual
// @route   GET /api/system-config/tax/rate
// @access  Public
exports.getTaxRate = async (req, res, next) => {
  try {
    const taxRate = await SystemConfig.getTaxRate();

    res.status(200).json({
      success: true,
      data: {
        rate: taxRate,
        percentage: `${taxRate}%`,
        decimal: taxRate / 100
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar porcentaje de IVA
// @route   PUT /api/system-config/tax/rate
// @access  Private (admin)
exports.updateTaxRate = async (req, res, next) => {
  try {
    const { rate } = req.body;

    if (rate === undefined || rate === null) {
      return res.status(400).json({
        success: false,
        error: 'El porcentaje de IVA es requerido'
      });
    }

    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      return res.status(400).json({
        success: false,
        error: 'El porcentaje de IVA debe ser un número entre 0 y 100'
      });
    }

    const config = await SystemConfig.setTaxRate(numRate, req.user.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'No se pudo actualizar la configuración de IVA'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        rate: numRate,
        percentage: `${numRate}%`,
        decimal: numRate / 100
      },
      message: `IVA actualizado a ${numRate}%`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resetear configuraciones a valores por defecto
// @route   POST /api/system-config/reset
// @access  Private (admin)
exports.resetConfigurations = async (req, res, next) => {
  try {
    // Solo admin principal puede hacer esto
    if (req.user.email !== 'admin@example.com') {
      return res.status(403).json({
        success: false,
        error: 'Solo el administrador principal puede resetear configuraciones'
      });
    }

    // Configuraciones por defecto
    const defaultConfigs = [
      {
        key: 'tax_rate',
        value: 19,
        description: 'Porcentaje de IVA aplicado a las ventas',
        type: 'number',
        category: 'tax',
        validationRules: { min: 0, max: 100 }
      },
      {
        key: 'free_shipping_threshold',
        value: 100000,
        description: 'Monto mínimo para envío gratuito (CLP)',
        type: 'number',
        category: 'shipping',
        validationRules: { min: 0 }
      },
      {
        key: 'default_shipping_cost',
        value: 5000,
        description: 'Costo de envío por defecto (CLP)',
        type: 'number',
        category: 'shipping',
        validationRules: { min: 0 }
      },
      {
        key: 'site_name',
        value: 'AutoRepuestos',
        description: 'Nombre del sitio web',
        type: 'string',
        category: 'general'
      },
      {
        key: 'contact_email',
        value: 'info@autorepuestos.com',
        description: 'Email de contacto principal',
        type: 'string',
        category: 'general'
      }
    ];

    // Actualizar o crear configuraciones
    for (const configData of defaultConfigs) {
      await SystemConfig.findOneAndUpdate(
        { key: configData.key },
        { 
          ...configData, 
          lastModifiedBy: req.user.id,
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Configuraciones reseteadas a valores por defecto',
      count: defaultConfigs.length
    });
  } catch (err) {
    next(err);
  }
};