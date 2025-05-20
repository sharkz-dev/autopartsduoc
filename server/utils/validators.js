/**
 * Validadores para verificar datos en las solicitudes
 */

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un string tenga al menos cierta longitud
 * @param {string} str - String a validar
 * @param {number} minLength - Longitud mínima requerida
 * @returns {boolean} - true si es válido, false si no
 */
exports.hasMinLength = (str, minLength) => {
  if (!str || typeof str !== 'string') return false;
  return str.length >= minLength;
};

/**
 * Valida un número de teléfono (formato básico)
 * @param {string} phone - Número de teléfono a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidPhone = (phone) => {
  const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida un SKU de producto
 * @param {string} sku - SKU a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidSKU = (sku) => {
  // Formato: letras o números, guiones permitidos, de 3 a 20 caracteres
  const skuRegex = /^[A-Za-z0-9\-]{3,20}$/;
  return skuRegex.test(sku);
};

/**
 * Valida un precio
 * @param {number|string} price - Precio a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidPrice = (price) => {
  // Convertir a número si es string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Verificar que sea un número y sea mayor o igual a cero
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Valida un código postal chileno (formato básico)
 * @param {string} postalCode - Código postal a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidChileanPostalCode = (postalCode) => {
  // Códigos postales chilenos son 7 dígitos
  const postalCodeRegex = /^\d{7}$/;
  return postalCodeRegex.test(postalCode);
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida, false si no
 */
exports.isValidURL = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Sanitiza un string para evitar inyección de HTML
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
exports.sanitizeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Genera un slug a partir de un string
 * @param {string} str - String del cual generar el slug
 * @returns {string} - Slug generado
 */
exports.generateSlug = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

/**
 * Valida una fecha
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} - true si es válida, false si no
 */
exports.isValidDate = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar (formato: 12345678-9)
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Eliminar puntos y guiones
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Validar formato básico (7-9 dígitos)
  if (!/^\d{7,9}[0-9K]$/i.test(rut)) return false;
  
  // Separar cuerpo y dígito verificador
  const rutDigits = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  // Sumar dígitos multiplicados
  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  // Calcular dígito esperado
  const expectedDV = 11 - (sum % 11);
  let calculatedDV;
  
  if (expectedDV === 11) calculatedDV = '0';
  else if (expectedDV === 10) calculatedDV = 'K';
  else calculatedDV = expectedDV.toString();
  
  // Comparar dígito calculado con el proporcionado
  return calculatedDV === dv;
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT a formatear
 * @returns {string} - RUT formateado (12.345.678-9)
 */
exports.formatRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return '';
  
  // Eliminar puntos y guiones
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Extraer dígito verificador
  const dv = rut.slice(-1);
  let rutBody = rut.slice(0, -1);
  
  // Formatear con puntos
  let formatted = '';
  for (let i = rutBody.length - 1, j = 0; i >= 0; i--, j++) {
    formatted = rutBody[i] + formatted;
    if (j === 2 && i !== 0) {
      formatted = '.' + formatted;
      j = -1;
    }
  }
  
  // Unir con dígito verificador
  return `${formatted}-${dv}`;
};

/**
 * Valida un número de tarjeta de crédito (básico)
 * @param {string} cardNumber - Número de tarjeta a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidCreditCard = (cardNumber) => {
  if (!cardNumber) return false;
  
  // Eliminar espacios y guiones
  cardNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  
  // Verificar que solo contiene dígitos
  if (!/^\d+$/.test(cardNumber)) return false;
  
  // Verificar longitud (13-19 dígitos)
  if (cardNumber.length < 13 || cardNumber.length > 19) return false;
  
  // Algoritmo de Luhn (validación básica de números de tarjeta)
  let sum = 0;
  let double = false;
  
  // Sumar dígitos
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    double = !double;
  }
  
  // Verificar si es múltiplo de 10
  return sum % 10 === 0;
};

/**
 * Valida un objeto contra un esquema simple
 * @param {Object} obj - Objeto a validar
 * @param {Object} schema - Esquema de validación
 * @returns {Object} - Resultado de validación {isValid, errors}
 */
exports.validateObject = (obj, schema) => {
  const result = {
    isValid: true,
    errors: {}
  };
  
  for (const field in schema) {
    const rules = schema[field];
    
    // Verificar si el campo es requerido
    if (rules.required && (obj[field] === undefined || obj[field] === null || obj[field] === '')) {
      result.isValid = false;
      result.errors[field] = `El campo ${field} es requerido`;
      continue;
    }
    
    // Si el campo no está presente y no es requerido, continuar
    if (obj[field] === undefined) continue;
    
    // Validar tipo
    if (rules.type && typeof obj[field] !== rules.type) {
      result.isValid = false;
      result.errors[field] = `El campo ${field} debe ser de tipo ${rules.type}`;
      continue;
    }
    
    // Validar mínimo (para strings y arrays, longitud; para números, valor)
    if (rules.min !== undefined) {
      if (typeof obj[field] === 'string' || Array.isArray(obj[field])) {
        if (obj[field].length < rules.min) {
          result.isValid = false;
          result.errors[field] = `El campo ${field} debe tener al menos ${rules.min} caracteres`;
        }
      } else if (typeof obj[field] === 'number') {
        if (obj[field] < rules.min) {
          result.isValid = false;
          result.errors[field] = `El campo ${field} debe ser al menos ${rules.min}`;
        }
      }
    }
    
    // Validar máximo (para strings y arrays, longitud; para números, valor)
    if (rules.max !== undefined) {
      if (typeof obj[field] === 'string' || Array.isArray(obj[field])) {
        if (obj[field].length > rules.max) {
          result.isValid = false;
          result.errors[field] = `El campo ${field} debe tener como máximo ${rules.max} caracteres`;
        }
      } else if (typeof obj[field] === 'number') {
        if (obj[field] > rules.max) {
          result.isValid = false;
          result.errors[field] = `El campo ${field} debe ser como máximo ${rules.max}`;
        }
      }
    }
    
    // Validar con regex
    if (rules.regex && typeof obj[field] === 'string') {
      if (!rules.regex.test(obj[field])) {
        result.isValid = false;
        result.errors[field] = rules.message || `El campo ${field} no tiene un formato válido`;
      }
    }
    
    // Validar con función personalizada
    if (rules.validate && typeof rules.validate === 'function') {
      const isValid = rules.validate(obj[field]);
      if (!isValid) {
        result.isValid = false;
        result.errors[field] = rules.message || `El campo ${field} no es válido`;
      }
    }
  }
  
  return result;
};

module.exports = exports;