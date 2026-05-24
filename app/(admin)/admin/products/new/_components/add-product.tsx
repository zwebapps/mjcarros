"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestData } from "@/types";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SimpleMDE from "react-simplemde-editor";
import { LocalImagePreview } from "@/components/admin/local-image-preview";
import {
  GalleryUploadField,
  galleryItemsToUrls,
} from "@/components/admin/gallery-upload-field";
import {
  uploadProductImages,
  type GalleryUploadItem,
} from "@/lib/admin-gallery-upload";
import "easymde/dist/easymde.min.css";
import { getProductDescriptionMdeOptions } from "@/lib/admin-product-mde-options";
import { mergeProductImageUrls } from "@/lib/product-image-urls";

type Category = {
  _id?: string;
  id: string;
  name: string;
  billboard: string;
  category: string;
};

type initialState = {
  title: string;
  description: string;
  price: string;
  category: string;
  files: File[];
  isFeatured: boolean;
  isSold: boolean;
  isNegotiable: boolean;
  categoryId: string;
  // sizes removed
  discount?: string;
  modelName?: string;
  year?: string;
  stockQuantity?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
  condition?: string;
};

const AddProduct = () => {
  const router = useRouter();
  // Sizes removed for cars

  const initialState = {
    title: "",
    description: "",
    price: "",
    category: "",
    categoryId: "",
    files: [],
    isFeatured: false,
    isSold: false,
    isNegotiable: false,
    // sizes removed
    discount: "",
    modelName: "",
    year: "",
    stockQuantity: "1",
    color: "",
    fuelType: "",
    transmission: "",
    mileage: "",
    condition: "",
  };

  const [category, setCategory] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataForm, setDataForm] = useState<initialState>(initialState);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryUploadItem[]>([]);

  // sizes removed
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    price: "",
    files: "",
    category: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resCategory = await axios.get("/api/categories");
        const data = resCategory.data;
        const categoriesWithIds = data.map((c: any, i: number) => ({
          ...c,
          id: c._id ? String(c._id) : (c.id ?? `category-${i}`),
          _id: c._id ? String(c._id) : c._id,
        }));
        setCategory(categoriesWithIds);
      } catch (error) {
        console.log("Error getting categories", error);
      }
    };

    fetchCategories();
  }, []);

  // no sizes fetching

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files as FileList;
    if (!selectedFiles?.length) return;

    const newFiles = Array.from(selectedFiles);
    const newPreviews = newFiles.map(
      (file) => URL.createObjectURL(file) as string
    );

    setDataForm((prevData) => ({
      ...prevData,
      files: [...prevData.files, ...newFiles],
    }));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeMainPreview = (index: number) => {
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setDataForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleCheckboxChange = (isChecked: boolean) => {
    setDataForm((prevData) => ({ ...prevData, isFeatured: isChecked }));
  };
  const handleSoldChange = (isChecked: boolean) => {
    setDataForm((prevData) => ({ ...prevData, isSold: isChecked }));
  };
  const handleNegotiableChange = (isChecked: boolean) => {
    setDataForm((prevData) => ({ ...prevData, isNegotiable: isChecked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({
      title: "",
      description: "",
      price: "",
      files: "",
      category: "",
    });

    const galleryUrls = galleryItemsToUrls(galleryItems);
    const hasImages = dataForm.files.length > 0 || galleryUrls.length > 0;

    if (
      !dataForm.title ||
      dataForm.title.length < 4 ||
      !dataForm.description ||
      dataForm.description.length < 4 ||
      !dataForm.price ||
      !hasImages ||
      !dataForm.category
    ) {
      setIsLoading(false);
      setErrors((prevErrors) => ({
        ...prevErrors,
        title:
          dataForm.title.length < 4
            ? "Title must be at least 4 characters"
            : "",
        description:
          dataForm.description.length < 4
            ? "Description must be at least 4 characters"
            : "",
        price: !dataForm.price ? "Please enter a price" : "",
        files: !hasImages
          ? "Add a main image or upload at least one gallery image"
          : "",
        category: !dataForm.category ? "Please select a category" : "",
      }));

      return;
    }

    if (galleryItems.some((i) => i.status === "uploading")) {
      setIsLoading(false);
      toast.error("Wait for gallery uploads to finish");
      return;
    }

    const convPrice = +dataForm.price;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) {
      setIsLoading(false);
      toast.error("Please sign in as admin");
      return;
    }

    let mainUrls: string[] = [];
    try {
      if (dataForm.files.length > 0) {
        mainUrls = await uploadProductImages(dataForm.files, token);
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload product images"
      );
      return;
    }

    const allImageUrls = mergeProductImageUrls(galleryUrls, mainUrls);

    if (allImageUrls.length === 0) {
      setIsLoading(false);
      toast.error("Add at least one image before creating the product");
      return;
    }

    const requestData: RequestData = {
      title: dataForm.title,
      description: dataForm.description,
      price: convPrice,
      files: dataForm.files,
      featured: dataForm.isFeatured,
      sold: dataForm.isSold,
      negotiable: dataForm.isNegotiable,
      category: dataForm.category,
      categoryId: dataForm.categoryId || dataForm.category,
      galleryURLs: allImageUrls,
      imageURLs: allImageUrls,
    };

    if (dataForm.discount !== undefined) {
      requestData.discount = +dataForm.discount;
    }
    // Optional car attributes
    if (dataForm.modelName) requestData.modelName = dataForm.modelName;
    if (dataForm.year) requestData.year = +dataForm.year;
    if (dataForm.stockQuantity) requestData.stockQuantity = +dataForm.stockQuantity;
    if (dataForm.color) requestData.color = dataForm.color;
    if (dataForm.fuelType) requestData.fuelType = dataForm.fuelType;
    if (dataForm.transmission) requestData.transmission = dataForm.transmission;
    if (dataForm.mileage) requestData.mileage = +dataForm.mileage;
    if (dataForm.condition) requestData.condition = dataForm.condition;

    const formData = new FormData();
    // Images already uploaded via /api/upload — URLs in requestData only (avoids duplicate files on server).
    formData.append("requestData", JSON.stringify(requestData));

    try {
      await axios.post("/api/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Product created successfully");

      router.push("/admin/products");
      setIsLoading(false);
      setImagePreviews([]);
      setGalleryItems([]);
    } catch (error) {
      setIsLoading(false);
      const msg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : axios.isAxiosError(error)
            ? error.message
            : "Something went wrong!";
      toast.error(msg);
      console.error("Create product failed:", error);
    }
  };

  // sizes removed

  const mdeOptions = useMemo(
    () => getProductDescriptionMdeOptions({}, "mjcarros-product-description-new"),
    []
  );

  return (
    <div className="flex justify-center items-center max-md:justify-start">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-y-2 max-md:min-w-[90%] min-w-[70%] border p-4 "
      >
        <label htmlFor="name">Enter Product Name</label>
        <Input
          value={dataForm.title}
          type="text"
          id="name"
          name="name"
          required
          placeholder="Enter Product name"
          onChange={(e) => setDataForm({ ...dataForm, title: e.target.value })}
        />
        {errors.title && <p className="text-red-500">{errors.title}</p>}
        <label htmlFor="price">Enter Product Price</label>
        <Input
          value={dataForm.price}
          type="number"
          id="price"
          min={1}
          name="price"
          required
          placeholder="Enter Product price"
          onChange={(e) => setDataForm({ ...dataForm, price: e.target.value })}
        />
        {errors.price && <p className="text-red-500">{errors.price}</p>}
        <label htmlFor="discount">Enter Product Discount</label>
        <Input
          value={dataForm.discount}
          type="number"
          id="discount"
          min={5}
          max={70}
          name="price"
          placeholder="Enter Product discount"
          onChange={(e) =>
            setDataForm({ ...dataForm, discount: e.target.value })
          }
        />
        <label htmlFor="description">Product Description</label>
        <SimpleMDE
          id="description"
          value={dataForm.description}
          onChange={(value) => setDataForm({ ...dataForm, description: value })}
          options={mdeOptions as any}
        />
        {errors.description && (
          <p className="text-red-500">{errors.description}</p>
        )}
        <label htmlFor="category">Choose a category</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          name="category"
          id="category"
          required
          value={dataForm.category}
          onChange={(e) => {
            const selectedCategory = category.find(
              (c) => c.category === e.target.value
            );
            setDataForm({
              ...dataForm,
              category: e.target.value,
              categoryId: selectedCategory?.id || "",
            });
          }}
        >
          <option value="">Select a category</option>
          {category.length > 0 &&
            category?.map((category) => {
              return (
                <option key={category.id} value={category.category}>
                  {category.category}
                </option>
              );
            })}
        </select>
        {/* Car-specific attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="modelName">Model Name</label>
            <Input id="modelName" value={dataForm.modelName || ''} onChange={(e) => setDataForm({ ...dataForm, modelName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="year">Year</label>
            <Input id="year" type="number" value={dataForm.year || ''} onChange={(e) => setDataForm({ ...dataForm, year: e.target.value })} />
          </div>
          <div>
            <label htmlFor="stockQuantity">Stock Quantity</label>
            <Input id="stockQuantity" type="number" min={1} value={dataForm.stockQuantity || '1'} onChange={(e) => setDataForm({ ...dataForm, stockQuantity: e.target.value })} />
          </div>
          <div>
            <label htmlFor="color">Color</label>
            <Input id="color" type="color" value={dataForm.color || '#000000'} onChange={(e) => setDataForm({ ...dataForm, color: e.target.value })} />
          </div>
          <div>
            <label htmlFor="fuelType">Fuel Type</label>
            <Input id="fuelType" value={dataForm.fuelType || ''} onChange={(e) => setDataForm({ ...dataForm, fuelType: e.target.value })} placeholder="petrol, diesel, electric" />
          </div>
          <div>
            <label htmlFor="transmission">Transmission</label>
            <select
              id="transmission"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dataForm.transmission || 'manual'}
              onChange={(e) => setDataForm({ ...dataForm, transmission: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
          <div>
            <label htmlFor="mileage">Mileage</label>
            <Input id="mileage" type="number" value={dataForm.mileage || ''} onChange={(e) => setDataForm({ ...dataForm, mileage: e.target.value })} />
          </div>
          <div>
            <label htmlFor="condition">Condition</label>
            <select
              id="condition"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dataForm.condition || 'new'}
              onChange={(e) => setDataForm({ ...dataForm, condition: e.target.value })}
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>
      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <div>
          <input
            type="checkbox"
            id="isNegotiable"
            name="isNegotiable"
            checked={dataForm.isNegotiable}
            onChange={(e) => handleNegotiableChange(e.target.checked)}
          />
        </div>
        <div className="space-y-1 leading-none">
          <p className="font-semibold">Negotiable</p>
          <div>Mark price as negotiable</div>
        </div>
      </div>
        {/* sizes UI removed */}
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <div>
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={dataForm.isFeatured}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
            />
          </div>
          <div className="space-y-1 leading-none">
            <p className="font-semibold">Featured</p>
            <div>This product will appear on the home page</div>
          </div>
        </div>
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <div>
            <input
              type="checkbox"
              id="isSold"
              name="isSold"
              checked={dataForm.isSold}
              onChange={(e) => handleSoldChange(e.target.checked)}
            />
          </div>
          <div className="space-y-1 leading-none">
            <p className="font-semibold">Sold</p>
            <div>Mark vehicle as sold (hidden from cart)</div>
          </div>
        </div>
        <label htmlFor="image">Add Product Image</label>
        <Input
          type="file"
          id="image"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          multiple
        />
        {errors.files && <p className="text-red-500">{errors.files}</p>}
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((preview, index) => (
              <LocalImagePreview
                key={`${preview}-${index}`}
                src={preview}
                alt={`Main image ${index + 1}`}
                onRemove={() => removeMainPreview(index)}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Main images upload when you click Add Product. Gallery images upload
          immediately when selected.
        </p>
        <GalleryUploadField
          items={galleryItems}
          onChange={setGalleryItems}
          disabled={isLoading}
        />
        <Button disabled={isLoading} className="mt-2 bg-green-600">
          Add Product
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
