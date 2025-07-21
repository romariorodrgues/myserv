/**
 * Complete booking flow test
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const API_BASE = 'http://localhost:3000';

// Test data for booking creation
const bookingData = {
  serviceId: "cmbrcnjny000b1mhjj16mc0jk", // Limpeza Residencial Completa
  providerId: "cmbrcnjnt00061mhjenb1n7p7", // Maria Santos
  description: "Preciso de uma limpeza completa da casa para receber visitas no final de semana",
  preferredDate: "2025-06-16",
  preferredTime: "09:00",
  clientName: "Cliente Teste",
  clientPhone: "11999999999",
  clientEmail: "cliente@teste.com",
  address: "Rua das Flores, 123",
  city: "São Paulo",
  state: "SP",
  zipCode: "01234567"
};

async function testCompleteBookingFlow() {
  console.log('🚀 Iniciando teste completo do fluxo de agendamento...\n');

  try {
    // 1. Test Categories API
    console.log('1️⃣ Testando API de Categorias...');
    const categoriesResponse = await fetch(`${API_BASE}/api/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log(`✅ Categorias: ${categoriesData.total} encontradas`);

    // 2. Test Services Search API
    console.log('\n2️⃣ Testando API de Busca de Serviços...');
    const servicesResponse = await fetch(`${API_BASE}/api/services/search`);
    const servicesData = await servicesResponse.json();
    console.log(`✅ Serviços: ${servicesData.data.pagination.totalServices} encontrados`);

    // 3. Test Geolocation API
    console.log('\n3️⃣ Testando API de Geolocalização...');
    const geoResponse = await fetch(`${API_BASE}/api/geolocation?lat=-23.5505&lng=-46.6333&radius=10`);
    const geoData = await geoResponse.json();
    console.log(`✅ Geolocalização: ${geoData.providers?.length || 0} provedores encontrados`);

    // 4. Test Bookings GET API
    console.log('\n4️⃣ Testando API de Agendamentos (GET)...');
    const bookingsGetResponse = await fetch(`${API_BASE}/api/bookings`);
    const bookingsGetData = await bookingsGetResponse.json();
    console.log(`✅ Agendamentos existentes: ${bookingsGetData.bookings?.length || 0}`);

    // 5. Test Booking Creation
    console.log('\n5️⃣ Testando Criação de Agendamento...');
    const bookingCreateResponse = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    const bookingCreateData = await bookingCreateResponse.json();
    
    if (bookingCreateData.success) {
      console.log(`✅ Agendamento criado com sucesso! ID: ${bookingCreateData.booking.id}`);
      
      // 6. Test getting bookings again to see the new one
      console.log('\n6️⃣ Verificando agendamento criado...');
      const bookingsAfterResponse = await fetch(`${API_BASE}/api/bookings`);
      const bookingsAfterData = await bookingsAfterResponse.json();
      console.log(`✅ Total de agendamentos agora: ${bookingsAfterData.bookings?.length || 0}`);
      
    } else {
      console.log(`❌ Falha na criação: ${bookingCreateData.error}`);
      if (bookingCreateData.details) {
        console.log('Detalhes:', bookingCreateData.details);
      }
    }

    console.log('\n🎉 Teste do fluxo completo finalizado!');
    console.log('\n📊 Resumo dos Resultados:');
    console.log(`- Categorias disponíveis: ${categoriesData.total}`);
    console.log(`- Serviços disponíveis: ${servicesData.data.pagination.totalServices}`);
    console.log(`- Provedores por geolocalização: ${geoData.providers?.length || 0}`);
    console.log(`- Status da criação: ${bookingCreateData.success ? 'SUCESSO' : 'FALHA'}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Run the test
testCompleteBookingFlow();
