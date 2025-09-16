// Temporary stub file to prevent build errors
// This file provides MongoDB-compatible methods to replace Prisma

import { MongoDBUtils } from './mongodb-utils';

// Create a mock db object that provides MongoDB-compatible methods
export const db = {
  user: {
    findMany: (filter: any) => MongoDBUtils.findMany('users', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('users', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('users', filter),
    create: (data: any) => MongoDBUtils.create('users', data.data || data),
    update: (params: any) => MongoDBUtils.update('users', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('users', params.where),
    count: (filter: any) => MongoDBUtils.count('users', filter),
  },
  product: {
    findMany: (filter: any) => MongoDBUtils.findMany('products', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('products', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('products', filter),
    create: (data: any) => MongoDBUtils.create('products', data.data || data),
    update: (params: any) => MongoDBUtils.update('products', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('products', params.where),
    count: (filter: any) => MongoDBUtils.count('products', filter),
  },
  category: {
    findMany: (filter: any) => MongoDBUtils.findMany('categories', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('categories', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('categories', filter),
    create: (data: any) => MongoDBUtils.create('categories', data.data || data),
    update: (params: any) => MongoDBUtils.update('categories', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('categories', params.where),
    count: (filter: any) => MongoDBUtils.count('categories', filter),
  },
  billboard: {
    findMany: (filter: any) => MongoDBUtils.findMany('billboards', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('billboards', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('billboards', filter),
    create: (data: any) => MongoDBUtils.create('billboards', data.data || data),
    update: (params: any) => MongoDBUtils.update('billboards', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('billboards', params.where),
    count: (filter: any) => MongoDBUtils.count('billboards', filter),
  },
  order: {
    findMany: (filter: any) => MongoDBUtils.findMany('orders', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('orders', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('orders', filter),
    create: (data: any) => MongoDBUtils.create('orders', data.data || data),
    update: (params: any) => MongoDBUtils.update('orders', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('orders', params.where),
    count: (filter: any) => MongoDBUtils.count('orders', filter),
  },
  contactPage: {
    findMany: (filter: any) => MongoDBUtils.findMany('contactPages', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('contactPages', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('contactPages', filter),
    create: (data: any) => MongoDBUtils.create('contactPages', data.data || data),
    update: (params: any) => MongoDBUtils.update('contactPages', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('contactPages', params.where),
    count: (filter: any) => MongoDBUtils.count('contactPages', filter),
  },
  productSize: {
    findMany: (filter: any) => MongoDBUtils.findMany('productSizes', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('productSizes', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('productSizes', filter),
    create: (data: any) => MongoDBUtils.create('productSizes', data.data || data),
    update: (params: any) => MongoDBUtils.update('productSizes', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('productSizes', params.where),
    count: (filter: any) => MongoDBUtils.count('productSizes', filter),
  },
  size: {
    findMany: (filter: any) => MongoDBUtils.findMany('sizes', filter),
    findUnique: (filter: any) => MongoDBUtils.findUnique('sizes', filter),
    findFirst: (filter: any) => MongoDBUtils.findFirst('sizes', filter),
    create: (data: any) => MongoDBUtils.create('sizes', data.data || data),
    update: (params: any) => MongoDBUtils.update('sizes', params.where, params.data),
    delete: (params: any) => MongoDBUtils.delete('sizes', params.where),
    count: (filter: any) => MongoDBUtils.count('sizes', filter),
  },
};

// Export utility functions for backward compatibility
export { findMany, findOne, findFirst, findUnique, create, insertOne, update, deleteOne, count, countDocuments } from './mongodb-utils';
