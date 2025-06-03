// Script para probar las rutas de pago desde el navegador
// Pega este código en la consola del navegador para diagnosticar el problema

async function testPaymentRoutes() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE RUTAS DE PAGO');
  console.log('='.repeat(50));
  
  const baseURL = window.location.origin;
  const token = localStorage.getItem('token');
  
  console.log('🌐 Base URL:', baseURL);
  console.log('🔑 Token disponible:', !!token);
  console.log('🔑 Token (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'No disponible');
  
  // Test 1: Verificar que las rutas estén registradas
  try {
    console.log('\n📋 Test 1: Verificando rutas registradas en el servidor...');
    const routesResponse = await fetch(`${baseURL}/api/routes-debug`);
    const routesData = await routesResponse.json();
    
    console.log('✅ Total de rutas:', routesData.totalRoutes);
    console.log('🔍 Rutas de payment encontradas:', routesData.paymentRoutes);
    
    if (routesData.paymentRoutes.length === 0) {
      console.error('❌ PROBLEMA: No se encontraron rutas de payment registradas');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error al verificar rutas:', error);
  }
  
  // Test 2: Verificar ruta de configuración de pago (no requiere auth)
  try {
    console.log('\n🔧 Test 2: Verificando configuración de Transbank...');
    
    if (!token) {
      console.log('⚠️ No hay token, saltando tests que requieren autenticación');
    } else {
      const configResponse = await fetch(`${baseURL}/api/payment/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status de configuración:', configResponse.status);
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ Configuración de Transbank:', configData);
      } else {
        console.error('❌ Error en configuración:', await configResponse.text());
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar configuración:', error);
  }
  
  // Test 3: Simular consulta de estado de pago
  const testOrderId = '507f1f77bcf86cd799439011'; // ObjectId de prueba
  
  try {
    console.log(`\n💳 Test 3: Probando ruta de estado de pago con ID: ${testOrderId}`);
    
    if (!token) {
      console.log('⚠️ Saltando test de estado - no hay token');
    } else {
      const statusResponse = await fetch(`${baseURL}/api/payment/status/${testOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status de respuesta:', statusResponse.status);
      console.log('📊 Headers de respuesta:', Object.fromEntries(statusResponse.headers.entries()));
      
      const responseText = await statusResponse.text();
      console.log('📋 Respuesta completa:', responseText);
      
      if (statusResponse.status === 404) {
        if (responseText.includes('Orden no encontrada')) {
          console.log('✅ La ruta funciona correctamente (orden no encontrada es esperado)');
        } else if (responseText.includes('Ruta no encontrada')) {
          console.error('❌ PROBLEMA: La ruta /api/payment/status/:orderId no está registrada');
        } else {
          console.log('🤔 Respuesta 404 inesperada:', responseText);
        }
      } else if (statusResponse.status === 401) {
        console.log('🔐 Respuesta 401 - problema de autenticación');
      } else {
        console.log('📊 Respuesta inesperada:', statusResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al probar estado de pago:', error);
  }
  
  // Test 4: Verificar estructura de autenticación
  try {
    console.log('\n🔐 Test 4: Verificando autenticación...');
    
    if (!token) {
      console.log('⚠️ No hay token en localStorage');
    } else {
      const authResponse = await fetch(`${baseURL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status de auth/me:', authResponse.status);
      
      if (authResponse.ok) {
        const userData = await authResponse.json();
        console.log('✅ Usuario autenticado:', userData.data.name, userData.data.role);
      } else {
        console.error('❌ Token inválido o expirado');
        const errorText = await authResponse.text();
        console.error('Error details:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
  }
  
  // Test 5: Probar con axios (como lo hace la aplicación)
  try {
    console.log('\n🔄 Test 5: Probando con axios (simulando la aplicación)...');
    
    if (window.axios && token) {
      const axiosResponse = await window.axios.get(`/api/payment/status/${testOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Axios response:', axiosResponse);
      
    } else {
      console.log('⚠️ Axios no disponible o no hay token');
    }
    
  } catch (axiosError) {
    console.log('📊 Axios error status:', axiosError.response?.status);
    console.log('📊 Axios error data:', axiosError.response?.data);
    
    if (axiosError.response?.status === 404) {
      if (axiosError.response.data?.error?.includes('Orden no encontrada')) {
        console.log('✅ Axios: La ruta funciona (orden no encontrada es esperado)');
      } else {
        console.error('❌ Axios: Ruta no encontrada');
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 DIAGNÓSTICO COMPLETADO');
  console.log('='.repeat(50));
  
  // Resumen de recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('1. Verifica que el servidor esté ejecutándose');
  console.log('2. Confirma que las rutas de payment estén registradas');
  console.log('3. Asegúrate de que el token de autenticación sea válido');
  console.log('4. Revisa los logs del servidor para más detalles');
}

// Ejecutar el diagnóstico
testPaymentRoutes();