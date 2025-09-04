import axios from "axios";
import ProductTable from "./_components/table-products";
import TitleHeader from "../../_components/title-header";

const ProductsPage = () => {
  return (
    <div className="p-4 mt-2 w-full max-w-none">
      <ProductTable />
    </div>
  );
};

export default ProductsPage;
