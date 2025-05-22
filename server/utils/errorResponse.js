/**
 * Clase de respuesta de error personalizada
 * Extiende la clase Error nativa para incluir un código de estado HTTP
 */
class ErrorResponse extends Error {
  /**
   * Constructor de la clase ErrorResponse
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;