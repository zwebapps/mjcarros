"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestData } from "@/types";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

type Category = {
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
    // sizes removed
    discount: "",
    modelName: "",
    year: "",
    stockQuantity: "",
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
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
        setCategory(data);
      } catch (error) {
        console.log("Error getting categories", error);
      }
    };

    fetchCategories();
  }, []);

  // no sizes fetching

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files as FileList;
    setDataForm((prevData) => ({
      ...prevData,
      files: [...prevData.files, ...Array.from(selectedFiles)],
    }));

    if (selectedFiles.length > 0) {
      const imagePreviews: string[] = Array.from(selectedFiles).map(
        (file) => URL.createObjectURL(file) as string
      );
      setImagePreviews((prev) => [...prev, ...imagePreviews]);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files as FileList;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'products');
        const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        if (data?.url) {
          uploaded.push(data.url);
        }
      }
      setGalleryPreviews((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error('Gallery upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckboxChange = (isChecked: boolean) => {
    setDataForm((prevData) => ({ ...prevData, isFeatured: isChecked }));
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

    if (
      !dataForm.title ||
      dataForm.title.length < 4 ||
      !dataForm.description ||
      dataForm.description.length < 4 ||
      !dataForm.price ||
      dataForm.files.length === 0 ||
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
        files:
          dataForm.files.length === 0 ? "Please select at least one file" : "",
        category: !dataForm.category ? "Please select a category" : "",
      }));

      return;
    }

    const convPrice = +dataForm.price;

    const requestData: RequestData = {
      title: dataForm.title,
      description: dataForm.description,
      price: convPrice,
      files: dataForm.files,
      featured: dataForm.isFeatured,
      category: dataForm.category,
      // no sizes
      categoryId: dataForm.categoryId,
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

    Array.from(dataForm.files).forEach((file) => {
      formData.append("files", file);
    });

    formData.append("requestData", JSON.stringify(requestData));
    // include uploaded gallery URLs
    if (galleryPreviews.length) {
      const current = JSON.parse(formData.get('requestData') as string);
      current.imageURLs = [...(current.imageURLs || []), ...galleryPreviews];
      formData.set('requestData', JSON.stringify(current));
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await axios.post("/api/product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success("Product created successfully");

      router.push("/admin/products");
      setIsLoading(false);
      setImagePreviews([]);
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong!");
    }
  };

  // sizes removed

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    status: false,
    placeholder: "Write detailed description. Use headings, lists, tables (Markdown).",
    autosave: { enabled: false },
    autoDownloadFontAwesome: true,
  }), []);

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
            <Input id="stockQuantity" type="number" value={dataForm.stockQuantity || ''} onChange={(e) => setDataForm({ ...dataForm, stockQuantity: e.target.value })} />
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
        <label htmlFor="image">Add Product Image</label>
        <Input
          type="file"
          id="image"
          name="image"
          required
          onChange={handleFileChange}
          multiple
        />
        {errors.files && <p className="text-red-500">{errors.files}</p>}
        <div className="flex gap-2">
          {imagePreviews.map((preview, index) => (
            <Image
              key={index}
              src={preview}
              alt={`Preview ${index}`}
              width={100}
              height={100}
              className="rounded-sm"
            />
          ))}
        </div>
        <label htmlFor="gallery">Add Gallery Images (uploads sequentially)</label>
        <Input type="file" id="gallery" name="gallery" onChange={handleGalleryChange} multiple />
        {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
        {galleryPreviews.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {galleryPreviews.map((url, idx) => (
              <img key={idx} src={url} alt={`Gallery ${idx}`} className="w-[100px] h-[100px] object-cover rounded" />
            ))}
          </div>
        )}
        <Button disabled={isLoading} className="mt-2 bg-green-600">
          Add Product
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
