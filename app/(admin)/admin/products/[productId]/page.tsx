import TitleHeader from "@/app/(admin)/_components/title-header";
import EditProduct from "../_components/edit-product";

const EditPage = () => {
  return (
    <div className="p-4 mt-2 w-3/4 max-md:w-full mx-auto">
      <TitleHeader title="Update product" description="Update a product" />
      <EditProduct />
    </div>
  );
};

export default EditPage;
