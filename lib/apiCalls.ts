import { Category, Product } from "@/types";
import axios from "axios";

export async function getProduct(productId: string) {
  const res = await axios.get(`/api/product/${productId}`);
  return res.data;
}

export async function getCategoryProducts(category: string) {
  const res = await axios.get(`/api/product/category/${category}`);
  return res.data;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const res = await axios.get(`/api/categories`);
    return res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getCategory = async (category: string): Promise<Category[]> => {
  try {
    const res = await axios.get(`/api/categories/edit/${category}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return [];
  }
};

export async function getAllProducts() {
  try {
    const res = await axios.get(`/api/product/`);
    return res.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getFeaturedProducts() {
  try {
    const res = await axios.get(`/api/product/`);
    const featured = res.data.filter((product: Product) => product.featured);
    return featured;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}
