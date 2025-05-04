/**
 * OpenAI API Test Script
 * 
 * This script tests the connection to the OpenAI API using the provided API key.
 * Run this script to verify that your OPENAI_API_KEY is working correctly.
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

async function testOpenAI() {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY environment variable is not set.');
      console.error('Please make sure you have added your OpenAI API key in the secrets settings.');
      process.exit(1);
    }

    console.log('🔑 OpenAI API key found in environment variables');
    
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('🔄 Testing connection to OpenAI API...');
    
    // Make a simple completion request
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello! This is a test of the OpenAI API connection from Dale Loves Whales app." }
      ],
      max_tokens: 100
    });
    
    // Extract the response
    const message = response.choices[0].message.content;
    
    console.log('✅ OpenAI API connection successful!');
    console.log('📝 Response from OpenAI:');
    console.log('------------------------');
    console.log(message);
    console.log('------------------------');
    console.log('Model used:', response.model);
    console.log('Token usage:', response.usage);
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to OpenAI API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    
    console.error('\n🔍 Troubleshooting tips:');
    console.error('1. Check that your API key is valid and not expired');
    console.error('2. Verify you have sufficient credits in your OpenAI account');
    console.error('3. Ensure the model you\'re using is available to your account');
    console.error('4. Check for any network or firewall issues');
    
    return false;
  }
}

// Run the test
testOpenAI();