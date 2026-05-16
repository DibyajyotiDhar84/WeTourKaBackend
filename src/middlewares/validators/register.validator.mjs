import {body,checkSchema} from 'express-validator'
import { ROLES, ROLES_noADMIN } from '../../constants.js';
// console.log(ROLES_noADMIN);

export const validateRegiter=[

    body('email')
        .notEmpty().withMessage('email is mandatory')
        .isEmail().withMessage('please provide a valid email address')
        .normalizeEmail(),

    body('name')
        .trim()
        .notEmpty().withMessage('provide your name')
        .isLength({min:3,max:12}).withMessage('name must of minimum 3 characters and maximum 12 characters')
        .matches(/[A-Za-z\s]+/).withMessage('Name must contain only letters and spaces'),

    body('password')
        .trim()
        .notEmpty().withMessage('password is required')
        .isLength({min:6}).withMessage('password must be atleast of 6 characters')
        .matches(/[A-Z]/).withMessage('must contains atleast one uppercase letter')
        .matches(/[a-z]/).withMessage('must contains atleast one lowercase letter')
        .matches(/[0-9]/).withMessage('must contains atleast one numeric character')
        .matches(/[@#$%!*&?]/).withMessage('must contains atleast one special character'),

    body('role')
        .notEmpty().withMessage('role is required')
        .isIn(ROLES.filter(r=>r!='ADMIN')).withMessage('invalid  role'),

    body('phone')
        .trim()
        .notEmpty().withMessage('phone number is required')
        .isMobilePhone('en-IN').withMessage('Invalid phone number')

];


export const validateRegisterSchema = checkSchema({
    email: {
        normalizeEmail: true,
        notEmpty: {
            errorMessage: 'Email is mandatory'
        },
        isEmail: {
            errorMessage: 'Please provide a valid email address'
        }
    },
    name: {
        trim: true,
        notEmpty: {
            errorMessage: 'Provide your name'
        },
        isLength: {
            options: { min: 3, max: 12 },
            errorMessage: 'Name must be between 3 and 12 characters'
        },
        matches: {
            options: /[A-Za-z\s]+/,
            errorMessage: 'Name must contain only letters and spaces'
        }
    },
    password: {
        trim: true,
        notEmpty: {
            errorMessage: 'Password is required'
        },
        isLength: {
            options: { min: 6 },
            errorMessage: 'Password must be at least 6 characters'
        },

        custom: {
            options: (value) => {
                const hasUpper = /[A-Z]/.test(value);
                const hasLower = /[a-z]/.test(value);
                const hasNumber = /[0-9]/.test(value);
                const hasSpecial = /[@#$%!*&?]/.test(value);
                
                if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                    throw new Error('Password must contain uppercase, lowercase, number, and special character');
                }
                return true;
            }
        }
    },
    role: {
        notEmpty: {
            errorMessage: 'Role is required'
        },
        isIn: {
            options: [ROLES], // Pass your roles array here
            errorMessage: 'Invalid role'
        }
    },
    phone: {
        trim: true,
        notEmpty: {
            errorMessage: 'Phone number is required'
        },
        isMobilePhone: {
            options: 'en-IN',
            errorMessage: 'Invalid phone number'
        }
    }
});