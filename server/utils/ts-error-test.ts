/**
 * @file ts-error-test.ts
 * @description A test file with intentional TypeScript errors for testing the error management system
 */

// Error Type 1: Type mismatch (TS2322)
const userId: number = "123"; // Type string is not assignable to type number

// Error Type 2: Missing property (TS2741)
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const newUser: User = { 
  id: 1, 
  name: "John Doe",
  email: "john@example.com"
  // Missing 'role' property
};

// Error Type 3: Undefined variable (TS2304)
function processUser(user: User) {
  console.log(undefinedVariable); // Variable undefinedVariable is not defined
  return user;
}

// Error Type 4: Null reference (TS2532)
const maybeUser: User | null = null;
console.log(maybeUser.name); // Object is possibly null

// Error Type 5: Interface mismatch (TS2559)
interface Animal {
  name: string;
  species: string;
  makeSound(): void;
}

class Dog implements Animal {
  name: string;
  // Missing species property
  
  constructor(name: string) {
    this.name = name;
  }
  
  // Missing makeSound method
}

// Error Type 6: Import error (simulated)
import { nonExistentFunction } from './non-existent-file';

// Error Type 7: Generic constraint error (TS2344)
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const result = getProperty(newUser, "nonExistentProperty"); // "nonExistentProperty" is not assignable to parameter of type keyof User

// Error Type 8: Declaration error (TS2300)
enum UserStatus {
  Active,
  Inactive,
  Suspended
}

enum UserStatus { // Duplicate identifier UserStatus
  Pending,
  Verified
}

// Error Type 9: Syntax error (intentional)
function brokenFunction() {
  const x = {; // Syntax error
  return x;
}

// Export as a module
export { User, Animal, processUser, getProperty };