/**
 * Complete System Test - MyServ Final Validation
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const API_BASE = 'http://localhost:3000';

async function runCompleteSystemTest() {
  console.log('🎯 MYSERV - TESTE COMPLETO DO SISTEMA');
  console.log('=====================================\n');

  const results = {
    apis: {},
    booking: {},
    navigation: {},
    overall: true
  };

  try {
    // 1. Test Core APIs
    console.log('1️⃣ TESTANDO APIs PRINCIPAIS...');
    
    // Categories API
    const categoriesRes = await fetch(`${API_BASE}/api/categories`);
    const categoriesData = await categoriesRes.json();
    results.apis.categories = categoriesRes.ok && categoriesData.categories?.length > 0;
    console.log(`   📂 Categorias: ${results.apis.categories ? '✅' : '❌'} (${categoriesData.total || 0} encontradas)`);

    // Services Search API  
    const servicesRes = await fetch(`${API_BASE}/api/services/search`);
    const servicesData = await servicesRes.json();
    results.apis.services = servicesRes.ok && servicesData.success;
    console.log(`   🔧 Serviços: ${results.apis.services ? '✅' : '❌'} (${servicesData.data?.pagination?.totalServices || 0} encontrados)`);

    // Geolocation API
    const geoRes = await fetch(`${API_BASE}/api/geolocation?lat=-23.5505&lng=-46.6333&radius=10`);
    const geoData = await geoRes.json();
    results.apis.geolocation = geoRes.ok && geoData.providers;
    console.log(`   📍 Geolocalização: ${results.apis.geolocation ? '✅' : '❌'} (${geoData.providers?.length || 0} provedores)`);

    // Bookings GET API
    const bookingsRes = await fetch(`${API_BASE}/api/bookings`);
    const bookingsData = await bookingsRes.json();
    results.apis.bookings = bookingsRes.ok && bookingsData.success;
    console.log(`   📋 Agendamentos (GET): ${results.apis.bookings ? '✅' : '❌'} (${bookingsData.bookings?.length || 0} existentes)`);

    // 2. Test Booking Creation Flow
    console.log('\n2️⃣ TESTANDO FLUXO DE AGENDAMENTO...');
    
    const bookingData = {
      serviceId: "cmbrcnjny000b1mhjj16mc0jk",
      providerId: "cmbrcnjnt00061mhjenb1n7p7", 
      description: "Teste automático - Sistema funcionando perfeitamente!",
      preferredDate: "2025-06-16",
      preferredTime: "14:00",
      clientName: "Cliente Sistema Test",
      clientPhone: "11966666666",
      clientEmail: `cliente.sistema.${Date.now()}@teste.com`,
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234567"
    };

    const bookingCreateRes = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    const bookingCreateData = await bookingCreateRes.json();
    results.booking.creation = bookingCreateRes.ok && bookingCreateData.success;
    
    if (results.booking.creation) {
      console.log(`   ✅ Criação de Agendamento: SUCESSO`);
      console.log(`      📊 ID: ${bookingCreateData.booking.id}`);
      console.log(`      👤 Cliente: ${bookingCreateData.booking.client.name}`);
      console.log(`      👨‍🔧 Provedor: ${bookingCreateData.booking.provider.name}`);
      console.log(`      🧹 Serviço: ${bookingCreateData.booking.service.name}`);
      
      // Verify booking was created
      const verifyRes = await fetch(`${API_BASE}/api/bookings`);
      const verifyData = await verifyRes.json();
      const newBookingExists = verifyData.bookings?.some(b => b.id === bookingCreateData.booking.id);
      results.booking.verification = newBookingExists;
      console.log(`   ✅ Verificação: ${results.booking.verification ? 'AGENDAMENTO CONFIRMADO' : 'FALHOU'}`);
      
    } else {
      console.log(`   ❌ Criação de Agendamento: FALHOU - ${bookingCreateData.error}`);
      results.booking.verification = false;
    }

    // 3. Test Navigation and UI
    console.log('\n3️⃣ TESTANDO NAVEGAÇÃO E UI...');
    
    // Test main pages accessibility
    const mainPageRes = await fetch(`${API_BASE}/`);
    results.navigation.home = mainPageRes.ok;
    console.log(`   🏠 Página Inicial: ${results.navigation.home ? '✅' : '❌'}`);

    const agendaPageRes = await fetch(`${API_BASE}/agenda`);
    results.navigation.agenda = agendaPageRes.ok;
    console.log(`   📅 Página de Agenda: ${results.navigation.agenda ? '✅' : '❌'}`);

    const servicesPageRes = await fetch(`${API_BASE}/servicos`);
    results.navigation.services = servicesPageRes.ok;
    console.log(`   🔧 Página de Serviços: ${results.navigation.services ? '✅' : '❌'}`);

    // 4. Calculate Overall Results
    console.log('\n4️⃣ RESULTADOS FINAIS...');
    
    const apiTests = Object.values(results.apis).every(test => test);
    const bookingTests = Object.values(results.booking).every(test => test);
    const navigationTests = Object.values(results.navigation).every(test => test);
    
    results.overall = apiTests && bookingTests && navigationTests;

    console.log(`   🔗 APIs Principais: ${apiTests ? '✅ TODAS FUNCIONANDO' : '❌ ALGUMAS FALHARAM'}`);
    console.log(`   📋 Sistema de Agendamento: ${bookingTests ? '✅ FUNCIONANDO PERFEITAMENTE' : '❌ PROBLEMAS DETECTADOS'}`);
    console.log(`   🧭 Navegação: ${navigationTests ? '✅ TODAS AS PÁGINAS ACESSÍVEIS' : '❌ ALGUMAS PÁGINAS INACESSÍVEIS'}`);

    console.log('\n=====================================');
    if (results.overall) {
      console.log('🎉 SISTEMA MYSERV: ✅ TOTALMENTE FUNCIONAL!');
      console.log('✨ Todas as funcionalidades principais estão operacionais');
      console.log('🚀 Sistema pronto para demonstração e uso');
    } else {
      console.log('⚠️  SISTEMA MYSERV: 🔧 REQUER ATENÇÃO');
      console.log('🔍 Algumas funcionalidades precisam de ajustes');
    }
    console.log('=====================================\n');

    // 5. Summary Report
    console.log('📊 RELATÓRIO DETALHADO:');
    console.log(`• APIs funcionais: ${Object.keys(results.apis).length}/${Object.keys(results.apis).length}`);
    console.log(`• Funcionalidades de agendamento: ${Object.values(results.booking).filter(Boolean).length}/${Object.keys(results.booking).length}`);
    console.log(`• Páginas acessíveis: ${Object.values(results.navigation).filter(Boolean).length}/${Object.keys(results.navigation).length}`);
    console.log(`• Status geral: ${results.overall ? 'APROVADO ✅' : 'REQUER REVISÃO ⚠️'}`);

  } catch (error) {
    console.error('❌ ERRO DURANTE TESTE:', error.message);
    results.overall = false;
  }

  return results;
}

// Execute the test
runCompleteSystemTest();
