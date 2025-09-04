import React from "react";
import TitleHeader from "../../_components/title-header";
import TableBillboards from "./_components/table-billboards";

const BillboardsPage = () => {
  return (
    <div className="p-4 mt-2 w-full max-w-none">
      <TableBillboards />
    </div>
  );
};

export default BillboardsPage;
