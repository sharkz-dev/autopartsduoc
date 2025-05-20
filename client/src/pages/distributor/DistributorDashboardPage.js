import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService, productService } from '../../services/api';
import { 
  ArrowTrendingUpIcon, 
  CubeIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar los componentes necesarios para Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DistributorDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas del distribuidor
        const statsResponse = await statsService.getDistributorStats();
        setStats(statsResponse.data.data);
        
        // Obtener los productos del distribuidor actual para el panel
        const productsResponse = await productService.getMyProducts();
        setProducts(productsResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formatear datos para el gráfico de ventas por mes
  const formatSalesData = (salesData) => {
    if (!salesData || salesData.length === 0) return null;
    
    // Obtener nombres de meses a partir de números
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Ordenar por año y mes
    const sortedData = [...salesData].sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    return {
      labels: sortedData.map(item => `${months[item._id.month - 1]} ${item._id.year}`),
      datasets: [
        {
          label: 'Ventas',
          data: sortedData.map(item => item.total),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        }
      ]
    };
  };

  // Formatear datos para el gráfico de productos más vendidos
  const formatTopProductsData = (topProducts) => {
    if (!topProducts || topProducts.length === 0) return null;

    return {
      labels: topProducts.map(product => product.name),
      datasets: [
        {
          label: 'Unidades vendidas',
          data: topProducts.map(product => product.totalSold),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  // Datos de gráficos
  const salesChartData = formatSalesData(stats?.salesByMonth);
  const topProductsChartData = formatTopProductsData(stats?.topProducts);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard del Distribuidor</h1>
        <Link
          to="/distributor/products"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Ver mis productos
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Ventas Totales</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats?.totalSales || 0)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <ShoppingCartIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Órdenes Totales</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.orderCount || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-purple-100 p-3 rounded-full mr-4">
            <CubeIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Productos Activos</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.productCount || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-amber-100 p-3 rounded-full mr-4">
            <ArrowTrendingUpIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Venta Promedio</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats?.orderCount 
                ? formatCurrency(stats.totalSales / stats.orderCount) 
                : formatCurrency(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ventas Mensuales</h2>
          {salesChartData ? (
            <div className="h-80">
              <Line 
                data={salesChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value);
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">No hay datos de ventas disponibles</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos Más Vendidos</h2>
          {topProductsChartData ? (
            <div className="h-80">
              <Bar 
                data={topProductsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Unidades vendidas'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">No hay datos de productos vendidos disponibles</p>
          )}
        </div>
      </div>

      {/* Productos con stock bajo */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos con Stock Bajo</h2>
        
        {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.lowStockProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(product.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stockQuantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {product.stockQuantity} unidades
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link 
                        to={`/distributor/product/edit/${product._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No hay productos con stock bajo</p>
        )}
      </div>

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/distributor/product/add"
          className="bg-blue-600 text-white px-6 py-4 rounded-lg text-center hover:bg-blue-700 transition"
        >
          Agregar Nuevo Producto
        </Link>
        <Link
          to="/distributor/orders"
          className="bg-green-600 text-white px-6 py-4 rounded-lg text-center hover:bg-green-700 transition"
        >
          Ver Órdenes Pendientes
        </Link>
        <Link
          to="/catalog"
          className="bg-purple-600 text-white px-6 py-4 rounded-lg text-center hover:bg-purple-700 transition"
        >
          Ver Catálogo Completo
        </Link>
      </div>
    </div>
  );
};

export default DistributorDashboardPage;