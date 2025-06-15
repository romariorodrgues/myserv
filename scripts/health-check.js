#!/usr/bin/env node

/**
 * MyServ System Health Check Script
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Tests key functionality after recent fixes
 */

const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

const tests = [
  {
    name: 'Health Check',
    url: `${baseUrl}/api/auth/providers`,
    expectedStatus: 200
  },
  {
    name: 'Login Page',
    url: `${baseUrl}/entrar`,
    expectedStatus: 200
  },
  {
    name: 'Services Search',
    url: `${baseUrl}/api/services/search?q=limpeza`,
    expectedStatus: 200
  },
  {
    name: 'Home Page',
    url: `${baseUrl}/`,
    expectedStatus: 200
  }
];

async function runTests() {
  console.log('🚀 Running MyServ System Health Check...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const success = response.status === test.expectedStatus;
      
      console.log(
        `${success ? '✅' : '❌'} ${test.name}: ${response.status} ${
          success ? '(PASS)' : `(FAIL - Expected ${test.expectedStatus})`
        }`
      );
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! MyServ is healthy.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
}

runTests().catch(console.error);
