/**
 * @file ts-error-test.ts
 * @description A test file with TypeScript errors for testing the error management system
 */

// Error 1: Variable has implicit any type
function testFunction(param) {
  return param + 1;
}

// Error 2: Variable is used before being defined
console.log(undefinedVar);
let undefinedVar = 'This is defined too late';

// Error 3: Type mismatch
const numberValue: number = "This should be a number";

// Error 4: Function return type mismatch
function returnNumber(): number {
  return "This should return a number";
}

// Error 5: Accessing non-existent property
const obj = { name: 'Test Object' };
console.log(obj.nonExistentProperty);

// These don't have errors
const validNumber: number = 42;
const validString: string = "This is a valid string";
function validFunction(): string {
  return "This is valid";
}

export { testFunction, validNumber, validString, validFunction };