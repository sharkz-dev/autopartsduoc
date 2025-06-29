// Configuración de variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_123456789';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';

// Configuración de email de prueba
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USERNAME = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.FROM_NAME = 'AutoParts Test';
process.env.FROM_EMAIL = 'test@autoparts.com';

// Configuración de archivos
process.env.FILE_UPLOAD_PATH = './uploads_test';
process.env.MAX_FILE_SIZE = '5000000';

// Configuración de Transbank para pruebas
process.env.TRANSBANK_COMMERCE_CODE = 'test_commerce_code';
process.env.TRANSBANK_API_KEY = 'test_api_key';
process.env.TRANSBANK_ENVIRONMENT = 'integration';

// URLs para pruebas
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BASE_URL = 'http://localhost:5000';