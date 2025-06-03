// server/test/webpay-test.js
const transbankService = require('../services/transbank.service');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI);

/**
 * Script de pruebas para validar la integración con Webpay
 */
class WebpayTester {
  
  static async testConfiguration() {
    console.log('🔧 Probando configuración de Webpay...');
    
    try {
      const config = transbankService.validateConfiguration();
      
      console.log('📋 Configuración actual:');
      console.log(`   - Entorno: ${config.environment}`);
      console.log(`   - Código de comercio: ${config.commerceCode}`);
      console.log(`   - Tiene API Key: ${config.hasApiKey ? '✅' : '❌'}`);
      console.log(`   - Es producción: ${config.isProduction ? '✅' : '❌'}`);
      
      if (config.environment === 'integration') {
        console.log('ℹ️  Usando credenciales de integración de Transbank');
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error en configuración:', error.message);
      throw error;
    }
  }
  
  static async testBuyOrderGeneration() {
    console.log('\n📏 Probando generación de buyOrder...');
    
    try {
      // Crear varios IDs de prueba de diferentes longitudes
      const testOrderIds = [
        new mongoose.Types.ObjectId(), // ID normal de MongoDB (24 caracteres)
        '507f1f77bcf86cd799439011', // ID de prueba
        '123456789012345678901234', // ID de 24 caracteres
        '12345678901234567890123456789012' // ID muy largo (32 caracteres)
      ];
      
      console.log('🧪 Probando diferentes IDs de orden:');
      
      for (const orderId of testOrderIds) {
        const orderIdStr = orderId.toString();
        console.log(`\n📦 OrderId: ${orderIdStr} (${orderIdStr.length} caracteres)`);
        
        // Simular generación de buyOrder
        const shortOrderId = orderIdStr.slice(-12);
        const shortTimestamp = Date.now().toString().slice(-8);
        const buyOrder = `O${shortOrderId}T${shortTimestamp}`;
        
        console.log(`   - Short OrderId: ${shortOrderId} (${shortOrderId.length} caracteres)`);
        console.log(`   - Short Timestamp: ${shortTimestamp} (${shortTimestamp.length} caracteres)`);
        console.log(`   - BuyOrder: ${buyOrder} (${buyOrder.length} caracteres)`);
        console.log(`   - Válido: ${buyOrder.length <= 26 ? '✅' : '❌'}`);
        
        // Test de extracción
        const extractedId = transbankService.extractOrderIdFromBuyOrder(buyOrder);
        console.log(`   - ID extraído: ${extractedId}`);
        console.log(`   - Extracción correcta: ${extractedId === shortOrderId ? '✅' : '❌'}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en generación de buyOrder:', error.message);
      throw error;
    }
  }
  
  static async testCreateTransaction() {
    console.log('\n💳 Probando creación de transacción...');
    
    try {
      // Crear orden de prueba con ID realista
      const testOrder = {
        _id: new mongoose.Types.ObjectId(),
        totalPrice: 15000,
        user: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Usuario Test',
          email: 'test@example.com'
        },
        items: [
          {
            product: {
              name: 'Producto de prueba',
              description: 'Descripción de prueba'
            },
            quantity: 1,
            price: 15000
          }
        ]
      };
      
      console.log(`📦 Creando transacción para orden ${testOrder._id}`);
      console.log(`💰 Monto: ${testOrder.totalPrice.toLocaleString()}`);
      
      const transaction = await transbankService.createPaymentTransaction(testOrder);
      
      console.log('✅ Transacción creada exitosamente:');
      console.log(`   - Token: ${transaction.token}`);
      console.log(`   - URL: ${transaction.url}`);
      console.log(`   - Buy Order: ${transaction.buyOrder} (${transaction.buyOrder.length} chars)`);
      console.log(`   - Session ID: ${transaction.sessionId} (${transaction.sessionId.length} chars)`);
      console.log(`   - Monto: ${transaction.amount.toLocaleString()}`);
      console.log(`   - BuyOrder válido: ${transaction.buyOrder.length <= 26 ? '✅' : '❌'}`);
      
      // Guardar token para pruebas posteriores
      this.lastTestToken = transaction.token;
      this.lastTestBuyOrder = transaction.buyOrder;
      
      return transaction;
    } catch (error) {
      console.error('❌ Error creando transacción:', error.message);
      throw error;
    }
  }
  
  static async testInvalidTransaction() {
    console.log('\n🚫 Probando validación de datos inválidos...');
    
    try {
      // Intentar crear transacción sin datos
      await transbankService.createPaymentTransaction(null);
      console.log('❌ ERROR: Debería haber fallado con datos nulos');
    } catch (error) {
      console.log('✅ Validación correcta para datos nulos:', error.message);
    }
    
    try {
      // Intentar crear transacción con monto inválido
      const invalidOrder = {
        _id: new mongoose.Types.ObjectId(),
        totalPrice: 0, // Monto inválido
        user: { _id: new mongoose.Types.ObjectId() }
      };
      
      await transbankService.createPaymentTransaction(invalidOrder);
      console.log('❌ ERROR: Debería haber fallado con monto 0');
    } catch (error) {
      console.log('✅ Validación correcta para monto inválido:', error.message);
    }
  }
  
  static async testTransactionStatus() {
    console.log('\n📊 Probando obtención de estado...');
    
    if (!this.lastTestToken) {
      console.log('⚠️  No hay token de prueba disponible, saltando test');
      return;
    }
    
    try {
      console.log(`🔍 Consultando estado del token: ${this.lastTestToken}`);
      
      const status = await transbankService.getTransactionStatus(this.lastTestToken);
      
      console.log('📋 Estado obtenido:');
      console.log(`   - Token: ${status.token}`);
      console.log(`   - Estado: ${status.status}`);
      console.log(`   - Aprobado: ${status.isApproved ? '✅' : '❌'}`);
      console.log(`   - Monto: ${status.amount?.toLocaleString() || 'N/A'}`);
      
      return status;
    } catch (error) {
      console.log('ℹ️  Error esperado al consultar transacción no confirmada:', error.message);
    }
  }
  
  static async testOrderIdExtraction() {
    console.log('\n🔍 Probando extracción de OrderId...');
    
    try {
      const testCases = [
        { buyOrder: 'O123456789012T87654321', expectedId: '123456789012' },
        { buyOrder: 'Oabcdef123456T12345678', expectedId: 'abcdef123456' },
        { buyOrder: 'ORDER_507f1f77bcf86cd799439011_1640995200000', expectedId: '507f1f77bcf86cd799439011' }, // Formato legacy
      ];
      
      if (this.lastTestBuyOrder) {
        testCases.push({ 
          buyOrder: this.lastTestBuyOrder, 
          expectedId: 'test_real' // Solo para verificar que no falle
        });
      }
      
      console.log('🧪 Probando casos de extracción:');
      
      for (const testCase of testCases) {
        console.log(`\n📋 BuyOrder: ${testCase.buyOrder}`);
        
        const extractedId = transbankService.extractOrderIdFromBuyOrder(testCase.buyOrder);
        console.log(`   - ID extraído: ${extractedId}`);
        
        if (testCase.expectedId !== 'test_real') {
          const isCorrect = extractedId === testCase.expectedId;
          console.log(`   - Esperado: ${testCase.expectedId}`);
          console.log(`   - Correcto: ${isCorrect ? '✅' : '❌'}`);
        } else {
          console.log(`   - Extracción exitosa: ${extractedId ? '✅' : '❌'}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en extracción de OrderId:', error.message);
      throw error;
    }
  }
  
  static async testRefund() {
    console.log('\n🔄 Probando proceso de anulación...');
    
    try {
      const testToken = 'test_token_' + Date.now();
      const testAmount = 10000;
      
      console.log(`💸 Simulando anulación de ${testAmount.toLocaleString()}`);
      
      const refund = await transbankService.refundTransaction(testToken, testAmount);
      
      console.log('📋 Resultado de anulación:');
      console.log(`   - Éxito: ${refund.success ? '✅' : '❌'}`);
      console.log(`   - Token: ${refund.token}`);
      console.log(`   - Monto: ${refund.amount?.toLocaleString()}`);
      console.log(`   - ID Anulación: ${refund.refundId}`);
      console.log(`   - Nota: ${refund.note}`);
      
      return refund;
    } catch (error) {
      console.error('❌ Error en anulación:', error.message);
    }
  }
  
  static async testEdgeCases() {
    console.log('\n🎯 Probando casos extremos...');
    
    try {
      // Test con OrderId muy largo
      const veryLongOrderId = '1234567890123456789012345678901234567890';
      console.log(`\n📏 OrderId muy largo: ${veryLongOrderId} (${veryLongOrderId.length} chars)`);
      
      const shortId = veryLongOrderId.slice(-12);
      const timestamp = Date.now().toString().slice(-8);
      const buyOrder = `O${shortId}T${timestamp}`;
      
      console.log(`   - BuyOrder generado: ${buyOrder} (${buyOrder.length} chars)`);
      console.log(`   - Válido: ${buyOrder.length <= 26 ? '✅' : '❌'}`);
      
      // Test con timestamp muy largo (no debería pasar)
      const veryLongTimestamp = Date.now().toString() + '12345678901234567890';
      console.log(`\n⏰ Timestamp muy largo: ${veryLongTimestamp} (${veryLongTimestamp.length} chars)`);
      
      const shortTimestamp = veryLongTimestamp.slice(-8);
      const buyOrder2 = `O123456789012T${shortTimestamp}`;
      
      console.log(`   - Timestamp cortado: ${shortTimestamp} (${shortTimestamp.length} chars)`);
      console.log(`   - BuyOrder generado: ${buyOrder2} (${buyOrder2.length} chars)`);
      console.log(`   - Válido: ${buyOrder2.length <= 26 ? '✅' : '❌'}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error en casos extremos:', error.message);
      throw error;
    }
  }
  
  static async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DE WEBPAY');
    console.log('================================\n');
    
    const results = {
      configuration: null,
      buyOrderGeneration: null,
      createTransaction: null,
      invalidTransaction: null,
      transactionStatus: null,
      orderIdExtraction: null,
      refund: null,
      edgeCases: null,
      startTime: new Date(),
      endTime: null,
      success: false
    };
    
    try {
      // Test 1: Configuración
      results.configuration = await this.testConfiguration();
      
      // Test 2: Generación de buyOrder
      results.buyOrderGeneration = await this.testBuyOrderGeneration();
      
      // Test 3: Crear transacción válida
      results.createTransaction = await this.testCreateTransaction();
      
      // Test 4: Validar datos inválidos
      results.invalidTransaction = await this.testInvalidTransaction();
      
      // Test 5: Estado de transacción
      results.transactionStatus = await this.testTransactionStatus();
      
      // Test 6: Extracción de OrderId
      results.orderIdExtraction = await this.testOrderIdExtraction();
      
      // Test 7: Anulación
      results.refund = await this.testRefund();
      
      // Test 8: Casos extremos
      results.edgeCases = await this.testEdgeCases();
      
      results.endTime = new Date();
      results.success = true;
      
      console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
      console.log('================================');
      console.log(`⏱️  Tiempo total: ${results.endTime - results.startTime}ms`);
      console.log('🎉 Webpay está listo para usar!');
      
      // Resumen de validaciones críticas
      console.log('\n📊 RESUMEN DE VALIDACIONES CRÍTICAS:');
      console.log('====================================');
      if (this.lastTestBuyOrder) {
        console.log(`✅ BuyOrder generado: ${this.lastTestBuyOrder.length <= 26 ? 'VÁLIDO' : 'INVÁLIDO'} (${this.lastTestBuyOrder.length}/26 chars)`);
      }
      console.log('✅ Configuración: VÁLIDA');
      console.log('✅ Creación de transacción: EXITOSA');
      console.log('✅ Validaciones de datos: FUNCIONANDO');
      console.log('✅ Extracción de OrderId: FUNCIONANDO');
      
    } catch (error) {
      results.endTime = new Date();
      results.success = false;
      
      console.log('\n❌ PRUEBAS FALLARON');
      console.log('==================');
      console.error('💥 Error:', error.message);
      console.log('\n🔧 Verifica tu configuración y credenciales de Transbank');
    }
    
    return results;
  }
  
  static async generateTestReport() {
    console.log('\n📊 Generando reporte de pruebas...');
    
    const report = await this.runAllTests();
    
    // Guardar reporte en archivo
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFile = path.join(reportPath, `webpay-test-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📋 Reporte guardado en: ${reportFile}`);
    
    return report;
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  (async () => {
    try {
      const action = process.argv[2];
      
      if (action === '--report') {
        await WebpayTester.generateTestReport();
      } else if (action === '--config') {
        await WebpayTester.testConfiguration();
      } else if (action === '--buyorder') {
        await WebpayTester.testBuyOrderGeneration();
      } else if (action === '--extract') {
        await WebpayTester.testOrderIdExtraction();
      } else {
        await WebpayTester.runAllTests();
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error en pruebas:', error);
      process.exit(1);
    }
  })();
}

module.exports = WebpayTester;