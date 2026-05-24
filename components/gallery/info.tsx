"use client";
import { formatCurrency } from "@/lib/utils";

import { ShoppingCart } from "lucide-react";

import { Product } from "@/types";
import { Button } from "../ui/button";
import useCart from "@/hooks/use-cart";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { formatProductDescription } from "@/lib/format-product-description";
import { useLocale } from "@/components/locale-provider";
import { localeToIntl } from "@/lib/i18n";
import { useTranslatedText } from "@/hooks/use-translated-text";
import { ProductSpecs } from "@/components/gallery/product-specs";

interface InfoProps {
  data: Product;
}

const Info: React.FC<InfoProps> = ({ data }) => {
  const cart = useCart();
  const { t, locale } = useLocale();
  const intlLocale = localeToIntl(locale);
  const displayTitle = useTranslatedText(data.title, locale);
  const displayDescription = useTranslatedText(data.description || "", locale);

  const onAddToCart = () => {
    cart.addItem(data);
  };

  return (
    <div className="min-w-0 max-w-full">
      <h1 className="text-3xl font-bold text-gray-900 break-words">{displayTitle}</h1>

      {/* Featured badge — category and specs shown as text below */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {data.featured && (
          <span className="inline-block bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">
            {t("product.featured")}
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="mt-3">
        {data.finalPrice && data.finalPrice > 0 && data.discount && data.discount > 0 ? (
          <div className="font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through">
                {formatCurrency(Number(data?.price), "EUR", intlLocale)}
              </span>
              <div className="rounded-sm bg-red-600 p-1 px-2 text-sm font-semibold text-white">
                -{data?.discount}%
              </div>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(Number(data.finalPrice), "EUR", intlLocale)}
            </p>
          </div>
        ) : (
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(Number(data?.price), "EUR", intlLocale)}
          </p>
        )}
      </div>

      <ProductSpecs data={data} />

      {/* Description — Standvirtual “Detalhes” section */}
      <div className="mt-8 min-w-0 w-full">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("product.details")}
        </h2>
        <div
          className={[
            "product-description prose prose-neutral max-w-none",
            "prose-headings:mt-6 prose-headings:mb-2 prose-headings:break-words prose-headings:text-gray-900",
            "prose-p:my-3 prose-p:break-words prose-p:leading-relaxed prose-p:text-gray-700",
            "prose-ul:my-3 prose-li:my-1 prose-li:break-words",
            "prose-strong:text-gray-900",
            "[&_a]:break-all [&_code]:break-all",
          ].join(" ")}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {formatProductDescription(displayDescription)}
          </ReactMarkdown>
        </div>
      </div>

      {/* sizes removed */}

      <div className="product-cta-row mt-10">
        <Button
          onClick={onAddToCart}
          size="lg"
          className="product-cta-button h-12 w-full gap-2 text-base sm:min-w-[16rem] sm:max-w-xl"
          disabled={!!data.sold}
        >
          {data.sold ? t("product.sold") : t("product.addToCart")}
          {!data.sold && <ShoppingCart size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default Info;
