import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { productService } from '../../services/api';

const ProductRating = ({ product }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await productService.getProductReviews(product._id);
        setReviews(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar valoraciones:', err);
        setLoading(false);
      }
    };

    if (product && product._id) {
      fetchReviews();
    }
  }, [product]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!userRating) {
      setError('Por favor, selecciona una valoración');
      return;
    }

    if (!userName.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const reviewData = {
        rating: userRating,
        comment,
        userName
      };
      
      await productService.addProductReview(product._id, reviewData);
      
      // Actualizar la lista de reviews
      const response = await productService.getProductReviews(product._id);
      setReviews(response.data.data || []);
      
      // Limpiar el formulario
      setUserRating(0);
      setComment('');
      setUserName('');
      setSuccess('¡Gracias por tu valoración!');
      
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      setSubmitting(false);
    } catch (err) {
      console.error('Error al enviar valoración:', err);
      setError('No se pudo enviar la valoración. Intenta nuevamente.');
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Valoraciones de clientes</h2>
      
      {/* Resumen de valoraciones */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="flex items-center mb-4">
          <div className="text-4xl font-bold mr-4">
            {product.avgRating ? product.avgRating.toFixed(1) : '0.0'}
          </div>
          <div>
            {renderStars(Math.round(product.avgRating || 0))}
            <div className="text-sm text-gray-500 mt-1">
              {reviews.length} {reviews.length === 1 ? 'valoración' : 'valoraciones'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulario de valoración */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Deja tu valoración</h3>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Tu valoración</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-gray-400 focus:outline-none"
                >
                  {star <= (hoverRating || userRating) ? (
                    <StarIcon className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <StarOutline className="h-8 w-8 hover:text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="userName" className="block text-gray-700 mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="comment" className="block text-gray-700 mb-2">
              Tu comentario (opcional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="4"
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Enviando...' : 'Enviar valoración'}
          </button>
        </form>
      </div>
      
      {/* Lista de valoraciones */}
      <div>
        <h3 className="text-lg font-medium mb-4">Opiniones de clientes</h3>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-6">
                <div className="flex items-center mb-2">
                  <span className="font-medium mr-2">{review.userName}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mb-2">{renderStars(review.rating)}</div>
                {review.comment && <p className="text-gray-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Aún no hay valoraciones para este producto. ¡Sé el primero en opinar!</p>
        )}
      </div>
    </div>
  );
};

export default ProductRating;