/**
 * Prisma-backed data access with a Prisma-like surface for legacy callers.
 */
import { ObjectId } from "mongodb";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { legacyMongoFilter } from "./id-resolve";
import { withMongoId, withMongoIds } from "./serialize-api";

export { prisma };

function resolveWhereId(where: { id?: string; _id?: ObjectId | string }) {
  if (where._id != null) {
    const raw =
      where._id instanceof ObjectId ? where._id.toString() : String(where._id);
    return legacyMongoFilter(raw);
  }
  if (where.id != null) {
    return legacyMongoFilter(String(where.id));
  }
  return where as Record<string, unknown>;
}

function mapOrderBy(orderBy?: Record<string, string>) {
  if (!orderBy) return undefined;
  const entries = Object.entries(orderBy).map(([key, dir]) => [
    key,
    dir === "desc" ? "desc" : "asc",
  ]);
  return Object.fromEntries(entries) as Prisma.OrderOrderByWithRelationInput;
}

const orderInclude = {
  orderItems: {
    include: {
      product: {
        select: {
          id: true,
          legacyMongoId: true,
          title: true,
          price: true,
          modelName: true,
          year: true,
          color: true,
          mileage: true,
          fuelType: true,
          imageURLs: true,
          category: true,
          description: true,
          condition: true,
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function serializeOrder(order: OrderWithItems) {
  const base = withMongoId(order);
  const orderItems = order.orderItems.map((item) => {
    const itemBase = withMongoId(item);
    const product = item.product ? withMongoId(item.product) : null;
    return {
      ...itemBase,
      productId: product ? product._id : item.productId,
      product,
    };
  });
  return { ...base, orderItems };
}

export const db = {
  user: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.user.findMany({ where: args?.where as Prisma.UserWhereInput });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string; email?: string } }) => {
      let row = null;
      if (args.where.email) {
        row = await prisma.user.findUnique({ where: { email: args.where.email } });
      } else {
        row = await prisma.user.findFirst({ where: resolveWhereId(args.where) });
      }
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.user.findFirst({ where: args?.where as Prisma.UserWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.UserCreateInput }) => {
      const row = await prisma.user.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.UserUpdateInput }) => {
      const row = await prisma.user.update({
        where: { id: (await prisma.user.findFirstOrThrow({ where: resolveWhereId(args.where) })).id },
        data: args.data,
      });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.user.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.user.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.user.count({ where: args?.where as Prisma.UserWhereInput }),
  },
  product: {
    findMany: async (args?: { where?: Record<string, unknown>; orderBy?: Record<string, string> }) => {
      const rows = await prisma.product.findMany({
        where: args?.where as Prisma.ProductWhereInput,
        orderBy: args?.orderBy as Prisma.ProductOrderByWithRelationInput,
      });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const row = await prisma.product.findFirst({ where: resolveWhereId(args.where) });
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.product.findFirst({ where: args?.where as Prisma.ProductWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.ProductCreateInput }) => {
      const row = await prisma.product.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.ProductUpdateInput }) => {
      const existing = await prisma.product.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.product.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.product.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.product.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.product.count({ where: args?.where as Prisma.ProductWhereInput }),
  },
  category: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.category.findMany({ where: args?.where as Prisma.CategoryWhereInput });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const row = await prisma.category.findFirst({ where: resolveWhereId(args.where) });
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.category.findFirst({ where: args?.where as Prisma.CategoryWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.CategoryCreateInput }) => {
      const row = await prisma.category.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.CategoryUpdateInput }) => {
      const existing = await prisma.category.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.category.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.category.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.category.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.category.count({ where: args?.where as Prisma.CategoryWhereInput }),
  },
  billboard: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.billboard.findMany({ where: args?.where as Prisma.BillboardWhereInput });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const row = await prisma.billboard.findFirst({ where: resolveWhereId(args.where) });
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.billboard.findFirst({ where: args?.where as Prisma.BillboardWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.BillboardCreateInput }) => {
      const row = await prisma.billboard.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.BillboardUpdateInput }) => {
      const existing = await prisma.billboard.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.billboard.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.billboard.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.billboard.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.billboard.count({ where: args?.where as Prisma.BillboardWhereInput }),
  },
  order: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.order.findMany({
        where: args?.where as Prisma.OrderWhereInput,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
      });
      return rows.map(serializeOrder);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const row = await prisma.order.findFirst({
        where: resolveWhereId(args.where),
        include: orderInclude,
      });
      return row ? serializeOrder(row) : null;
    },
    findFirst: async (args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      include?: unknown;
    }) => {
      const row = await prisma.order.findFirst({
        where: args?.where as Prisma.OrderWhereInput,
        orderBy: mapOrderBy(args?.orderBy),
        include: orderInclude,
      });
      return row ? serializeOrder(row) : null;
    },
    create: async (args: { data: Prisma.OrderCreateInput }) => {
      const row = await prisma.order.create({ data: args.data, include: orderInclude });
      return serializeOrder(row);
    },
    update: async (args: {
      where: { id?: string; _id?: ObjectId | string };
      data: Prisma.OrderUpdateInput;
      include?: unknown;
    }) => {
      const existing = await prisma.order.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.order.update({
        where: { id: existing.id },
        data: args.data,
        include: orderInclude,
      });
      return serializeOrder(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.order.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.order.delete({ where: { id: existing.id }, include: orderInclude });
      return serializeOrder(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.order.count({ where: args?.where as Prisma.OrderWhereInput }),
  },
  contactPage: {
    findMany: async () => {
      const rows = await prisma.contactPage.findMany();
      return withMongoIds(rows);
    },
    findUnique: async () => {
      const row = await prisma.contactPage.findFirst();
      return row ? withMongoId(row) : null;
    },
    findFirst: async () => {
      const row = await prisma.contactPage.findFirst();
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.ContactPageCreateInput }) => {
      const row = await prisma.contactPage.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.ContactPageUpdateInput }) => {
      const existing = await prisma.contactPage.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.contactPage.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.contactPage.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.contactPage.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async () => prisma.contactPage.count(),
  },
  size: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.size.findMany({ where: args?.where as Prisma.SizeWhereInput });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string; name?: string } }) => {
      let row = null;
      if (args.where.name) {
        row = await prisma.size.findUnique({ where: { name: args.where.name } });
      } else {
        row = await prisma.size.findFirst({ where: resolveWhereId(args.where) });
      }
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.size.findFirst({ where: args?.where as Prisma.SizeWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: { name: string } }) => {
      const row = await prisma.size.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.SizeUpdateInput }) => {
      const existing = await prisma.size.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.size.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.size.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.size.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.size.count({ where: args?.where as Prisma.SizeWhereInput }),
  },
  productSize: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.productSize.findMany({ where: args?.where as Prisma.ProductSizeWhereInput });
      return withMongoIds(rows);
    },
    findUnique: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const row = await prisma.productSize.findFirst({ where: resolveWhereId(args.where) });
      return row ? withMongoId(row) : null;
    },
    findFirst: async (args?: { where?: Record<string, unknown> }) => {
      const row = await prisma.productSize.findFirst({ where: args?.where as Prisma.ProductSizeWhereInput });
      return row ? withMongoId(row) : null;
    },
    create: async (args: { data: Prisma.ProductSizeCreateInput }) => {
      const row = await prisma.productSize.create({ data: args.data });
      return withMongoId(row);
    },
    update: async (args: { where: { id?: string; _id?: ObjectId | string }; data: Prisma.ProductSizeUpdateInput }) => {
      const existing = await prisma.productSize.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.productSize.update({ where: { id: existing.id }, data: args.data });
      return withMongoId(row);
    },
    delete: async (args: { where: { id?: string; _id?: ObjectId | string } }) => {
      const existing = await prisma.productSize.findFirstOrThrow({ where: resolveWhereId(args.where) });
      const row = await prisma.productSize.delete({ where: { id: existing.id } });
      return withMongoId(row);
    },
    count: async (args?: { where?: Record<string, unknown> }) =>
      prisma.productSize.count({ where: args?.where as Prisma.ProductSizeWhereInput }),
  },
  categorySize: {
    findMany: async (args?: { where?: Record<string, unknown> }) => {
      const rows = await prisma.categorySize.findMany({ where: args?.where as Prisma.CategorySizeWhereInput });
      return withMongoIds(rows);
    },
    create: async (args: { data: { categoryId: string; sizeId: string } }) => {
      const category = await prisma.category.findFirst({
        where: legacyMongoFilter(args.data.categoryId),
      });
      const size = await prisma.size.findFirst({
        where: legacyMongoFilter(args.data.sizeId),
      });
      if (!category || !size) {
        throw new Error("Category or size not found");
      }
      const row = await prisma.categorySize.create({
        data: { categoryId: category.id, sizeId: size.id },
      });
      return withMongoId(row);
    },
  },
};

// Legacy named exports (redirect to prisma)
export async function findMany(collection: string, filter: Record<string, unknown> = {}) {
  const model = (db as unknown as Record<string, { findMany: (a?: unknown) => Promise<unknown[]> }>)[
    collection.replace(/s$/, "").replace("categorie", "category")
  ];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.findMany({ where: filter });
}

export const findOne = findFirst;
export async function findFirst(collection: string, filter: Record<string, unknown> = {}) {
  const key = collection === "users" ? "user" : collection.replace(/s$/, "");
  const model = (db as unknown as Record<string, { findFirst: (a?: unknown) => Promise<unknown> }>)[key];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.findFirst({ where: filter });
}

export const findUnique = findFirst;

export async function create(collection: string, data: Record<string, unknown>) {
  const key =
    collection === "users"
      ? "user"
      : collection === "categorySize"
        ? "categorySize"
        : collection.replace(/s$/, "");
  const model = (db as unknown as Record<string, { create: (a: unknown) => Promise<unknown> }>)[key];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.create({ data });
}

export const insertOne = create;

export async function update(
  collection: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>
) {
  const key = collection === "users" ? "user" : collection.replace(/s$/, "");
  const model = (db as unknown as Record<string, { update: (a: unknown) => Promise<unknown> }>)[key];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.update({ where, data });
}

export const deleteOne = async (collection: string, where: Record<string, unknown>) => {
  const key = collection === "users" ? "user" : collection.replace(/s$/, "");
  const model = (db as unknown as Record<string, { delete: (a: unknown) => Promise<unknown> }>)[key];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.delete({ where });
};

export const count = async (collection: string, filter: Record<string, unknown> = {}) => {
  const key = collection === "users" ? "user" : collection.replace(/s$/, "");
  const model = (db as unknown as Record<string, { count: (a?: unknown) => Promise<number> }>)[key];
  if (!model) throw new Error(`Unknown collection: ${collection}`);
  return model.count({ where: filter });
};

export const countDocuments = count;
