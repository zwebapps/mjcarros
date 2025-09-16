import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: ObjectId;
  name: string;
  price: number;
  description?: string;
  images: string[];
  categoryId: ObjectId;
  sizeId?: ObjectId;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id: ObjectId;
  name: string;
  billboardId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Billboard {
  _id: ObjectId;
  label: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Size {
  _id: ObjectId;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  _id: ObjectId;
  productId: ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: ObjectId;
  orderNumber: number;
  isPaid: boolean;
  phone: string;
  address: string;
  userEmail: string;
  orderItems: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateProductData {
  name: string;
  price: number;
  description?: string;
  images: string[];
  categoryId: string;
  sizeId?: string;
  isFeatured?: boolean;
  isArchived?: boolean;
}

export interface CreateOrderData {
  phone: string;
  address: string;
  userEmail: string;
  orderItems: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}
