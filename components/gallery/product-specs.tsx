"use client";

import { useLocale } from "@/components/locale-provider";
import { localeToIntl } from "@/lib/i18n";
import { Product } from "@/types";

interface ProductSpecsProps {
  data: Product;
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Standvirtual-style “Destaques” strip — text labels only, no icons. */
export function ProductSpecs({ data }: ProductSpecsProps) {
  const { t, locale } = useLocale();
  const intlLocale = localeToIntl(locale);

  const items: { label: string; value: string }[] = [];

  if (data.mileage != null && data.mileage > 0) {
    items.push({
      label: t("product.specMileage"),
      value: `${data.mileage.toLocaleString(intlLocale)} km`,
    });
  }
  if (data.fuelType?.trim()) {
    items.push({
      label: t("product.specFuelType"),
      value: titleCase(data.fuelType.trim()),
    });
  }
  if (data.transmission?.trim()) {
    items.push({
      label: t("product.specTransmission"),
      value: titleCase(data.transmission.trim()),
    });
  }
  if (data.category?.trim()) {
    items.push({
      label: t("product.specCategory"),
      value: data.category.trim(),
    });
  }
  if (data.year && data.year > 0) {
    items.push({ label: t("product.specYear"), value: String(data.year) });
  }
  if (data.condition?.trim()) {
    items.push({
      label: t("product.specCondition"),
      value: titleCase(data.condition.trim()),
    });
  }

  if (items.length === 0) return null;

  const overviewParts: string[] = [];
  if (data.year && data.year > 0) {
    overviewParts.push(`${t("product.firstRegistration")}: ${data.year}`);
  }
  if (data.fuelType?.trim()) {
    overviewParts.push(titleCase(data.fuelType.trim()));
  }
  if (data.transmission?.trim()) {
    overviewParts.push(titleCase(data.transmission.trim()));
  }
  if (data.mileage != null && data.mileage > 0) {
    overviewParts.push(`${data.mileage.toLocaleString(intlLocale)} km`);
  }

  return (
    <section className="product-highlights" aria-label={t("product.specHighlights")}>
      <h2 className="product-highlights-title">{t("product.specHighlights")}</h2>
      <div className="product-highlights-grid">
        {items.map(({ label, value }) => (
          <div key={label} className="product-highlight-item">
            <p className="product-highlight-label">{label}</p>
            <p className="product-highlight-value">{value}</p>
          </div>
        ))}
      </div>
      {overviewParts.length > 0 && (
        <p className="product-overview-line">{overviewParts.join(" · ")}</p>
      )}
    </section>
  );
}
