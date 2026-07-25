import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | MJ Carros",
  description: "Your shopping cart",
  robots: { index: false, follow: false },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
