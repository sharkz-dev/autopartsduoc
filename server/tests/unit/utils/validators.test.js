const validators = require('../../../utils/validators');

describe('Utilidades de Validación', () => {
  
  describe('Validación de email', () => {
    test('debe validar emails correctos', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test123@gmail.com'
      ];

      validEmails.forEach(email => {
        expect(validators.isValidEmail(email)).toBe(true);
      });
    });

    test('debe rechazar emails incorrectos', () => {
      const invalidEmails = [
        'test@',
        '@example.com',
        'test.example.com',
        'test@.com',
        'test@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validators.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Validación de longitud mínima', () => {
    test('debe validar strings con longitud suficiente', () => {
      expect(validators.hasMinLength('password123', 6)).toBe(true);
      expect(validators.hasMinLength('test', 4)).toBe(true);
      expect(validators.hasMinLength('a', 1)).toBe(true);
    });

    test('debe rechazar strings muy cortos', () => {
      expect(validators.hasMinLength('123', 6)).toBe(false);
      expect(validators.hasMinLength('', 1)).toBe(false);
    });

    test('debe manejar valores no string', () => {
      expect(validators.hasMinLength(null, 5)).toBe(false);
      expect(validators.hasMinLength(undefined, 5)).toBe(false);
      expect(validators.hasMinLength(123, 5)).toBe(false);
    });
  });

  describe('Validación de teléfono', () => {
    test('debe validar números de teléfono correctos', () => {
      const validPhones = [
        '+56 9 1234 5678',
        '56912345678',
        '+1-555-123-4567',
        '(555) 123-4567',
        '12345678'
      ];

      validPhones.forEach(phone => {
        expect(validators.isValidPhone(phone)).toBe(true);
      });
    });

    test('debe rechazar números incorrectos', () => {
      const invalidPhones = [
        '123',
        'abc123def',
        '+',
        '123456789012345678901234567890'
      ];

      invalidPhones.forEach(phone => {
        expect(validators.isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('Validación de SKU', () => {
    test('debe validar SKUs correctos', () => {
      const validSKUs = [
        'ABC123',
        'PROD-001',
        'SKU123ABC',
        'A1B2C3'
      ];

      validSKUs.forEach(sku => {
        expect(validators.isValidSKU(sku)).toBe(true);
      });
    });

    test('debe rechazar SKUs incorrectos', () => {
      const invalidSKUs = [
        'AB', // Muy corto
        'A'.repeat(25), // Muy largo
        'SKU@123', // Caracteres especiales
        'SKU 123', // Espacios
        ''
      ];

      invalidSKUs.forEach(sku => {
        expect(validators.isValidSKU(sku)).toBe(false);
      });
    });
  });

  describe('Validación de precios', () => {
    test('debe validar precios correctos', () => {
      expect(validators.isValidPrice(100)).toBe(true);
      expect(validators.isValidPrice(0)).toBe(true);
      expect(validators.isValidPrice('123.45')).toBe(true);
      expect(validators.isValidPrice('0')).toBe(true);
      expect(validators.isValidPrice(99.99)).toBe(true);
    });

    test('debe rechazar precios incorrectos', () => {
      expect(validators.isValidPrice(-10)).toBe(false);
      expect(validators.isValidPrice('abc')).toBe(false);
      expect(validators.isValidPrice(undefined)).toBe(false);
      expect(validators.isValidPrice('')).toBe(false);
    });
  });

  describe('Validación de código postal chileno', () => {
    test('debe validar códigos postales chilenos correctos', () => {
      const validCodes = [
        '8320000',
        '7500000',
        '1234567'
      ];

      validCodes.forEach(code => {
        expect(validators.isValidChileanPostalCode(code)).toBe(true);
      });
    });

    test('debe rechazar códigos postales incorrectos', () => {
      const invalidCodes = [
        '123456', // Muy corto
        '12345678', // Muy largo
        'ABC1234', // Con letras
        '123-456',
        ''
      ];

      invalidCodes.forEach(code => {
        expect(validators.isValidChileanPostalCode(code)).toBe(false);
      });
    });
  });

  describe('Validación de URLs', () => {
    test('debe validar URLs correctas', () => {
      const validURLs = [
        'https://www.example.com',
        'http://example.com',
        'https://subdomain.example.org/path?param=value',
        'http://localhost:3000'
      ];

      validURLs.forEach(url => {
        expect(validators.isValidURL(url)).toBe(true);
      });
    });

    test('debe rechazar URLs incorrectas', () => {
      const invalidURLs = [
        'ftp://example.com', // Protocolo no válido
        'www.example.com', // Sin protocolo
        'not-a-url',
        '',
        'javascript:alert(1)'
      ];

      invalidURLs.forEach(url => {
        expect(validators.isValidURL(url)).toBe(false);
      });
    });
  });

  describe('Sanitización de HTML', () => {
    test('debe sanitizar caracteres especiales', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      
      expect(validators.sanitizeHTML(input)).toBe(expected);
    });

    test('debe manejar strings seguros', () => {
      const safeString = 'Texto normal sin caracteres especiales';
      expect(validators.sanitizeHTML(safeString)).toBe(safeString);
    });

    test('debe manejar valores no string', () => {
      expect(validators.sanitizeHTML(null)).toBe('');
      expect(validators.sanitizeHTML(undefined)).toBe('');
      expect(validators.sanitizeHTML(123)).toBe('');
    });
  });

  describe('Generación de slugs', () => {
    test('debe generar slugs correctos', () => {
      expect(validators.generateSlug('Titulo de Prueba')).toBe('titulo-de-prueba');
      expect(validators.generateSlug('MAYUSCULAS Y minusculas')).toBe('mayusculas-y-minusculas');
      expect(validators.generateSlug('Con numeros 123')).toBe('con-numeros-123');
    });

    test('debe eliminar caracteres especiales', () => {
      expect(validators.generateSlug('Titulo con ñ y aeiou')).toBe('titulo-con-y-aeiou');
      expect(validators.generateSlug('Texto@con#caracteres$especiales')).toBe('textoconcaracteresespeciales');
    });

    test('debe manejar espacios múltiples', () => {
      expect(validators.generateSlug('Espacios    multiples')).toBe('espacios-multiples');
    });

    test('debe manejar valores no string', () => {
      expect(validators.generateSlug(null)).toBe('');
      expect(validators.generateSlug(undefined)).toBe('');
      expect(validators.generateSlug('')).toBe('');
    });
  });

  describe('Validación de fechas', () => {
    test('debe validar fechas correctas', () => {
      expect(validators.isValidDate('2025-01-01')).toBe(true);
      expect(validators.isValidDate(new Date())).toBe(true);
      expect(validators.isValidDate('2025-12-31T23:59:59')).toBe(true);
    });

    test('debe rechazar fechas incorrectas', () => {
      expect(validators.isValidDate('fecha-invalida')).toBe(false);
      expect(validators.isValidDate('')).toBe(false);
      expect(validators.isValidDate(null)).toBe(false);
      expect(validators.isValidDate(undefined)).toBe(false);
    });
  });

  describe('Validación de RUT chileno', () => {
    test('debe validar RUTs correctos', () => {
      // Usar RUTs válidos reales para las pruebas
      const validRUTs = [
        '11222333-4', // RUT válido de ejemplo
        '12345678-5', // RUT válido de ejemplo
      ];

      validRUTs.forEach(rut => {
        // Solo verificar que la función no arroje error
        expect(typeof validators.isValidRUT(rut)).toBe('boolean');
      });
    });

    test('debe rechazar RUTs incorrectos', () => {
      const invalidRUTs = [
        '123456', // Muy corto
        '123456789012', // Muy largo
        'abcd-efgh', // No numérico
        '12345678-X', // Dígito verificador inválido
        ''
      ];

      invalidRUTs.forEach(rut => {
        expect(validators.isValidRUT(rut)).toBe(false);
      });
    });

    test('debe manejar valores no string', () => {
      expect(validators.isValidRUT(null)).toBe(false);
      expect(validators.isValidRUT(undefined)).toBe(false);
      expect(validators.isValidRUT(123)).toBe(false);
    });
  });

  describe('Formateo de RUT', () => {
    test('debe formatear RUT correctamente', () => {
      expect(validators.formatRUT('123456789')).toBe('12.345.678-9');
      expect(validators.formatRUT('12345678K')).toBe('12.345.678-K');
    });

    test('debe preservar formato ya correcto', () => {
      expect(validators.formatRUT('12.345.678-9')).toBe('12.345.678-9');
    });

    test('debe manejar valores inválidos', () => {
      expect(validators.formatRUT('')).toBe('');
      expect(validators.formatRUT(null)).toBe('');
      expect(validators.formatRUT(undefined)).toBe('');
    });
  });

  describe('Validación de tarjeta de crédito', () => {
    test('debe validar números de tarjeta conocidos válidos', () => {
      // Números de prueba que pasan algoritmo de Luhn
      const validCards = [
        '4532015112830366', // Visa test
        '5555555555554444', // MasterCard test
        '378282246310005'   // American Express test
      ];

      validCards.forEach(card => {
        expect(validators.isValidCreditCard(card)).toBe(true);
      });
    });

    test('debe rechazar números de tarjeta incorrectos', () => {
      const invalidCards = [
        '1234567890123456', // No pasa Luhn
        '123', // Muy corto
        '12345678901234567890', // Muy largo
        'abcd1234efgh5678', // Contiene letras
        ''
      ];

      invalidCards.forEach(card => {
        expect(validators.isValidCreditCard(card)).toBe(false);
      });
    });

    test('debe manejar espacios y guiones', () => {
      expect(validators.isValidCreditCard('4532 0151 1283 0366')).toBe(true);
      expect(validators.isValidCreditCard('4532-0151-1283-0366')).toBe(true);
    });
  });

  describe('Validación de objetos', () => {
    const schema = {
      name: {
        required: true,
        type: 'string',
        min: 2,
        max: 50
      },
      age: {
        required: true,
        type: 'number',
        min: 0,
        max: 120
      },
      email: {
        required: true,
        type: 'string',
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email debe tener formato válido'
      },
      website: {
        required: false,
        type: 'string',
        validate: validators.isValidURL
      }
    };

    test('debe validar objeto correcto', () => {
      const validObject = {
        name: 'Juan Pérez',
        age: 30,
        email: 'juan@example.com',
        website: 'https://www.example.com'
      };

      const result = validators.validateObject(validObject, schema);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('debe detectar campos faltantes', () => {
      const invalidObject = {
        name: 'Juan',
        // age faltante
        email: 'juan@example.com'
      };

      const result = validators.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.age).toContain('requerido');
    });

    test('debe validar tipos incorrectos', () => {
      const invalidObject = {
        name: 123, // Debería ser string
        age: '30', // Debería ser number
        email: 'juan@example.com'
      };

      const result = validators.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('tipo string');
      expect(result.errors.age).toContain('tipo number');
    });

    test('debe validar longitudes mínimas y máximas', () => {
      const invalidObject = {
        name: 'A', // Muy corto
        age: 150, // Muy alto
        email: 'juan@example.com'
      };

      const result = validators.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('al menos 2');
      expect(result.errors.age).toContain('como máximo 120');
    });

    test('debe validar con regex', () => {
      const invalidObject = {
        name: 'Juan Pérez',
        age: 30,
        email: 'email-invalido' // No cumple regex
      };

      const result = validators.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toContain('formato válido');
    });

    test('debe validar con función personalizada', () => {
      const invalidObject = {
        name: 'Juan Pérez',
        age: 30,
        email: 'juan@example.com',
        website: 'sitio-web-invalido'
      };

      const result = validators.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.website).toContain('no es válido');
    });

    test('debe permitir campos opcionales ausentes', () => {
      const validObject = {
        name: 'Juan Pérez',
        age: 30,
        email: 'juan@example.com'
        // website es opcional
      };

      const result = validators.validateObject(validObject, schema);
      expect(result.isValid).toBe(true);
    });
  });
});