/**
 * Test script for booking functionality
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const testBookingFlow = async () => {
  console.log('🧪 Testing MyServ Booking Flow...\n')

  // Test 1: Check bookings API
  try {
    const bookingsResponse = await fetch('http://localhost:3000/api/bookings')
    const bookingsData = await bookingsResponse.json()
    
    console.log('✅ Bookings API:', bookingsResponse.status, bookingsData)
  } catch (error) {
    console.error('❌ Bookings API error:', error.message)
  }

  // Test 2: Check services API
  try {
    const servicesResponse = await fetch('http://localhost:3000/api/services')
    const servicesData = await servicesResponse.json()
    
    console.log('✅ Services API:', servicesResponse.status, 'Found', servicesData.services?.length || 0, 'services')
  } catch (error) {
    console.error('❌ Services API error:', error.message)
  }

  // Test 3: Check categories API
  try {
    const categoriesResponse = await fetch('http://localhost:3000/api/categories')
    const categoriesData = await categoriesResponse.json()
    
    console.log('✅ Categories API:', categoriesResponse.status, 'Found', categoriesData.categories?.length || 0, 'categories')
  } catch (error) {
    console.error('❌ Categories API error:', error.message)
  }

  // Test 4: Check providers by location
  try {
    const geoResponse = await fetch('http://localhost:3000/api/geolocation?lat=-23.5505&lng=-46.6333&radius=10&category=limpeza')
    const geoData = await geoResponse.json()
    
    console.log('✅ Geolocation API:', geoResponse.status, 'Found', geoData.providers?.length || 0, 'providers')
  } catch (error) {
    console.error('❌ Geolocation API error:', error.message)
  }

  console.log('\n🎉 Test completed!')
}

// Run the test
testBookingFlow()
