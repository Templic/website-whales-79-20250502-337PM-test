/**
 * Check OpenAI Configuration
 * 
 * This script checks if the OpenAI API key is set and functional.
 * It's a simple utility to verify that our OpenAI integration will work.
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function checkOpenAIConfig() {
  console.log('Checking OpenAI configuration...');
  
  // Check if API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    console.log('Please make sure to add your OpenAI API key to the .env file or environment variables.');
    console.log('Example: OPENAI_API_KEY=your-api-key-here');
    process.exit(1);
  }
  
  console.log('✅ OPENAI_API_KEY environment variable is set.');
  
  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });
  
  try {
    // Test API connectivity with a simple request
    console.log('Testing OpenAI API connectivity...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: 'user', content: 'Hello! This is a test of OpenAI connectivity for TypeScript error analysis.' }],
      max_tokens: 50
    });
    
    if (response.choices && response.choices.length > 0) {
      console.log('✅ Successfully connected to OpenAI API!');
      console.log('Response preview: ' + response.choices[0].message.content.slice(0, 40) + '...');
      
      console.log('\nYour OpenAI configuration is ready to use for TypeScript error analysis.');
      console.log('You can now run the TypeScript error analysis and fixer tools.');
    } else {
      console.error('❌ Connected to OpenAI API, but received an unexpected response format.');
      console.log('Response:', JSON.stringify(response, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to OpenAI API:', error.message);
    console.log('Please check your API key and network connectivity.');
    
    if (error.message.includes('401')) {
      console.log('Error 401 indicates an authentication problem. Your API key may be invalid.');
    } else if (error.message.includes('429')) {
      console.log('Error 429 indicates rate limiting. You may have exceeded your API usage quota.');
    }
    
    process.exit(1);
  }
}

// Run the check
checkOpenAIConfig().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});