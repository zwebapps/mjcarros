"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useMemo, useState } from "react";
import { type SizeProduct, type createData } from "./edit-product";
import axios from "axios";
import toast from "react-hot-toast";
import {
  GalleryUploadField,
  galleryItemsToUrls,
} from "@/components/admin/gallery-upload-field";
import { LocalImagePreview } from "@/components/admin/local-image-preview";
import {
  uploadProductImages,
  type GalleryUploadItem,
} from "@/lib/admin-gallery-upload";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

type EditFormProps = {
  data: createData;
  onSubmit: (formData: FormData) => void;
};

type Category = {
  _id?: string;
  id: string;
  name: string;
  billboard: string;
  category: string;
};

type InitialType = {
  title: string;
  description: string;
  price: number;
  category: string;
  files: File[];
  isFeatured: boolean;
  isSold?: boolean;
  negotiable?: boolean;
  productSizes?: SizeProduct[];
  categoryId: string;
  discount?: number;
  modelName?: string;
  year?: number;
  stockQuantity?: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  condition?: string;
};

const EditForm = ({ data, onSubmit }: EditFormProps) => {
  const {
    title,
    description,
    imageURLs,
    category,
    price,
    featured,
    productSizes,
    categoryId,
    discount,
    modelName,
    year,
    stockQuantity,
    color,
    fuelType,
    transmission,
    mileage,
    condition,
  } = data;

  const initialState = {
    title,
    description,
    price,
    category,
    files: [],
    isFeatured: featured,
    isSold: (data as any).sold || false,
    negotiable: (data as any).negotiable || false,
    productSizes: productSizes,
    categoryId,
    discount,
    modelName,
    year,
    stockQuantity,
    color,
    fuelType,
    transmission,
    mileage,
    condition,
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkbox, setCheckBox] = useState<boolean>(featured);
  const [soldCheckbox, setSoldCheckbox] = useState<boolean>((data as any).sold || false);
  const [negotiableCheckbox, setNegotiableCheckbox] = useState<boolean>((data as any).negotiable || false);
  const [previewImage, setPreviewImage] = useState<string[]>();
  const [dataForm, setDataForm] = useState<InitialType>(initialState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryUploadItem[]>([]);

  const handleCheckboxChange = () => {
    setCheckBox((prevCheck) => !prevCheck);
  };
  const handleSoldCheckboxChange = () => {
    setSoldCheckbox((prevCheck) => !prevCheck);
  };
  const handleNegotiableCheckboxChange = () => {
    setNegotiableCheckbox((prevCheck) => !prevCheck);
  };

  useEffect(() => {
    setCheckBox(featured);
    setSoldCheckbox((data as any).sold || false);
    setNegotiableCheckbox((data as any).negotiable || false);
  }, [featured]);

  // Only reset gallery from server when switching products. Do not depend on `imageURLs`
  // reference — React Query refetches would wipe locally uploaded URLs before Save.
  const productKey = data._id || data.id || "";
  useEffect(() => {
    setPreviewImage(imageURLs);
    setGalleryItems([]);
    setDataForm({
      title,
      description,
      price,
      category,
      files: [],
      isFeatured: featured,
      isSold: (data as any).sold || false,
      negotiable: (data as any).negotiable || false,
      productSizes,
      categoryId,
      discount,
      modelName,
      year,
      stockQuantity: (typeof stockQuantity === "number"
        ? String(stockQuantity)
        : (stockQuantity || "1")) as any,
      color,
      fuelType,
      transmission,
      mileage,
      condition,
    });
  }, [productKey]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resCategory = await axios.get("/api/categories");
        const data = resCategory.data;
        
        // Ensure each category has a unique identifier
        const categoriesWithUniqueIds = data.map((category: any, index: number) => ({
          ...category,
          id: category._id?.toString() || category.id || `category-${index}`,
          _id: category._id,
        }));
        
        setCategories(categoriesWithUniqueIds);
      } catch (error) {
        console.log("Error getting categories", error);
      }
    };

    fetchCategories();
  }, []);
  // sizes removed

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
    setPreviewImage((prev) => [...(prev || []), ...newPreviews]);
    e.target.value = "";
  };

  const removePreviewAt = (index: number) => {
    setPreviewImage((prev) => {
      if (!prev) return prev;
      const url = prev[index];
      if (url?.startsWith("blob:")) {
        const blobIndex = prev
          .slice(0, index)
          .filter((u) => u.startsWith("blob:")).length;
        URL.revokeObjectURL(url);
        setDataForm((prevForm) => ({
          ...prevForm,
          files: prevForm.files.filter((_, i) => i !== blobIndex),
        }));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const buildEditFormData = (imageUrls: string[]) => {
    const formData = new FormData();
    formData.append("name", dataForm.title);
    formData.append("price", String(dataForm.price));
    if (dataForm.discount != null && dataForm.discount !== undefined) {
      formData.append("discount", String(dataForm.discount));
    }
    formData.append("description", dataForm.description);
    formData.append("category", dataForm.category);
    formData.append("modelName", dataForm.modelName || "");
    formData.append("year", String(dataForm.year || 0));
    formData.append("stockQuantity", String(dataForm.stockQuantity ?? 1));
    formData.append("color", dataForm.color || "");
    formData.append("fuelType", dataForm.fuelType || "");
    formData.append("transmission", dataForm.transmission || "manual");
    formData.append("mileage", String(dataForm.mileage ?? 0));
    formData.append("condition", dataForm.condition || "new");
    formData.append("isFeatured", checkbox.toString());
    formData.append("isSold", soldCheckbox.toString());
    formData.append("negotiable", negotiableCheckbox.toString());
    formData.append("existingImageURLs", JSON.stringify(imageUrls));
    return formData;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (galleryItems.some((i) => i.status === "uploading")) {
      toast.error("Wait for gallery uploads to finish");
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) {
      toast.error("Please sign in as admin");
      return;
    }

    setIsLoading(true);

    const galleryUrls = galleryItemsToUrls(galleryItems);
    const persisted = (previewImage || []).filter(
      (img) => !img.startsWith("blob:")
    );

    let uploadedMain: string[] = [];
    try {
      if (dataForm.files.length > 0) {
        uploadedMain = await uploadProductImages(dataForm.files, token);
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload product images"
      );
      return;
    }

    const merged = Array.from(
      new Set([...persisted, ...uploadedMain, ...galleryUrls])
    );

    if (merged.length === 0) {
      setIsLoading(false);
      toast.error(
        "Add at least one image (product image or gallery) before saving"
      );
      return;
    }

    const formData = buildEditFormData(merged);

    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  // sizes removed

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-y-2 max-md:min-w-[90%] min-w-[70%] border p-4"
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
      <input type="hidden" name="description" value={dataForm.description} />
      <label htmlFor="price">Enter Product Price</label>
      <Input
        value={dataForm.price}
        type="number"
        id="price"
        min={1}
        name="price"
        required
        placeholder="Enter Product price"
        onChange={(e) => setDataForm({ ...dataForm, price: +e.target.value })}
      />
      <label htmlFor="discount">Enter Product Discount</label>
      <Input
        value={dataForm.discount || ""}
        type="number"
        id="discount"
        min={5}
        max={70}
        name="discount"
        placeholder="Enter Product discount"
        onChange={(e) =>
          setDataForm({ ...dataForm, discount: +e.target.value })
        }
      />
      <label htmlFor="description">Product Description</label>
      <SimpleMDE
        id="description"
        value={dataForm.description}
        onChange={(value) => setDataForm({ ...dataForm, description: value })}
        options={useMemo(() => ({
          spellChecker: false,
          status: false,
          sideBySide: true,
          autoDownloadFontAwesome: false,
          placeholder:
            "Use Enter for new lines. Headings (##), lists (-), tables (|). Pasted specs break onto separate lines on the shop page.",
        }), []) as any}
      />

      <label htmlFor="category">Choose a category</label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        name="category"
        id="category"
        value={dataForm.category}
        onChange={(e) => setDataForm({ ...dataForm, category: e.target.value })}
      >
        {categories.map((category, index) => (
          <option key={category._id || category.id || `category-${index}`} value={category.category}>
            {category.category}
          </option>
        ))}
      </select>
      {/* Car-specific fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="modelName">Model Name</label>
          <Input id="modelName" name="modelName" value={dataForm.modelName || ''} onChange={(e) => setDataForm({ ...dataForm, modelName: e.target.value })} />
        </div>
        <div>
          <label htmlFor="year">Year</label>
          <Input id="year" name="year" type="number" value={dataForm.year || 0} onChange={(e) => setDataForm({ ...dataForm, year: +e.target.value })} />
        </div>
        <div>
          <label htmlFor="stockQuantity">Stock Quantity</label>
          <Input id="stockQuantity" name="stockQuantity" type="number" min={1} value={dataForm.stockQuantity as any || '1'} onChange={(e) => setDataForm({ ...dataForm, stockQuantity: +e.target.value })} />
        </div>
        <div>
          <label htmlFor="color">Color</label>
          <Input id="color" name="color" type="text" placeholder="e.g., Black Sapphire, Pearl White" value={dataForm.color || ''} onChange={(e) => setDataForm({ ...dataForm, color: e.target.value })} />
        </div>
        <div>
          <label htmlFor="fuelType">Fuel Type</label>
          <Input id="fuelType" name="fuelType" value={dataForm.fuelType || ''} onChange={(e) => setDataForm({ ...dataForm, fuelType: e.target.value })} placeholder="petrol, diesel, electric" />
        </div>
        <div>
          <label htmlFor="transmission">Transmission</label>
          <select
            id="transmission"
            name="transmission"
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
          <Input id="mileage" name="mileage" type="number" value={dataForm.mileage || 0} onChange={(e) => setDataForm({ ...dataForm, mileage: +e.target.value })} />
        </div>
        <div>
          <label htmlFor="condition">Condition</label>
          <select
            id="condition"
            name="condition"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={dataForm.condition || 'new'}
            onChange={(e) => setDataForm({ ...dataForm, condition: e.target.value })}
          >
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>
      </div>
      {/* sizes UI removed */}
      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <div>
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={checkbox}
            onChange={handleCheckboxChange}
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
            checked={soldCheckbox}
            onChange={handleSoldCheckboxChange}
          />
        </div>
        <div className="space-y-1 leading-none">
          <p className="font-semibold">Sold</p>
          <div>Mark vehicle as sold (hidden from cart)</div>
        </div>
      </div>
      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <div>
          <input
            type="checkbox"
            id="negotiable"
            name="negotiable"
            checked={negotiableCheckbox}
            onChange={handleNegotiableCheckboxChange}
          />
        </div>
        <div className="space-y-1 leading-none">
          <p className="font-semibold">Negotiable</p>
          <div>Mark price as negotiable</div>
        </div>
      </div>
      <label htmlFor="image">Change product image</label>
      <Input
        type="file"
        id="image"
        name="image"
        accept="image/*"
        onChange={handleFileChange}
        multiple
      />
      {previewImage && previewImage.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previewImage.map((preview, index) => (
            <LocalImagePreview
              key={`${preview}-${index}`}
              src={preview}
              alt={`Product image ${index + 1}`}
              onRemove={() => removePreviewAt(index)}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Product images above. Gallery below uploads separately and is saved on
        Submit.
      </p>
      <GalleryUploadField
        items={galleryItems}
        onChange={setGalleryItems}
        disabled={isLoading}
      />
      <Button disabled={isLoading} type="submit" className="mt-2 bg-green-600">
        Save Changes
      </Button>
    </form>
  );
};

export default EditForm;
