module.exports = {
  // Entorno de prueba
  testEnvironment: 'node',

  // Archivos de configuración - SOLO el setup principal
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Patrones de archivos de prueba
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],

  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/uploads/',
    '/uploads_test/',
    '/dist/',
    '/build/'
  ],

  // Cobertura de código
  collectCoverage: false,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!server.js',
    '!seeder.js'
  ],

  // Timeout para tests - Aumentado para operaciones de BD
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Limpiar mocks después de cada test
  clearMocks: true,
  restoreMocks: true,

  // Configuración para detectar handles abiertos
  detectOpenHandles: true,
  forceExit: true,

  // Configuración para ejecutar tests en serie (evita problemas de concurrencia)
  maxWorkers: 1,

  // Configuración de reporters
  reporters: [
    'default'
  ],

  // Configuración para transformar archivos
  transform: {},

  // Configuración para manejar imports/exports
  extensionsToTreatAsEsm: [],

  // Configuración de módulos
  moduleFileExtensions: ['js', 'json'],

  // Configuración de rutas de módulos
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Mock patterns - Los mocks se configuran en setup.js
  modulePathIgnorePatterns: [
    '<rootDir>/uploads/',
    '<rootDir>/uploads_test/'
  ],

  // Configuración para manejar variables de entorno
  setupFiles: [],

  // Configuración para silence warnings
  silent: false,

  // Configuración para exit después de tests
  bail: false
};