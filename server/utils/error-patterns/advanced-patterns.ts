/**
 * Advanced Error Patterns
 * 
 * This file defines additional advanced error patterns for the TypeScript error management system.
 * These patterns are more specific and handle complex TypeScript errors.
 */

import { ErrorCategory, ErrorSeverity } from '../ts-error-analyzer';

/**
 * Advanced error pattern interface
 */
export interface AdvancedErrorPattern {
  id: string;
  name: string;
  description: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  // More specific pattern matching with refined regex
  regex: string;
  // Context-aware pattern that might check surrounding code
  contextPattern?: string;
  // Multiple possible fixes based on context
  fixes: Array<{
    description: string;
    applicability: string; // When this fix should be applied
    example: {
      before: string;
      after: string;
    };
    automated: boolean;
    // Additional metadata for fix application
    metadata?: Record<string, any>;
  }>;
  // Security implications if this error exists
  securityImplications?: {
    hasSecurity: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    cwe?: string; // Common Weakness Enumeration ID
  };
}

/**
 * Advanced error patterns collection
 */
export const advancedErrorPatterns: AdvancedErrorPattern[] = [
  // More sophisticated type assertion errors
  {
    id: 'advanced-type-assertion-1',
    name: 'Unsafe type assertion',
    description: 'Type assertion that bypasses type checking and could lead to runtime errors',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.HIGH,
    regex: '(?:value|\\w+)\\s+as\\s+(?:any|unknown)',
    contextPattern: '(?:cast|convert|transform|parse)',
    fixes: [
      {
        description: 'Use type guards instead of type assertions',
        applicability: 'When checking for specific properties',
        example: {
          before: "const user = data as any;\nconsole.log(user.name);",
          after: "const user = data as unknown;\nif ('name' in user && typeof user.name === 'string') {\n  console.log(user.name);\n}"
        },
        automated: true,
        metadata: {
          securityRisk: 'high',
          patternType: 'security-critical'
        }
      },
      {
        description: 'Create a proper type definition',
        applicability: 'When dealing with structured data',
        example: {
          before: "const config = data as any;",
          after: "interface Config {\n  endpoint: string;\n  timeout: number;\n}\n\nconst config = data as Config;"
        },
        automated: false
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'high',
      description: 'Unsafe type assertions can lead to runtime errors and potential security vulnerabilities like prototype pollution',
      cwe: 'CWE-1336'
    }
  },
  
  // Advanced null handling
  {
    id: 'advanced-null-handling-1',
    name: 'Complex nullability check',
    description: 'Code has complex nested accessing of potentially null/undefined values',
    category: ErrorCategory.NULL_REFERENCE,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Cannot read propert(?:y|ies) \'([^\']+)\' of (?:null|undefined)',
    fixes: [
      {
        description: 'Use optional chaining with fallback values',
        applicability: 'For deeply nested object access',
        example: {
          before: "const street = user.address.street;",
          after: "const street = user?.address?.street ?? 'Unknown';"
        },
        automated: true
      },
      {
        description: 'Add comprehensive null checks',
        applicability: 'When multiple operations depend on non-null values',
        example: {
          before: "if (user) {\n  const street = user.address.street;\n  const city = user.address.city;\n}",
          after: "if (user && user.address) {\n  const street = user.address.street;\n  const city = user.address.city;\n}"
        },
        automated: true
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'medium',
      description: 'Null reference errors can cause application crashes, leading to denial of service',
      cwe: 'CWE-476'
    }
  },
  
  // Advanced API integration errors
  {
    id: 'advanced-api-type-1',
    name: 'Incorrect API response typing',
    description: 'API response is typed incorrectly, leading to potential runtime errors',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.HIGH,
    regex: 'Property \'([^\']+)\' is missing in type \'([^\']+)\' but required in type',
    contextPattern: '(?:api|fetch|axios|response|data)',
    fixes: [
      {
        description: 'Update interface to match actual API response',
        applicability: 'When the API response structure is known and stable',
        example: {
          before: "interface ApiResponse {\n  id: string;\n  name: string;\n  required: boolean;\n}\n\nconst data: ApiResponse = await api.getData();",
          after: "interface ApiResponse {\n  id: string;\n  name: string;\n  required?: boolean;\n}\n\nconst data: ApiResponse = await api.getData();"
        },
        automated: true
      },
      {
        description: 'Add validation layer before type casting',
        applicability: 'When API responses may vary or are less predictable',
        example: {
          before: "const data: ApiResponse = await api.getData();",
          after: "const rawData = await api.getData();\nconst data: ApiResponse = validateApiResponse(rawData);"
        },
        automated: false
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'medium',
      description: 'Incorrect API typing can lead to data integrity issues and potentially security vulnerabilities if validation is bypassed',
      cwe: 'CWE-20'
    }
  },
  
  // Advanced React hook errors
  {
    id: 'advanced-react-hook-1',
    name: 'React hook dependency array issues',
    description: 'React hook has missing or unnecessary dependencies',
    category: ErrorCategory.FUNCTION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    regex: 'React Hook (?:useEffect|useCallback|useMemo) has (?:a missing|an unnecessary) dependency: \'([^\']+)\'',
    fixes: [
      {
        description: 'Add missing dependency to dependency array',
        applicability: 'When dependency is missing',
        example: {
          before: "useEffect(() => {\n  console.log(count);\n}, []);",
          after: "useEffect(() => {\n  console.log(count);\n}, [count]);"
        },
        automated: true
      },
      {
        description: 'Move dependency outside of effect or memoize it',
        applicability: 'When dependency should be stabilized',
        example: {
          before: "useEffect(() => {\n  const handler = () => setData(complexExpression(props));\n}, [props]);",
          after: "const memoizedExpression = useMemo(() => complexExpression(props), [props]);\nuseEffect(() => {\n  const handler = () => setData(memoizedExpression);\n}, [memoizedExpression]);"
        },
        automated: false
      }
    ]
  },
  
  // Advanced Express route errors
  {
    id: 'advanced-express-route-1',
    name: 'Express route parameter validation',
    description: 'Express route lacks proper parameter validation',
    category: ErrorCategory.FUNCTION_ERROR,
    severity: ErrorSeverity.HIGH,
    regex: 'router\\.(get|post|put|delete|patch)\\(\\s*[\'"`][^\'"]+[\'"`]\\s*,\\s*(?:async)?\\s*\\([^\\)]*\\)\\s*(?:=>)?\\s*\\{',
    contextPattern: '(?:req\\.params|req\\.body|req\\.query)',
    fixes: [
      {
        description: 'Add comprehensive parameter validation',
        applicability: 'When handling user input in routes',
        example: {
          before: "router.post('/api/users', (req, res) => {\n  const user = req.body;\n  db.createUser(user);\n});",
          after: "router.post('/api/users', (req, res) => {\n  const { name, email, age } = req.body;\n  \n  // Validate input\n  if (!name || typeof name !== 'string') {\n    return res.status(400).json({ error: 'Valid name is required' });\n  }\n  if (!email || !isValidEmail(email)) {\n    return res.status(400).json({ error: 'Valid email is required' });\n  }\n  if (age !== undefined && (typeof age !== 'number' || age < 0)) {\n    return res.status(400).json({ error: 'Age must be a positive number' });\n  }\n  \n  const user = { name, email, age };\n  db.createUser(user);\n});"
        },
        automated: false
      },
      {
        description: 'Add middleware for validation',
        applicability: 'When using a validation library',
        example: {
          before: "router.post('/api/users', (req, res) => {\n  const user = req.body;\n  db.createUser(user);\n});",
          after: "const userSchema = { /* validation schema */ };\n\nrouter.post('/api/users', validateSchema(userSchema), (req, res) => {\n  const user = req.body; // Already validated by middleware\n  db.createUser(user);\n});"
        },
        automated: false
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'high',
      description: 'Lack of input validation can lead to injection attacks and other security vulnerabilities',
      cwe: 'CWE-20'
    }
  },
  
  // Security-focused patterns
  {
    id: 'security-sensitive-data-1',
    name: 'Sensitive data exposure',
    description: 'Potentially sensitive data is being logged or exposed',
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.CRITICAL,
    regex: 'console\\.(log|info|warn|error)\\((?:.*?(?:password|token|key|secret|credential|auth).*?)\\)',
    fixes: [
      {
        description: 'Remove sensitive data logging',
        applicability: 'When sensitive data should never be logged',
        example: {
          before: "console.log('User authenticated with token:', token);",
          after: "console.log('User authenticated successfully');"
        },
        automated: true
      },
      {
        description: 'Use secure logging patterns',
        applicability: 'When logging is needed but must be secured',
        example: {
          before: "console.log('Auth details:', { username, password });",
          after: "secureLogger.auth('User authentication attempt', { username, password: '[REDACTED]' });"
        },
        automated: false
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'critical',
      description: 'Logging sensitive data can lead to credential exposure in log files',
      cwe: 'CWE-532'
    }
  },
  
  // Advanced generic type errors  
  {
    id: 'advanced-generic-1',
    name: 'Complex generic type constraints',
    description: 'Generic type parameter is not properly constrained',
    category: ErrorCategory.TYPE_MISMATCH,
    severity: ErrorSeverity.MEDIUM,
    regex: 'Type \'([^\']+)\' does not satisfy the constraint \'([^\']+)\'',
    fixes: [
      {
        description: 'Update generic type constraint',
        applicability: 'When constraint is too restrictive',
        example: {
          before: "function process<T extends string>(value: T): T {\n  return value;\n}\n\nprocess(123);",
          after: "function process<T extends string | number>(value: T): T {\n  return value;\n}\n\nprocess(123);"
        },
        automated: true
      },
      {
        description: 'Add type assertion with validation',
        applicability: 'When value needs runtime validation',
        example: {
          before: "function process<T extends Record<string, unknown>>(obj: T): T {\n  return obj;\n}\n\nprocess('not an object');",
          after: "function process<T extends Record<string, unknown>>(input: unknown): T {\n  if (typeof input !== 'object' || input === null) {\n    throw new Error('Input must be an object');\n  }\n  return input as T;\n}\n\nprocess('not an object'); // Will throw error"
        },
        automated: false
      }
    ]
  },
  
  // Promise handling errors
  {
    id: 'promise-handling-1',
    name: 'Unhandled promise rejection',
    description: 'Promise rejection is not properly handled',
    category: ErrorCategory.FUNCTION_ERROR,
    severity: ErrorSeverity.HIGH,
    regex: '(?:await )?(?:\\w+\\(.*\\)|fetch\\(.*\\)|axios\\.\\w+\\(.*\\))(?!\\s*\\.catch|\\s*catch\\s*\\{)',
    contextPattern: 'try|catch|then|await',
    fixes: [
      {
        description: 'Add try-catch block for await',
        applicability: 'When using await syntax',
        example: {
          before: "const data = await fetchData();",
          after: "let data;\ntry {\n  data = await fetchData();\n} catch (error) {\n  console.error('Failed to fetch data:', error);\n  // Handle error appropriately\n}"
        },
        automated: true
      },
      {
        description: 'Add catch handler for promise chains',
        applicability: 'When using promise chaining',
        example: {
          before: "fetchData().then(data => processData(data));",
          after: "fetchData()\n  .then(data => processData(data))\n  .catch(error => {\n    console.error('Error in data processing:', error);\n    // Handle error appropriately\n  });"
        },
        automated: true
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'medium',
      description: 'Unhandled promise rejections can lead to application crashes or unexpected behavior',
      cwe: 'CWE-755'
    }
  },
  
  // Data validation errors
  {
    id: 'data-validation-1',
    name: 'Missing data validation',
    description: 'Data from external sources is not properly validated',
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.HIGH,
    regex: '(?:req\\.(?:body|params|query)|fetch\\(.*\\)|axios\\.\\w+\\(.*\\)).*?(?!validate|sanitize|check)',
    contextPattern: 'api|endpoint|route',
    fixes: [
      {
        description: 'Add input validation with a schema validator',
        applicability: 'When processing structured data',
        example: {
          before: "app.post('/api/users', (req, res) => {\n  const userData = req.body;\n  db.createUser(userData);\n});",
          after: "app.post('/api/users', (req, res) => {\n  const userData = req.body;\n  \n  // Validate with zod/joi/etc\n  const userSchema = z.object({\n    name: z.string().min(2),\n    email: z.string().email(),\n    age: z.number().int().positive().optional()\n  });\n  \n  const result = userSchema.safeParse(userData);\n  if (!result.success) {\n    return res.status(400).json({ errors: result.error.issues });\n  }\n  \n  db.createUser(result.data);\n});"
        },
        automated: false,
        metadata: {
          securityRisk: 'high',
          requiredLibraries: ['zod', 'joi', 'yup']
        }
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'high',
      description: 'Lack of input validation can lead to injection attacks and data integrity issues',
      cwe: 'CWE-20'
    }
  },
  
  // SVG accessibility errors
  {
    id: 'svg-accessibility-1',
    name: 'Missing SVG accessibility attributes',
    description: 'SVG elements lack proper accessibility attributes',
    category: ErrorCategory.DECLARATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    regex: '<svg[^>]*>(?:(?!aria-label|aria-labelledby|title).)*</svg>',
    fixes: [
      {
        description: 'Add accessibility attributes to SVG',
        applicability: 'For all SVG elements',
        example: {
          before: "<svg viewBox=\"0 0 24 24\">\n  <path d=\"M12 6v6l4 2\"></path>\n</svg>",
          after: "<svg viewBox=\"0 0 24 24\" aria-label=\"Clock icon\" role=\"img\">\n  <title>Clock</title>\n  <path d=\"M12 6v6l4 2\"></path>\n</svg>"
        },
        automated: true
      }
    ]
  },
  
  // Performance issue patterns
  {
    id: 'performance-pattern-1',
    name: 'React component without memoization',
    description: 'React component that processes expensive calculations without memoization',
    category: ErrorCategory.FUNCTION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    regex: 'function\\s+([A-Z]\\w+)(?:\\s*:\\s*React\\.FC)?\\s*\\((?:\\s*\\{[^}]*\\}\\s*:|\\s*props\\s*:).*?\\{[\\s\\S]+?(?:sort|filter|map|reduce|some|every|find|includes)(?:\\([^)]*\\))+[\\s\\S]+?return',
    contextPattern: 'component|render',
    fixes: [
      {
        description: 'Add useMemo for expensive calculations',
        applicability: 'When a component has expensive calculations',
        example: {
          before: "function ProductList({ products }) {\n  const sortedProducts = products.sort((a, b) => a.price - b.price);\n  return <div>{sortedProducts.map(p => <Product key={p.id} product={p} />)}</div>;\n}",
          after: "function ProductList({ products }) {\n  const sortedProducts = useMemo(() => {\n    return [...products].sort((a, b) => a.price - b.price);\n  }, [products]);\n  \n  return <div>{sortedProducts.map(p => <Product key={p.id} product={p} />)}</div>;\n}"
        },
        automated: true,
        metadata: {
          impact: 'Performance',
          requiredImports: ['useMemo']
        }
      }
    ]
  },
  
  // Security-specific patterns for OpenAI integration
  {
    id: 'openai-security-1',
    name: 'Insecure OpenAI API key usage',
    description: 'OpenAI API key is used insecurely or exposed',
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.CRITICAL,
    regex: '(new\\s+OpenAI\\s*\\(\\s*\\{\\s*apiKey\\s*:\\s*(?!process\\.env)[\'"`][^\'"]+[\'"`])',
    fixes: [
      {
        description: 'Use environment variable for API key',
        applicability: 'Always for API keys',
        example: {
          before: "const openai = new OpenAI({ apiKey: 'sk-1234567890' });",
          after: "const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });"
        },
        automated: true,
        metadata: {
          securityRisk: 'critical',
          requiresEnvironmentVariable: 'OPENAI_API_KEY'
        }
      }
    ],
    securityImplications: {
      hasSecurity: true,
      severity: 'critical',
      description: 'Hardcoded API keys can be exposed in source code repositories, leading to unauthorized usage',
      cwe: 'CWE-798'
    }
  }
];

/**
 * Export the advanced patterns
 */
export default advancedErrorPatterns;