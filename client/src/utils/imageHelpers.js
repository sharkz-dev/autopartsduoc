const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Construye la URL completa para una imagen
 * @param {string} imageName - Nombre de la imagen o ruta
 * @returns {string} URL completa de la imagen
 */
export const getImageUrl = (imageName) => {
  if (!imageName) {
    return '/placeholder-product.png';
  }

  // Si ya es una URL completa, devolverla
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }

  // Si ya tiene /uploads/ al inicio
  if (imageName.startsWith('/uploads/')) {
    return `${API_URL}${imageName}`;
  }

  // Si tiene uploads/ sin la barra inicial
  if (imageName.startsWith('uploads/')) {
    return `${API_URL}/${imageName}`;
  }

  // Si es solo el nombre del archivo
  return `${API_URL}/uploads/${imageName}`;
};

/**
 * Obtiene la URL de la primera imagen de un producto o el placeholder
 * @param {Object} product - Objeto producto
 * @returns {string} URL de la imagen
 */
export const getProductImageUrl = (product) => {
  if (!product || !product.images || product.images.length === 0) {
    return '/placeholder-product.png';
  }

  return getImageUrl(product.images[0]);
};

/**
 * Maneja el error de carga de imagen
 * @param {Event} event - Evento de error
 * @param {string} fallbackUrl - URL de respaldo
 */
export const handleImageError = (event, fallbackUrl = '/placeholder-product.png') => {
  const img = event.target;
  
  if (!img.dataset.errorHandled) {
    img.dataset.errorHandled = 'true';
    img.src = fallbackUrl;
  }
};

export default {
  getImageUrl,
  getProductImageUrl,
  handleImageError
};