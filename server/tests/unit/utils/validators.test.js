const validators = require('../../../utils/validators');

describe('Utilidades de Validación', () => {
  describe('isValidEmail()', () => {
    test('debería validar emails válidos', () => {
      const validEmails = [
        'usuario@ejemplo.com',
        'test@test.cl',
        'admin@autoparts.com',
        'user.name@domain.co.uk',
        'test123@gmail.com',
        'user+tag@example.org',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(validators.isValidEmail(email)).toBe(true);
      });
    });

    test('debería rechazar emails inválidos', () => {
      const invalidEmails = [
        'email-sin-arroba.com',
        '@dominio.com',
        'usuario@',
        'usuario@dominio',
        'usuario@.com',
        'usuario..doble@dominio.com',
        'usuario@dominio..com',
        '',
        null,
        undefined,
        'email con espacios@dominio.com',
        'email@dominio con espacios.com'
      ];

      invalidEmails.forEach(email => {
        expect(validators.isValidEmail(email)).toBe(false);
      });
    });

    test('debería manejar casos edge', () => {
      expect(validators.isValidEmail(123)).toBe(false);
      expect(validators.isValidEmail({})).toBe(false);
      expect(validators.isValidEmail([])).toBe(false);
    });
  });

  describe('hasMinLength()', () => {
    test('debería validar strings con longitud suficiente', () => {
      expect(validators.hasMinLength('password123', 6)).toBe(true);
      expect(validators.hasMinLength('abc', 3)).toBe(true);
      expect(validators.hasMinLength('exactamente', 11)).toBe(true);
      expect(validators.hasMinLength('más largo de lo necesario', 10)).toBe(true);
    });

    test('debería rechazar strings muy cortos', () => {
      expect(validators.hasMinLength('abc', 5)).toBe(false);
      expect(validators.hasMinLength('', 1)).toBe(false);
      expect(validators.hasMinLength('12', 3)).toBe(false);
    });

    test('debería manejar valores no válidos', () => {
      expect(validators.hasMinLength(null, 5)).toBe(false);
      expect(validators.hasMinLength(undefined, 5)).toBe(false);
      expect(validators.hasMinLength(123, 3)).toBe(false);
      expect(validators.hasMinLength([], 1)).toBe(false);
      expect(validators.hasMinLength({}, 1)).toBe(false);
    });

    test('debería manejar longitud mínima de cero', () => {
      expect(validators.hasMinLength('', 0)).toBe(true);
      expect(validators.hasMinLength('cualquier cosa', 0)).toBe(true);
    });
  });

  describe('isValidPhone()', () => {
    test('debería validar números de teléfono válidos', () => {
      const validPhones = [
        '+56912345678',
        '56912345678',
        '912345678',
        '+1-555-123-4567',
        '(555) 123-4567',
        '555 123 4567',
        '+44 20 7946 0958',
        '02 2345 6789',
        '+56 9 1234 5678'
      ];

      validPhones.forEach(phone => {
        expect(validators.isValidPhone(phone)).toBe(true);
      });
    });

    test('debería rechazar números de teléfono inválidos', () => {
      const invalidPhones = [
        '123',
        '12345',
        'abcdefghij',
        '+',
        '++56912345678',
        '56912345678901234567890123', // Muy largo
        '',
        null,
        undefined,
        '123abc456'
      ];

      invalidPhones.forEach(phone => {
        expect(validators.isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('isValidSKU()', () => {
    test('debería validar SKUs válidos', () => {
      const validSKUs = [
        'ABC123',
        'PROD-001',
        'SKU-ABC-123',
        'TEST001',
        'a1b2c3',
        'ABCDEFGHIJ1234567890', // 20 caracteres
        'ABC'  // 3 caracteres (mínimo)
      ];

      validSKUs.forEach(sku => {
        expect(validators.isValidSKU(sku)).toBe(true);
      });
    });

    test('debería rechazar SKUs inválidos', () => {
      const invalidSKUs = [
        'AB', // Muy corto
        'ABCDEFGHIJ1234567890A', // Muy largo (21 caracteres)
        'SKU_WITH_UNDERSCORE',
        'SKU WITH SPACES',
        'SKU@INVALID',
        'SKU#123',
        '',
        null,
        undefined,
        '123.456',
        'SKU/TEST'
      ];

      invalidSKUs.forEach(sku => {
        expect(validators.isValidSKU(sku)).toBe(false);
      });
    });
  });

  describe('isValidPrice()', () => {
    test('debería validar precios válidos', () => {
      const validPrices = [
        0,
        0.01,
        100,
        999.99,
        '25000',
        '199.50',
        1000000
      ];

      validPrices.forEach(price => {
        expect(validators.isValidPrice(price)).toBe(true);
      });
    });

    test('debería rechazar precios inválidos', () => {
      const invalidPrices = [
        -1,
        -0.01,
        '-100',
        'abc',
        '',
        null,
        undefined,
        NaN,
        Infinity,
        'precio inválido',
        '100abc'
      ];

      invalidPrices.forEach(price => {
        expect(validators.isValidPrice(price)).toBe(false);
      });
    });

    test('debería manejar conversión de strings', () => {
      expect(validators.isValidPrice('0')).toBe(true);
      expect(validators.isValidPrice('123.45')).toBe(true);
      expect(validators.isValidPrice('1000')).toBe(true);
    });
  });

  describe('isValidChileanPostalCode()', () => {
    test('debería validar códigos postales chilenos válidos', () => {
      const validPostalCodes = [
        '8320000',
        '7500000',
        '1234567',
        '0000000'
      ];

      validPostalCodes.forEach(code => {
        expect(validators.isValidChileanPostalCode(code)).toBe(true);
      });
    });

    test('debería rechazar códigos postales inválidos', () => {
      const invalidPostalCodes = [
        '123456',    // Muy corto
        '12345678',  // Muy largo
        'abcdefg',   // Letras
        '123-456',   // Con guión
        '123 456',   // Con espacio
        '',
        null,
        undefined,
        '12345ab'
      ];

      invalidPostalCodes.forEach(code => {
        expect(validators.isValidChileanPostalCode(code)).toBe(false);
      });
    });
  });

  describe('isValidURL()', () => {
    test('debería validar URLs válidas', () => {
      const validURLs = [
        'http://example.com',
        'https://example.com',
        'https://www.google.com',
        'http://localhost:3000',
        'https://api.example.com/v1/endpoint',
        'http://192.168.1.1:8080',
        'https://subdomain.domain.co.uk/path?query=value'
      ];

      validURLs.forEach(url => {
        expect(validators.isValidURL(url)).toBe(true);
      });
    });

    test('debería rechazar URLs inválidas', () => {
      const invalidURLs = [
        'ftp://example.com',     // Protocolo no HTTP/HTTPS
        'example.com',           // Sin protocolo
        'www.example.com',       // Sin protocolo
        'http://',               // Incompleta
        'https://',              // Incompleta
        '',
        null,
        undefined,
        'not-a-url',
        'javascript:alert(1)'
      ];

      invalidURLs.forEach(url => {
        expect(validators.isValidURL(url)).toBe(false);
      });
    });
  });

  describe('sanitizeHTML()', () => {
    test('debería sanitizar caracteres HTML peligrosos', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(validators.sanitizeHTML(input)).toBe(expected);
    });

    test('debería sanitizar todos los caracteres especiales', () => {
      const input = '& < > " \'';
      const expected = '&amp; &lt; &gt; &quot; &#039;';
      expect(validators.sanitizeHTML(input)).toBe(expected);
    });

    test('debería mantener texto normal sin cambios', () => {
      const input = 'Texto normal sin caracteres especiales';
      expect(validators.sanitizeHTML(input)).toBe(input);
    });

    test('debería manejar valores no válidos', () => {
      expect(validators.sanitizeHTML(null)).toBe('');
      expect(validators.sanitizeHTML(undefined)).toBe('');
      expect(validators.sanitizeHTML(123)).toBe('');
      expect(validators.sanitizeHTML('')).toBe('');
    });

    test('debería sanitizar texto complejo', () => {
      const input = 'Usuario escribió: "Hola & adiós" <img src="x" onerror="alert(1)">\'';
      const expected = 'Usuario escribió: &quot;Hola &amp; adiós&quot; &lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;&#039;';
      expect(validators.sanitizeHTML(input)).toBe(expected);
    });
  });

  describe('generateSlug()', () => {
    test('debería generar slugs válidos', () => {
      expect(validators.generateSlug('Producto de Prueba')).toBe('producto-de-prueba');
      expect(validators.generateSlug('MAYÚSCULAS y minúsculas')).toBe('mayúsculas-y-minúsculas');
      expect(validators.generateSlug('Con    espacios    múltiples')).toBe('con-espacios-múltiples');
    });

    test('debería remover caracteres especiales', () => {
      expect(validators.generateSlug('Producto@#$%^&*()')).toBe('producto');
      expect(validators.generateSlug('Test!@#$%^&*()_+={[}]|\\:";\'<,>.?/')).toBe('test');
      expect(validators.generateSlug('Ácentos y Ñoño')).toBe('ácentos-y-ñoño');
    });

    test('debería manejar casos edge', () => {
      expect(validators.generateSlug('')).toBe('');
      expect(validators.generateSlug(null)).toBe('');
      expect(validators.generateSlug(undefined)).toBe('');
      expect(validators.generateSlug(123)).toBe('');
      expect(validators.generateSlug('   ')).toBe('');
      expect(validators.generateSlug('@#$%^&*()')).toBe('');
    });

    test('debería manejar números', () => {
      expect(validators.generateSlug('Producto 123')).toBe('producto-123');
      expect(validators.generateSlug('ABC123DEF')).toBe('abc123def');
    });
  });

  describe('isValidDate()', () => {
    test('debería validar fechas válidas', () => {
      const validDates = [
        new Date(),
        '2023-12-01',
        '2023/12/01',
        'December 1, 2023',
        '2023-12-01T10:30:00Z',
        1638360000000 // Timestamp
      ];

      validDates.forEach(date => {
        expect(validators.isValidDate(date)).toBe(true);
      });
    });

    test('debería rechazar fechas inválidas', () => {
      const invalidDates = [
        'fecha inválida',
        '2023-13-01',  // Mes inválido
        '2023-02-30',  // Día inválido
        '',
        null,
        undefined,
        'abc',
        NaN
      ];

      invalidDates.forEach(date => {
        expect(validators.isValidDate(date)).toBe(false);
      });
    });
  });

  describe('isValidRUT()', () => {
    test('debería validar RUTs chilenos válidos', () => {
      const validRUTs = [
        '12345678-9',
        '12.345.678-9',
        '1234567-8',
        '12345678K',
        '12345678k',
        '98765432-1',
        '11111111-1'
      ];

      validRUTs.forEach(rut => {
        expect(validators.isValidRUT(rut)).toBe(true);
      });
    });

    test('debería rechazar RUTs inválidos', () => {
      const invalidRUTs = [
        '12345678-0',  // Dígito verificador incorrecto
        '123456-7',    // Muy corto
        '1234567890-1', // Muy largo
        '12345678',    // Sin dígito verificador
        'abcdefgh-9',  // Letras en el cuerpo
        '12345678-X',  // Dígito verificador inválido
        '',
        null,
        undefined,
        '12-345-678-9' // Formato incorrecto
      ];

      invalidRUTs.forEach(rut => {
        expect(validators.isValidRUT(rut)).toBe(false);
      });
    });

    test('debería manejar casos edge', () => {
      expect(validators.isValidRUT(123456789)).toBe(false);
      expect(validators.isValidRUT({})).toBe(false);
      expect(validators.isValidRUT([])).toBe(false);
    });
  });

  describe('formatRUT()', () => {
    test('debería formatear RUTs correctamente', () => {
      expect(validators.formatRUT('123456789')).toBe('12.345.678-9');
      expect(validators.formatRUT('12345678K')).toBe('12.345.678-K');
      expect(validators.formatRUT('1234567-8')).toBe('123.456.7-8');
    });

    test('debería limpiar RUTs ya formateados', () => {
      expect(validators.formatRUT('12.345.678-9')).toBe('12.345.678-9');
      expect(validators.formatRUT('12345678-9')).toBe('12.345.678-9');
    });

    test('debería manejar casos edge', () => {
      expect(validators.formatRUT('')).toBe('');
      expect(validators.formatRUT(null)).toBe('');
      expect(validators.formatRUT(undefined)).toBe('');
      expect(validators.formatRUT(123)).toBe('');
    });

    test('debería manejar RUTs cortos', () => {
      expect(validators.formatRUT('12345678')).toBe('1.234.567-8');
      expect(validators.formatRUT('1234567')).toBe('123.456-7');
    });
  });

  describe('isValidCreditCard()', () => {
    test('debería validar números de tarjeta válidos (algoritmo de Luhn)', () => {
      const validCards = [
        '4532015112830366',    // Visa
        '5555555555554444',    // MasterCard
        '378282246310005',     // American Express
        '6011111111111117',    // Discover
        '4000000000000002'     // Visa test
      ];

      validCards.forEach(card => {
        expect(validators.isValidCreditCard(card)).toBe(true);
      });
    });

    test('debería validar tarjetas con espacios y guiones', () => {
      expect(validators.isValidCreditCard('4532 0151 1283 0366')).toBe(true);
      expect(validators.isValidCreditCard('4532-0151-1283-0366')).toBe(true);
    });

    test('debería rechazar números de tarjeta inválidos', () => {
      const invalidCards = [
        '4532015112830367',    // Falla algoritmo de Luhn
        '123456789012345',     // Muy corto
        '123456789012345678901', // Muy largo
        'abcdabcdabcdabcd',    // Letras
        '4532-0151-1283-036X', // Letra al final
        '',
        null,
        undefined,
        '1234'
      ];

      invalidCards.forEach(card => {
        expect(validators.isValidCreditCard(card)).toBe(false);
      });
    });

    test('debería manejar longitudes límite', () => {
      // 13 dígitos (mínimo)
      expect(validators.isValidCreditCard('4000000000002')).toBe(true);
      
      // 12 dígitos (muy corto)
      expect(validators.isValidCreditCard('400000000002')).toBe(false);
      
      // 20 dígitos (muy largo)
      expect(validators.isValidCreditCard('12345678901234567890')).toBe(false);
    });
  });

  describe('validateObject()', () => {
    test('debería validar objeto con esquema simple', () => {
      const obj = {
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        age: 30
      };

      const schema = {
        name: { required: true, type: 'string', min: 2 },
        email: { required: true, type: 'string' },
        age: { required: true, type: 'number', min: 18 }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('debería fallar con campos requeridos faltantes', () => {
      const obj = {
        name: 'Juan Pérez'
        // Falta email y age
      };

      const schema = {
        name: { required: true, type: 'string' },
        email: { required: true, type: 'string' },
        age: { required: true, type: 'number' }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('El campo email es requerido');
      expect(result.errors.age).toBe('El campo age es requerido');
    });

    test('debería validar tipos de datos', () => {
      const obj = {
        name: 123,        // Debería ser string
        age: 'treinta',   // Debería ser number
        active: 'yes'     // Debería ser boolean
      };

      const schema = {
        name: { required: true, type: 'string' },
        age: { required: true, type: 'number' },
        active: { required: true, type: 'boolean' }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('El campo name debe ser de tipo string');
      expect(result.errors.age).toBe('El campo age debe ser de tipo number');
      expect(result.errors.active).toBe('El campo active debe ser de tipo boolean');
    });

    test('debería validar longitud mínima y máxima', () => {
      const obj = {
        name: 'A',           // Muy corto
        description: 'x'.repeat(1001), // Muy largo
        password: 'abc',     // Muy corto
        tags: ['a', 'b']     // Array con longitud válida
      };

      const schema = {
        name: { required: true, type: 'string', min: 2 },
        description: { required: true, type: 'string', max: 1000 },
        password: { required: true, type: 'string', min: 6 },
        tags: { required: true, min: 1, max: 5 }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('al menos 2 caracteres');
      expect(result.errors.description).toContain('como máximo 1000 caracteres');
      expect(result.errors.password).toContain('al menos 6 caracteres');
      expect(result.errors.tags).toBeUndefined(); // Este debería ser válido
    });

    test('debería validar rangos numéricos', () => {
      const obj = {
        age: 15,      // Menor al mínimo
        score: 110    // Mayor al máximo
      };

      const schema = {
        age: { required: true, type: 'number', min: 18, max: 65 },
        score: { required: true, type: 'number', min: 0, max: 100 }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.age).toContain('al menos 18');
      expect(result.errors.score).toContain('como máximo 100');
    });

    test('debería validar con regex', () => {
      const obj = {
        email: 'email-invalido',
        phone: '123abc'
      };

      const schema = {
        email: { 
          required: true, 
          type: 'string',
          regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Email inválido'
        },
        phone: {
          required: true,
          type: 'string',
          regex: /^\d+$/,
          message: 'Solo números permitidos'
        }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email inválido');
      expect(result.errors.phone).toBe('Solo números permitidos');
    });

    test('debería validar con función personalizada', () => {
      const obj = {
        password: 'password123',
        confirmPassword: 'different'
      };

      const schema = {
        password: { required: true, type: 'string', min: 6 },
        confirmPassword: {
          required: true,
          type: 'string',
          validate: (value) => value === obj.password,
          message: 'Las contraseñas no coinciden'
        }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Las contraseñas no coinciden');
    });

    test('debería permitir campos opcionales', () => {
      const obj = {
        name: 'Juan Pérez'
        // email es opcional y no está presente
      };

      const schema = {
        name: { required: true, type: 'string' },
        email: { required: false, type: 'string' } // Opcional
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('debería validar objeto complejo exitosamente', () => {
      const obj = {
        user: {
          name: 'Juan Pérez',
          email: 'juan@ejemplo.com',
          age: 30
        },
        preferences: {
          notifications: true,
          theme: 'dark'
        }
      };

      const schema = {
        user: { required: true, type: 'object' },
        preferences: { required: false, type: 'object' }
      };

      const result = validators.validateObject(obj, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Integración entre validadores', () => {
    test('debería usar múltiples validadores en conjunto', () => {
      const userData = {
        name: 'Juan Pérez',
        email: 'juan@autoparts.cl',
        phone: '+56912345678',
        password: 'contraseña123'
      };

      // Validar cada campo individualmente
      expect(validators.hasMinLength(userData.name, 2)).toBe(true);
      expect(validators.isValidEmail(userData.email)).toBe(true);
      expect(validators.isValidPhone(userData.phone)).toBe(true);
      expect(validators.hasMinLength(userData.password, 6)).toBe(true);

      // Validar con esquema completo
      const schema = {
        name: { required: true, type: 'string', min: 2 },
        email: { 
          required: true, 
          type: 'string',
          validate: validators.isValidEmail,
          message: 'Email inválido'
        },
        phone: {
          required: true,
          type: 'string',
          validate: validators.isValidPhone,
          message: 'Teléfono inválido'
        },
        password: { required: true, type: 'string', min: 6 }
      };

      const result = validators.validateObject(userData, schema);
      expect(result.isValid).toBe(true);
    });

    test('debería sanitizar y validar contenido HTML', () => {
      const userInput = '<script>alert("XSS")</script>Contenido válido';
      
      const sanitized = validators.sanitizeHTML(userInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Contenido válido');
      
      const slug = validators.generateSlug('Título con <script>');
      expect(slug).toBe('título-con-script');
    });
  });
});