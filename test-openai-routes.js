/**
 * Test script for OpenAI Routes
 * 
 * This script tests the OpenAI routes in our application by making direct requests to the API.
 * It bypasses the web server and calls the OpenAI client directly to verify integration.
 */

import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test the completions route functionality
async function testCompletions() {
  try {
    console.log('\n--- Testing OpenAI Completions ---');
    
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for Dale Loves Whales, responding with cosmic and ocean-related wisdom.' },
        { role: 'user', content: 'Tell me about the connection between whales and the cosmos in 50 words' }
      ],
      max_tokens: 200,
    });
    
    console.log('Response from OpenAI:');
    console.log(response.choices[0].message.content);
    console.log('Model used:', response.model);
    console.log('Tokens used:', response.usage.total_tokens);
    
    return true;
  } catch (error) {
    console.error('Error testing OpenAI completions:', error);
    return false;
  }
}

// Test the images route functionality
async function testImageGeneration() {
  try {
    console.log('\n--- Testing OpenAI Image Generation ---');
    
    const response = await openai.images.generate({
      prompt: 'A cosmic whale swimming through a nebula, sacred geometry patterns visible in its wake, artistic style',
      model: 'dall-e-3',
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    
    console.log('Image URL:');
    console.log(response.data[0].url);
    
    return true;
  } catch (error) {
    console.error('Error testing OpenAI image generation:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('========================================');
  console.log('Starting OpenAI Route Integration Tests');
  console.log('========================================');
  
  const completionsSuccess = await testCompletions();
  const imageSuccess = await testImageGeneration();
  
  console.log('\n========================================');
  console.log('Test Results:');
  console.log('- Completions Test:', completionsSuccess ? 'PASSED' : 'FAILED');
  console.log('- Image Generation Test:', imageSuccess ? 'PASSED' : 'FAILED');
  console.log('========================================');
  
  if (completionsSuccess && imageSuccess) {
    console.log('✅ All tests passed! OpenAI integration is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests();