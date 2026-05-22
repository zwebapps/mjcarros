"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ContactCMS = {
  heroTitle: string;
  heroSubtitle: string;
  address1: string;
  cityLine: string;
  phone: string;
  email: string;
  web: string;
  hours: string;
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [ok, setOk] = useState<boolean | null>(null);
  const [cms, setCms] = useState<ContactCMS | null>(null);

  useEffect(() => {
    // fetch contact CMS content
    fetch("/api/contact/cms").then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setCms(data);
    });
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOk(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOk(res.ok);
      if (res.ok) setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-56 gradient-brand">
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto flex h-full max-w-5xl items-center px-4 sm:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{cms?.heroTitle || 'Contact Us'}</h1>
            <p className="mt-2 text-white/85">{cms?.heroSubtitle || 'We’d love to hear from you. Send us a message and we’ll respond promptly.'}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" value={form.name} onChange={onChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={form.email} onChange={onChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input name="subject" value={form.subject} onChange={onChange} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 focus:border-black" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea name="message" rows={6} value={form.message} onChange={onChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-0 focus:border-black" />
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Message"}</Button>
              {ok === true && <span className="text-green-600 text-sm">Message sent. We’ll get back to you soon.</span>}
              {ok === false && <span className="text-red-600 text-sm">Failed to send. Please try again.</span>}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Our Office</h3>
            <p className="text-sm text-muted-foreground">{cms?.address1 || '178 Expensive Avenue'}</p>
            <p className="text-sm text-muted-foreground">{cms?.cityLine || 'Philadelphia, 20100 PH'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Contact</h3>
            <p className="text-sm text-muted-foreground">Phone: {cms?.phone || '+1 (555) 000-0000'}</p>
            <p className="text-sm text-muted-foreground">Email: {cms?.email || 'info@mjcarros.com'}</p>
            <p className="text-sm text-muted-foreground">Web: {cms?.web || 'www.mjcarros.com'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Hours</h3>
            {(cms?.hours || 'Mon-Fri: 9-6; Sat: 10-4; Sun: Closed').split(';').map((line) => (
              <p key={line} className="text-sm text-muted-foreground">{line.trim()}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


