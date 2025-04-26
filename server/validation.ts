import { body, query, param, ValidationChain } from 'express-validator';

/**
 * User-related validation rules
 */
export const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    
    body('email')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  update: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    
    body('currentPassword')
      .optional()
      .notEmpty()
      .withMessage('Current password is required when changing password'),
    
    body('newPassword')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Password must contain at least one special character'),
    
    body('confirmNewPassword')
      .optional()
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ]
};

/**
 * Contact form validation
 */
export const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
    .escape()
];

/**
 * Newsletter subscription validation
 */
export const newsletterValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape()
];

/**
 * Product validation
 */
export const productValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters')
      .escape(),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .escape(),
    
    body('price')
      .isNumeric()
      .withMessage('Price must be a valid number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Price must be greater than 0');
        }
        return true;
      }),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .escape()
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .escape(),
    
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a valid number')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Price must be greater than 0');
        }
        return true;
      }),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('category')
      .optional()
      .trim()
      .escape()
  ]
};

/**
 * Blog post validation
 */
export const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .escape(),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape()
];

export const postValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .escape(),
    
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    
    body('categoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
  ],
  
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .escape(),
    
    body('content')
      .optional()
      .trim()
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    
    body('categoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
  ]
};

/**
 * Comment validation
 */
export const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 2, max: 1000 })
    .withMessage('Comment must be between 2 and 1000 characters')
    .escape(),
  
  body('authorId')
    .optional()
    .isInt()
    .withMessage('Author ID must be an integer'),
  
  body('postId')
    .isInt()
    .withMessage('Post ID must be an integer')
];

/**
 * Tour date validation
 */
export const tourDateValidation = {
  create: [
    body('venue')
      .trim()
      .notEmpty()
      .withMessage('Venue name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Venue name must be between 2 and 100 characters')
      .escape(),
    
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .escape(),
    
    body('date')
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date')
      .toDate(),
    
    body('ticketUrl')
      .optional()
      .isURL()
      .withMessage('Ticket URL must be a valid URL'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .escape()
  ],
  
  update: [
    body('venue')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Venue name must be between 2 and 100 characters')
      .escape(),
    
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .escape(),
    
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date')
      .toDate(),
    
    body('ticketUrl')
      .optional()
      .isURL()
      .withMessage('Ticket URL must be a valid URL'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .escape()
  ]
};

/**
 * Music validation
 */
export const musicValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters')
      .escape(),
    
    body('artist')
      .trim()
      .notEmpty()
      .withMessage('Artist name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Artist name must be between 1 and 100 characters')
      .escape(),
    
    body('albumId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Album ID must be a positive integer'),
    
    body('duration')
      .optional()
      .matches(/^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$/)
      .withMessage('Duration must be in the format HH:MM:SS')
  ],
  
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters')
      .escape(),
    
    body('artist')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Artist name must be between 1 and 100 characters')
      .escape(),
    
    body('albumId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Album ID must be a positive integer'),
    
    body('duration')
      .optional()
      .matches(/^([0-9]{2}):([0-5][0-9]):([0-5][0-9])$/)
      .withMessage('Duration must be in the format HH:MM:SS')
  ]
};

/**
 * Order validation
 */
export const orderValidation = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    
    body('items.*.productId')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),
    
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('shippingAddress')
      .notEmpty()
      .withMessage('Shipping address is required'),
    
    body('shippingAddress.name')
      .trim()
      .notEmpty()
      .withMessage('Recipient name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Recipient name must be between 2 and 100 characters')
      .escape(),
    
    body('shippingAddress.line1')
      .trim()
      .notEmpty()
      .withMessage('Address line 1 is required')
      .isLength({ min: 5, max: 100 })
      .withMessage('Address line 1 must be between 5 and 100 characters')
      .escape(),
    
    body('shippingAddress.line2')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Address line 2 must not exceed 100 characters')
      .escape(),
    
    body('shippingAddress.city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters')
      .escape(),
    
    body('shippingAddress.state')
      .trim()
      .notEmpty()
      .withMessage('State is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters')
      .escape(),
    
    body('shippingAddress.postalCode')
      .trim()
      .notEmpty()
      .withMessage('Postal code is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be between 3 and 20 characters')
      .escape(),
    
    body('shippingAddress.country')
      .trim()
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters')
      .escape(),
    
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['credit_card', 'paypal'])
      .withMessage('Payment method must be credit_card or paypal')
  ]
};

/**
 * Utility function to validate ID parameters
 */
export const validateId = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
];

/**
 * Pagination validation
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

/**
 * Password recovery validation
 */
export const passwordRecoveryValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
];

export const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];