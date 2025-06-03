// server/migrations/migrate-to-webpay.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI);

const Order = require('../models/Order');
const SystemConfig = require('../models/SystemConfig');

/**
 * Script de migración para cambiar de MercadoPago a Webpay
 */
async function migrateToWebpay() {
  try {
    console.log('🔄 Iniciando migración de MercadoPago a Webpay...');

    // 1. Actualizar órdenes existentes con método de pago MercadoPago
    console.log('📊 Buscando órdenes con MercadoPago...');
    
    const mercadopagoOrders = await Order.find({ 
      paymentMethod: 'mercadopago' 
    });

    console.log(`📋 Encontradas ${mercadopagoOrders.length} órdenes con MercadoPago`);

    if (mercadopagoOrders.length > 0) {
      // Actualizar método de pago a webpay para órdenes no pagadas
      const unpaidOrders = mercadopagoOrders.filter(order => !order.isPaid);
      
      if (unpaidOrders.length > 0) {
        console.log(`🔄 Actualizando ${unpaidOrders.length} órdenes no pagadas...`);
        
        await Order.updateMany(
          { 
            paymentMethod: 'mercadopago',
            isPaid: false 
          },
          { 
            $set: { paymentMethod: 'webpay' },
            $unset: { 'paymentResult.email': 1 } // Remover campos específicos de MP
          }
        );
        
        console.log('✅ Órdenes no pagadas actualizadas a Webpay');
      }

      // Para órdenes ya pagadas, mantener el historial pero marcar como legacy
      const paidOrders = mercadopagoOrders.filter(order => order.isPaid);
      
      if (paidOrders.length > 0) {
        console.log(`📝 Marcando ${paidOrders.length} órdenes pagadas como legacy...`);
        
        await Order.updateMany(
          { 
            paymentMethod: 'mercadopago',
            isPaid: true 
          },
          { 
            $set: { 
              'paymentResult.legacy': true,
              'paymentResult.originalMethod': 'mercadopago'
            }
          }
        );
        
        console.log('✅ Órdenes pagadas marcadas como legacy');
      }
    }

    // 2. Actualizar configuraciones del sistema
    console.log('⚙️ Actualizando configuraciones del sistema...');

    // Crear nuevas configuraciones para Webpay
    const webpayConfigs = [
      {
        key: 'webpay_environment',
        value: 'integration',
        description: 'Entorno de Webpay (integration/production)',
        type: 'string',
        category: 'payment',
        isEditable: true
      },
      {
        key: 'default_payment_method',
        value: 'webpay',
        description: 'Método de pago por defecto',
        type: 'string',
        category: 'payment',
        isEditable: true
      },
      {
        key: 'payment_timeout',
        value: 900,
        description: 'Tiempo límite para completar pago (segundos)',
        type: 'number',
        category: 'payment',
        validationRules: { min: 300, max: 1800 },
        isEditable: true
      }
    ];

    for (const config of webpayConfigs) {
      try {
        await SystemConfig.findOneAndUpdate(
          { key: config.key },
          config,
          { upsert: true, new: true }
        );
        console.log(`✅ Configuración creada/actualizada: ${config.key}`);
      } catch (err) {
        console.error(`❌ Error al crear configuración ${config.key}:`, err.message);
      }
    }

    // 3. Generar reporte de migración
    console.log('\n📊 Generando reporte de migración...');
    
    const totalOrders = await Order.countDocuments();
    const webpayOrders = await Order.countDocuments({ paymentMethod: 'webpay' });
    const legacyOrders = await Order.countDocuments({ 
      'paymentResult.legacy': true 
    });
    
    const report = {
      timestamp: new Date(),
      totalOrders,
      webpayOrders,
      legacyOrders,
      migrationStatus: 'completed'
    };

    console.log('\n📋 REPORTE DE MIGRACIÓN:');
    console.log('========================');
    console.log(`📊 Total de órdenes: ${report.totalOrders}`);
    console.log(`💳 Órdenes con Webpay: ${report.webpayOrders}`);
    console.log(`📚 Órdenes legacy (MP): ${report.legacyOrders}`);
    console.log(`🕒 Fecha de migración: ${report.timestamp.toISOString()}`);
    console.log('========================\n');

    // Guardar reporte en la base de datos
    await SystemConfig.findOneAndUpdate(
      { key: 'migration_report_webpay' },
      {
        key: 'migration_report_webpay',
        value: report,
        description: 'Reporte de migración de MercadoPago a Webpay',
        type: 'object',
        category: 'system',
        isEditable: false
      },
      { upsert: true, new: true }
    );

    console.log('✅ Migración completada exitosamente');
    console.log('📝 Reporte guardado en la configuración del sistema');
    
    return report;

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

/**
 * Función para revertir la migración (rollback)
 */
async function rollbackMigration() {
  try {
    console.log('🔄 Iniciando rollback de migración...');

    // Revertir órdenes legacy
    await Order.updateMany(
      { 'paymentResult.originalMethod': 'mercadopago' },
      {
        $set: { paymentMethod: 'mercadopago' },
        $unset: { 
          'paymentResult.legacy': 1,
          'paymentResult.originalMethod': 1
        }
      }
    );

    // Revertir órdenes no pagadas
    await Order.updateMany(
      { 
        paymentMethod: 'webpay',
        isPaid: false,
        'paymentResult.legacy': { $ne: true }
      },
      { $set: { paymentMethod: 'mercadopago' } }
    );

    // Remover configuraciones de Webpay
    await SystemConfig.deleteMany({
      key: { 
        $in: [
          'webpay_environment',
          'default_payment_method',
          'payment_timeout',
          'migration_report_webpay'
        ]
      }
    });

    console.log('✅ Rollback completado');

  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  (async () => {
    try {
      const action = process.argv[2];
      
      if (action === '--rollback') {
        await rollbackMigration();
      } else {
        await migrateToWebpay();
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateToWebpay,
  rollbackMigration
};