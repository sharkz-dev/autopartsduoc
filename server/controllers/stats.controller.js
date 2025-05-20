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

    // Ventas por distribuidor
    const salesByDistributor = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.distributor',
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'distributorInfo'
        }
      },
      {
        $addFields: {
          companyName: { $arrayElemAt: ['$distributorInfo.companyName', 0] },
          name: { $arrayElemAt: ['$distributorInfo.name', 0] },
          orderCount: { $size: '$orders' }
        }
      },
      {
        $project: {
          distributorInfo: 0,
          orders: 0
        }
      },
      {
        $sort: { total: -1 }
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
          sku: { $arrayElemAt: ['$productInfo.sku', 0] },
          distributor: { $arrayElemAt: ['$productInfo.distributor', 0] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'distributor',
          foreignField: '_id',
          as: 'distributorInfo'
        }
      },
      {
        $addFields: {
          distributorName: { $arrayElemAt: ['$distributorInfo.companyName', 0] }
        }
      },
      {
        $project: {
          productInfo: 0,
          distributorInfo: 0
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
        salesByDistributor,
        salesByMonth,
        topProducts
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener estadísticas de distribuidor
// @route   GET /api/stats/distributor
// @access  Private (distribuidor)
exports.getDistributorStats = async (req, res, next) => {
  try {
    const distributorId = req.user.id;

    // Total de ventas del distribuidor
    const totalSales = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $match: { 'items.distributor': mongoose.Types.ObjectId(distributorId) }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    // Total de órdenes con productos del distribuidor
    const orderStats = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $match: { 'items.distributor': mongoose.Types.ObjectId(distributorId) }
      },
      {
        $group: {
          _id: '$_id'
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Total de productos del distribuidor
    const productCount = await Product.countDocuments({ distributor: distributorId });

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
        $unwind: '$items'
      },
      {
        $match: { 'items.distributor': mongoose.Types.ObjectId(distributorId) }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
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

    // Productos más vendidos del distribuidor
    const topProducts = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $match: { 'items.distributor': new mongoose.Types.ObjectId(distributorId) }
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

    // Inventario con poco stock
    const lowStockProducts = await Product.find({
      distributor: distributorId,
      stockQuantity: { $lt: 10 }
    })
      .select('name sku stockQuantity price')
      .sort('stockQuantity')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
        orderCount: orderStats.length > 0 ? orderStats[0].total : 0,
        productCount,
        salesByMonth,
        topProducts,
        lowStockProducts
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

    // Total de distribuidores
    const distributorCount = await User.countDocuments({ role: 'distributor' });

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
        distributorCount,
        categoryCount,
        popularProducts
      }
    });
  } catch (err) {
    next(err);
  }
};