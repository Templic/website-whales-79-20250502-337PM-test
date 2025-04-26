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

// Fixed: Added type to the parameter
function processData(data: { value: string }) {
  return data.value;
}

// ----- Example 3: Null/Undefined Errors -----

// Fixed: Added null check
function getUserName(user: User | null) {
  // Added null check before accessing property
  return user ? user.firstName : 'Unknown';
}

// ----- Example 4: Property Access Errors -----

// Fixed: Removed non-existent property access
function getFullName(user: User) {
  // Removed reference to non-existent 'middleName'
  return `${user.firstName} ${user.lastName}`;
}

// ----- Example 5: Unused Variables -----

// Error: 'unusedVar' is declared but its value is never read
function testFunction() {
  const unusedVar = 42;
  return "test";
}

// ----- Example 6: Function Return Type Errors -----

// Fixed: Added missing return statement
function calculateTotal(items: number[]): number {
  const sum = items.reduce((total, item) => total + item, 0);
  // Added return statement
  return sum;
}

// ----- Example 7: Interface Errors -----

// Error: Interface 'Car' incorrectly extends interface 'Vehicle'
interface Vehicle {
  type: string;
  year: number;
}

interface Car extends Vehicle {
  type: string; // Fixed type to match base interface
  make: string;
  model: string;
}

// ----- Example 8: Import Errors -----

// Error: Cannot find module './non-existent-module' or its corresponding type declarations
import { something } from './non-existent-module';

// ----- Example 9: Type Argument Errors -----

// Fixed: Added the type argument to Array<T>
function getFirstItem<T>(items: Array<T>): T {
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
    console.log("Missing closing brace");
  }
  // Fixed missing closing brace
  return true;
}

// ----- Example 12: Property Initialization Errors -----

// Fixed: Added initialization of 'name' in the constructor
class Person {
  name: string;
  age: number = 0;
  
  constructor() {
    // Added initialization for 'name'
    this.name = "Default Name";
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

function asyncOperation(): Promise<void> {
  console.log("Now this function returns a Promise");
  // Added return of Promise
  return Promise.resolve();
}

// ----- Example 14: Exported Type Errors -----

// These errors affect other files that import from this one
export interface ExportedInterface {
  id: number;
  name: string;
}

// Fixed: Added missing 'name' property
export const sampleExport: ExportedInterface = {
  id: 1,
  name: 'Sample Name'
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
  // Fixed JSX-like syntax with a string template
  return `<Button label="Click me" />`;
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