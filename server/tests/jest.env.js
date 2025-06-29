// Configuración de variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_purposes_only';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';

// Variables de Transbank para testing
process.env.TRANSBANK_ENVIRONMENT = 'integration';
process.env.TRANSBANK_COMMERCE_CODE = 'test_commerce_code';
process.env.TRANSBANK_API_KEY = 'test_api_key';

// Configuración de base de datos (será sobrescrita por MongoDB Memory Server)
process.env.MONGO_URI = 'mongodb://localhost:27017/autopartes_test';

// Configuración de archivos
process.env.FILE_UPLOAD_PATH = './uploads_test';
process.env.MAX_FILE_UPLOAD = '1000000';

// Configuración de email (mock)
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_EMAIL = 'test@test.com';
process.env.SMTP_PASSWORD = 'test_password';

// Configuración de frontend
process.env.CLIENT_URL = 'http://localhost:3000';

// Configuración de servidor
process.env.PORT = '5000';

// Suprimir advertencias específicas de Mongoose
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';