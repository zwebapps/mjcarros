import { cn } from "@/lib/utils";

type RibbonProps = {
  className?: string;
};

/** Diagonal corner ribbon — red for sale / discount */
export function SaleRibbon({ className }: RibbonProps) {
  return (
    <span
      className={cn(
        "listing-ribbon listing-ribbon-sale",
        className
      )}
      aria-label="On sale"
    >
      Sale
    </span>
  );
}

/** Diagonal corner ribbon — yellow for sold vehicles */
export function SoldRibbon({ className }: RibbonProps) {
  return (
    <span
      className={cn("listing-ribbon listing-ribbon-sold", className)}
      aria-label="Sold"
    >
      Sold
    </span>
  );
}

/** Diagonal corner ribbon — orange for negotiable pricing */
export function NegotiableRibbon({ className }: RibbonProps) {
  return (
    <span
      className={cn(
        "listing-ribbon listing-ribbon-negotiable",
        className
      )}
      aria-label="Price negotiable"
    >
      Negotiable
    </span>
  );
}
