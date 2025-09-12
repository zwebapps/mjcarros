import axios from "axios";
import ProductTable from "./_components/table-products";
import TitleHeader from "../../_components/title-header";
import BulkUpload from "./_components/bulk-upload";

const ProductsPage = () => {
  return (
    <div className="p-4 mt-2 w-full max-w-none space-y-6">
      <BulkUpload />
      <ProductTable />
    </div>
  );
};

export default ProductsPage;
