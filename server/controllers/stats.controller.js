const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// @desc    Obtener estadísticas generales (admin)
// @route   GET /api/stats/admin
// @access  Private (admin)
exports.getAdminStats = async (req, res, next) => {
  try {
    // Total de ventas
    const totalSales = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Total de órdenes
    const orderCount = await Order.countDocuments({ status: { $ne: 'cancelled' } });

    // Total de productos
    const productCount = await Product.countDocuments();

    // Total de usuarios por rol
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Ventas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesByMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $dateToString: { format: "%Y", date: "$createdAt" } },
            month: { $dateToString: { format: "%m", date: "$createdAt" } }
          },
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Productos más vendidos
    const topProducts = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $addFields: {
          name: { $arrayElemAt: ['$productInfo.name', 0] },
          sku: { $arrayElemAt: ['$productInfo.sku', 0] }
        }
      },
      {
        $project: {
          productInfo: 0
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
        orderCount,
        productCount,
        userStats,
        salesByMonth,
        topProducts
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener estadísticas públicas
// @route   GET /api/stats/public
// @access  Public
exports.getPublicStats = async (req, res, next) => {
  try {
    // Total de productos
    const productCount = await Product.countDocuments();

    // Total de categorías
    const categoryCount = await Category.countDocuments();

    // Productos más populares
    const popularProducts = await Product.find()
      .sort('-avgRating')
      .limit(5)
      .select('name brand price avgRating images');

    res.status(200).json({
      success: true,
      data: {
        productCount,
        categoryCount,
        popularProducts
      }
    });
  } catch (err) {
    next(err);
  }
};