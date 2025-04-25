/**
 * TypeScript Error Examples
 * 
 * This file contains examples of common TypeScript errors that can be detected
 * and analyzed by the Advanced TypeScript Error Analyzer.
 */

// ----- Example 1: Type Mismatch -----

// Error: Type 'string' is not assignable to type 'number'
const count: number = "5";

// Error: Type '{ firstName: string; }' is not assignable to type 'User'.
// Property 'lastName' is missing in type '{ firstName: string; }'
interface User {
  firstName: string;
  lastName: string;
  age: number;
}

const user: User = {
  firstName: "John"
  // Missing lastName and age
};

// ----- Example 2: Implicit Any -----

// Error: Parameter 'data' implicitly has an 'any' type
function processData(data) {
  return data.value;
}

// ----- Example 3: Null/Undefined Errors -----

// Error: Object is possibly 'null' or 'undefined'
function getUserName(user: User | null) {
  return user.firstName;
}

// ----- Example 4: Property Access Errors -----

// Error: Property 'middleName' does not exist on type 'User'
function getFullName(user: User) {
  return `${user.firstName} ${user.middleName} ${user.lastName}`;
}

// ----- Example 5: Unused Variables -----

// Error: 'unusedVar' is declared but its value is never read
function testFunction() {
  const unusedVar = 42;
  return "test";
}

// ----- Example 6: Function Return Type Errors -----

// Error: A function whose declared type is neither 'void' nor 'any' must return a value
function calculateTotal(items: number[]): number {
  const sum = items.reduce((total, item) => total + item, 0);
  // Missing return statement
}

// ----- Example 7: Interface Errors -----

// Error: Interface 'Car' incorrectly extends interface 'Vehicle'
interface Vehicle {
  type: string;
  year: number;
}

interface Car extends Vehicle {
  type: number; // Type mismatch with base interface
  make: string;
  model: string;
}

// ----- Example 8: Import Errors -----

// Error: Cannot find module './non-existent-module' or its corresponding type declarations
import { something } from './non-existent-module';

// ----- Example 9: Type Argument Errors -----

// Error: Generic type 'Array<T>' requires 1 type argument(s)
function getFirstItem<T>(items: Array): T {
  return items[0];
}

// ----- Example 10: Circular Reference -----

// Error: Type alias 'NodeType' circularly references itself
type NodeType = {
  parent: NodeType;
  children: NodeType[];
  value: string;
};

// ----- Example 11: Syntax Errors -----

// Error: '}' expected
function syntaxError() {
  if (true) {
    console.log("Missing closing brace"
  // Missing closing brace
  return true;
}

// ----- Example 12: Property Initialization Errors -----

// Error: Property 'name' has no initializer and is not definitely assigned in the constructor
class Person {
  name: string;
  age: number = 0;
  
  constructor() {
    // Missing initialization of 'name'
  }
}

// ----- Example 13: Promise Errors -----

// Error: Property 'then' is missing in type 'void' but required in type 'Promise<void>'
async function asyncFunction() {
  const promise = new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
  
  return asyncOperation();
}

function asyncOperation() {
  console.log("This is not an async function");
  // Missing return of Promise
}

// ----- Example 14: Exported Type Errors -----

// These errors affect other files that import from this one
export interface ExportedInterface {
  id: number;
  name: string;
}

// Error: Type '{ id: number; }' is missing the following properties from type 'ExportedInterface': name
export const sampleExport: ExportedInterface = {
  id: 1
  // Missing 'name' property
};

// ----- Example 15: JSX Component Errors -----

// In a React component file, this would cause:
// Error: JSX element type 'Button' does not have any construct or call signatures
type ButtonProps = {
  label: string;
  onClick: () => void;
};

// This is a mock representation - in real code would be a React component
const Button = {
  displayName: 'Button'
};

function renderButton() {
  // @ts-ignore - To prevent syntax errors in non-React environment
  return <Button label="Click me" />;
}

export {
  User,
  processData,
  getUserName,
  getFullName,
  testFunction,
  calculateTotal,
  Vehicle,
  Car,
  getFirstItem,
  NodeType,
  syntaxError,
  Person,
  asyncFunction,
  Button,
  renderButton
};