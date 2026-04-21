import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[a-zA-Z]+$/, 'Letters only'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z]+$/, 'Letters only'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include number')
    .regex(/[^A-Za-z0-9]/, 'Must include special character'),
  phoneNumber: z
    .string()
    .min(10, 'Minimum 10 digits')
    .max(15, 'Maximum 15 digits')
    .regex(/^[0-9]+$/, 'Numbers only'),
  country: z.string().optional(),
  sector: z.string().optional(),
});

export const registerBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  description: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #16a34a)')
    .optional(),
});

export const themeColorSchema = z.object({
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #16a34a)'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.string().optional(),
  description: z.string().optional(),
  category: z.number().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['COMING_SOON', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
});

export const inviteTeammateSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const deliveryLocationSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  amount: z.number().positive('Amount must be positive'),
});

export const checkoutSchema = z.object({
  orderType: z.enum(['PICKUP', 'DELIVERY']),
  locationId: z.number().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RegisterBusinessFormValues = z.infer<typeof registerBusinessSchema>;
export type UpdateSettingsFormValues = z.infer<typeof updateSettingsSchema>;
export type ThemeColorFormValues = z.infer<typeof themeColorSchema>;
export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type InviteTeammateFormValues = z.infer<typeof inviteTeammateSchema>;
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;
export type DeliveryLocationFormValues = z.infer<typeof deliveryLocationSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
