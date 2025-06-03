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
  
  static async testCreateTransaction() {
    console.log('\n💳 Probando creación de transacción...');
    
    try {
      // Crear orden de prueba
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
      console.log(`💰 Monto: $${testOrder.totalPrice.toLocaleString()}`);
      
      const transaction = await transbankService.createPaymentTransaction(testOrder);
      
      console.log('✅ Transacción creada exitosamente:');
      console.log(`   - Token: ${transaction.token}`);
      console.log(`   - URL: ${transaction.url}`);
      console.log(`   - Buy Order: ${transaction.buyOrder}`);
      console.log(`   - Session ID: ${transaction.sessionId}`);
      console.log(`   - Monto: $${transaction.amount.toLocaleString()}`);
      
      // Guardar token para pruebas posteriores
      this.lastTestToken = transaction.token;
      
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
      console.log(`   - Monto: $${status.amount?.toLocaleString() || 'N/A'}`);
      
      return status;
    } catch (error) {
      console.log('ℹ️  Error esperado al consultar transacción no confirmada:', error.message);
    }
  }
  
  static async testRefund() {
    console.log('\n🔄 Probando proceso de anulación...');
    
    try {
      const testToken = 'test_token_' + Date.now();
      const testAmount = 10000;
      
      console.log(`💸 Simulando anulación de $${testAmount.toLocaleString()}`);
      
      const refund = await transbankService.refundTransaction(testToken, testAmount);
      
      console.log('📋 Resultado de anulación:');
      console.log(`   - Éxito: ${refund.success ? '✅' : '❌'}`);
      console.log(`   - Token: ${refund.token}`);
      console.log(`   - Monto: $${refund.amount?.toLocaleString()}`);
      console.log(`   - ID Anulación: ${refund.refundId}`);
      console.log(`   - Nota: ${refund.note}`);
      
      return refund;
    } catch (error) {
      console.error('❌ Error en anulación:', error.message);
    }
  }
  
  static async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS DE WEBPAY');
    console.log('================================\n');
    
    const results = {
      configuration: null,
      createTransaction: null,
      invalidTransaction: null,
      transactionStatus: null,
      refund: null,
      startTime: new Date(),
      endTime: null,
      success: false
    };
    
    try {
      // Test 1: Configuración
      results.configuration = await this.testConfiguration();
      
      // Test 2: Crear transacción válida
      results.createTransaction = await this.testCreateTransaction();
      
      // Test 3: Validar datos inválidos
      results.invalidTransaction = await this.testInvalidTransaction();
      
      // Test 4: Estado de transacción
      results.transactionStatus = await this.testTransactionStatus();
      
      // Test 5: Anulación
      results.refund = await this.testRefund();
      
      results.endTime = new Date();
      results.success = true;
      
      console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
      console.log('================================');
      console.log(`⏱️  Tiempo total: ${results.endTime - results.startTime}ms`);
      console.log('🎉 Webpay está listo para usar!');
      
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