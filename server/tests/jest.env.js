// Variables de entorno específicas para tests
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://localhost:27017/autoparts_test';
process.env.JWT_SECRET = 'test_jwt_secret_muy_largo_para_pruebas';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_COOKIE_EXPIRE = '1';

// Email settings para tests
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USERNAME = 'test@autoparts.cl';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.FROM_NAME = 'AutoParts Test';
process.env.FROM_EMAIL = 'test@autoparts.cl';

// File upload settings
process.env.FILE_UPLOAD_PATH = './uploads_test';
process.env.MAX_FILE_SIZE = '5000000';

// Transbank settings para tests
process.env.TRANSBANK_COMMERCE_CODE = '597055555532';
process.env.TRANSBANK_API_KEY = 'test_api_key';
process.env.TRANSBANK_ENVIRONMENT = 'integration';

// Frontend y Backend URLs
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BASE_URL = 'http://localhost:5001';

// Silenciar warnings de deprecación para tests
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';