#!/usr/bin/env node

/**
 * Test script for service request workflow
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const { PrismaClient } = require('@prisma/client');

async function testServiceRequestFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Service Request Flow...\n');

    // 1. Check if we have services with providers
    const services = await prisma.service.findMany({
      include: {
        providers: {
          include: {
            serviceProvider: {
              include: {
                user: true
              }
            }
          }
        },
        category: true
      },
      where: {
        providers: {
          some: {}
        }
      }
    });

    console.log(`✅ Found ${services.length} services with providers`);

    // 2. Test specific service details
    if (services.length > 0) {
      const testService = services[0];
      console.log(`📋 Testing service: ${testService.name}`);
      console.log(`   - Category: ${testService.category.name}`);
      console.log(`   - Providers: ${testService.providers.length}`);
      
      testService.providers.forEach((provider, index) => {
        console.log(`   - Provider ${index + 1}: ${provider.serviceProvider.user.name}`);
        console.log(`     - Has Scheduling: ${provider.serviceProvider.hasScheduling}`);
        console.log(`     - Has Quoting: ${provider.serviceProvider.hasQuoting}`);
        console.log(`     - Base Price: R$ ${provider.basePrice}`);
      });

      // 3. Test service API endpoint
      console.log('\n🔄 Testing API endpoint...');
      
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://localhost:3003/api/services/${testService.id}`);
        
        if (response.ok) {
          const apiData = await response.json();
          console.log('✅ API Response successful');
          console.log(`   - Service found: ${apiData.service?.name || 'Unknown'}`);
          console.log(`   - Providers returned: ${apiData.service?.providers?.length || 0}`);
        } else {
          console.log('❌ API Response failed:', response.status);
        }
      } catch (apiError) {
        console.log('❌ API Test failed:', apiError.message);
      }
    }

    // 4. Check service request schema
    console.log('\n📊 Checking service request capabilities...');
    try {
      const serviceRequestCount = await prisma.serviceRequest.count();
      console.log(`📈 Current service requests in system: ${serviceRequestCount}`);
    } catch (serviceRequestError) {
      console.log('❌ Service request count failed:', serviceRequestError.message);
    }

    console.log('\n✨ Service Request Flow Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceRequestFlow();
