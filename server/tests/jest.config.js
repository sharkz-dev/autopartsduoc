module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  setupFiles: ['<rootDir>/tests/jest.env.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/uploads/',
    '/uploads_test/'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!server.js',
    '!seeder.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  testTimeout: 30000,
  moduleNameMapping: {
    '^transbank-sdk$': '<rootDir>/tests/__mocks__/transbank-sdk.js'
  },
  // Configuración para suprimir logs durante tests
  silent: false,
  // Configuración de transformación
  transform: {},
  // Archivos que deben ser ignorados por Jest
  transformIgnorePatterns: [
    'node_modules/(?!(some-es6-module)/)'
  ],
  // Variables de entorno para tests
  globals: {
    'process.env': {
      NODE_ENV: 'test'
    }
  }
};