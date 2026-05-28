import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ImportPaymentSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Payment received</h1>
      <p className="text-muted-foreground mb-8">
        Your import deposit is held in escrow until delivery is confirmed.
      </p>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
