import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros';

// MongoDB utility functions to replace Prisma operations
export class MongoDBUtils {
  private static client: MongoClient | null = null;

  static async getClient(): Promise<MongoClient> {
    if (!this.client) {
      this.client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await this.client.connect();
    }
    return this.client;
  }

  static async getDb() {
    const client = await this.getClient();
    return client.db('mjcarros');
  }

  // Generic find operations
  static async findMany(collection: string, filter: any = {}, options: any = {}) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    
    let query = coll.find(filter);
    
    if (options.sort) {
      query = query.sort(options.sort);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.skip) {
      query = query.skip(options.skip);
    }
    
    return await query.toArray();
  }

  static async findOne(collection: string, filter: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    return await coll.findOne(filter);
  }

  static async findFirst(collection: string, filter: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    return await coll.findOne(filter);
  }

  static async findUnique(collection: string, filter: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    return await coll.findOne(filter);
  }

  // Generic create operations
  static async create(collection: string, data: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    const result = await coll.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...data, _id: result.insertedId, createdAt: new Date(), updatedAt: new Date() };
  }

  static async insertOne(collection: string, data: any) {
    return this.create(collection, data);
  }

  // Generic update operations
  static async update(collection: string, filter: any, data: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    const result = await coll.updateOne(filter, {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    });
    return result;
  }

  // Generic delete operations
  static async delete(collection: string, filter: any) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    return await coll.deleteOne(filter);
  }

  // Generic count operations
  static async count(collection: string, filter: any = {}) {
    const db = await this.getDb();
    const coll = db.collection(collection);
    return await coll.countDocuments(filter);
  }

  static async countDocuments(collection: string, filter: any = {}) {
    return this.count(collection, filter);
  }

  // Close connection
  static async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}

// Export individual functions for backward compatibility
export const findMany = MongoDBUtils.findMany.bind(MongoDBUtils);
export const findOne = MongoDBUtils.findOne.bind(MongoDBUtils);
export const findFirst = MongoDBUtils.findFirst.bind(MongoDBUtils);
export const findUnique = MongoDBUtils.findUnique.bind(MongoDBUtils);
export const create = MongoDBUtils.create.bind(MongoDBUtils);
export const insertOne = MongoDBUtils.insertOne.bind(MongoDBUtils);
export const update = MongoDBUtils.update.bind(MongoDBUtils);
export const deleteOne = MongoDBUtils.delete.bind(MongoDBUtils);
export const count = MongoDBUtils.count.bind(MongoDBUtils);
export const countDocuments = MongoDBUtils.countDocuments.bind(MongoDBUtils);
