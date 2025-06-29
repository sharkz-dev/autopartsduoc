// Mock del modelo SystemConfig para tests

const mockSystemConfig = {
  // Mock de métodos estáticos
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
  
  // Mock de métodos específicos del modelo
  getConfig: jest.fn().mockImplementation((key, defaultValue = null) => {
    const configs = {
      'tax_rate': 19,
      'free_shipping_threshold': 80000,
      'default_shipping_cost': 5000,
      'site_name': 'AutoParts Test',
      'contact_email': 'test@autoparts.cl'
    };
    return Promise.resolve(configs[key] || defaultValue);
  }),
  
  setConfig: jest.fn().mockResolvedValue({
    key: 'test_key',
    value: 'test_value',
    lastModifiedBy: 'test_user'
  }),
  
  getTaxRate: jest.fn().mockResolvedValue(19),
  setTaxRate: jest.fn().mockResolvedValue({
    key: 'tax_rate',
    value: 19
  }),
  
  // Constructor mock
  constructor: jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
  })),
  
  // Mock del schema
  schema: {
    add: jest.fn(),
    index: jest.fn(),
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {}
  }
};

// Aplicar métodos estáticos al constructor
Object.assign(mockSystemConfig.constructor, {
  findOne: mockSystemConfig.findOne,
  findOneAndUpdate: mockSystemConfig.findOneAndUpdate,
  create: mockSystemConfig.create,
  find: mockSystemConfig.find,
  findById: mockSystemConfig.findById,
  deleteMany: mockSystemConfig.deleteMany,
  countDocuments: mockSystemConfig.countDocuments,
  getConfig: mockSystemConfig.getConfig,
  setConfig: mockSystemConfig.setConfig,
  getTaxRate: mockSystemConfig.getTaxRate,
  setTaxRate: mockSystemConfig.setTaxRate
});

module.exports = mockSystemConfig.constructor;