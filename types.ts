export interface Product {
  _id?: string;
  id: string;
  category: string;
  description: string;
  title: string;
  price: number;
  finalPrice?: number;
  discount?: number;
  featured: boolean;
  sold?: boolean;
  imageURLs: string[];
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
  // Car attributes
  modelName?: string;
  year?: number;
  stockQuantity?: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
}

export interface Image {
  id: string;
  url: string;
}

export interface Billboard {
  _id?: string;
  id: string;
  label: string;
  imageURL: string;
}

export interface Category {
  _id?: string;
  id: string;
  category: string;
  billboardId: string;
}

export interface RequestData {
  title: string;
  description: string;
  price: number;
  files: File[];
  featured: boolean;
  sold?: boolean;
  category: string;
  categoryId: string;
  discount?: number;
  // New optional attributes
  modelName?: string;
  year?: number;
  stockQuantity?: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
}
