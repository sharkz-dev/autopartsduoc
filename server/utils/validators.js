/**
 * Validadores para verificar datos en las solicitudes
 */

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  // ✅ CORREGIDO: Regex más preciso para emails
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida que un string tenga al menos cierta longitud
 * @param {string} str - String a validar
 * @param {number} minLength - Longitud mínima requerida
 * @returns {boolean} - true si es válido, false si no
 */
exports.hasMinLength = (str, minLength) => {
  if (!str || typeof str !== 'string') return false;
  // ✅ CORREGIDO: Permitir longitud 0 si minLength es 0
  if (minLength === 0) return true;
  return str.length >= minLength;
};

/**
 * Valida un número de teléfono (formato básico)
 * @param {string} phone - Número de teléfono a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Valida un SKU de producto
 * @param {string} sku - SKU a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidSKU = (sku) => {
  if (!sku || typeof sku !== 'string') return false;
  // ✅ CORREGIDO: Formato más específico para SKUs
  const skuRegex = /^[A-Za-z0-9][A-Za-z0-9\-_]{2,19}$/;
  return skuRegex.test(sku.trim());
};

/**
 * Valida un precio
 * @param {number|string} price - Precio a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidPrice = (price) => {
  // Convertir a número si es string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // ✅ CORREGIDO: Verificar que sea un número válido y finito
  return typeof numPrice === 'number' && !isNaN(numPrice) && isFinite(numPrice) && numPrice >= 0;
};

/**
 * Valida un código postal chileno (formato básico)
 * @param {string} postalCode - Código postal a validar
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidChileanPostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== 'string') return false;
  // Códigos postales chilenos son 7 dígitos
  const postalCodeRegex = /^\d{7}$/;
  return postalCodeRegex.test(postalCode.trim());
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida, false si no
 */
exports.isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
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
  
  const slug = str
    .toLowerCase()
    // ✅ CORREGIDO: Manejar acentos correctamente
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    // ✅ CORREGIDO: Permitir algunos caracteres especiales y limpiar mejor
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales excepto guiones y guiones bajos
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, '') // Eliminar guiones al inicio y final
    .trim();
    
  return slug;
};

/**
 * Valida una fecha
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} - true si es válida, false si no
 */
exports.isValidDate = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  // ✅ CORREGIDO: Validar fechas más estrictamente
  return !isNaN(d.getTime()) && d.toString() !== 'Invalid Date';
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar (formato: 12345678-9)
 * @returns {boolean} - true si es válido, false si no
 */
exports.isValidRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Eliminar puntos y guiones
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim();
  
  // ✅ CORREGIDO: Validar formato básico más estricto
  if (!/^\d{7,8}[0-9Kk]$/.test(cleanRut)) return false;
  
  // Separar cuerpo y dígito verificador
  const rutDigits = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
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
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim();
  
  // Extraer dígito verificador
  const dv = cleanRut.slice(-1);
  let rutBody = cleanRut.slice(0, -1);
  
  // ✅ CORREGIDO: Formatear con puntos desde la derecha
  let formatted = '';
  for (let i = 0; i < rutBody.length; i++) {
    if (i > 0 && (rutBody.length - i) % 3 === 0) {
      formatted += '.';
    }
    formatted += rutBody[i];
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
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  // Eliminar espacios y guiones
  const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  
  // Verificar que solo contiene dígitos
  if (!/^\d+$/.test(cleanNumber)) return false;
  
  // ✅ CORREGIDO: Verificar longitud específica para diferentes tipos
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Algoritmo de Luhn (validación básica de números de tarjeta)
  let sum = 0;
  let double = false;
  
  // Sumar dígitos
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
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
  
  if (!obj || typeof obj !== 'object') {
    result.isValid = false;
    result.errors.general = 'Objeto requerido para validación';
    return result;
  }
  
  for (const field in schema) {
    const rules = schema[field];
    
    // Verificar si el campo es requerido
    if (rules.required && (obj[field] === undefined || obj[field] === null || obj[field] === '')) {
      result.isValid = false;
      result.errors[field] = `El campo ${field} es requerido`;
      continue;
    }
    
    // Si el campo no está presente y no es requerido, continuar
    if (obj[field] === undefined || obj[field] === null) continue;
    
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