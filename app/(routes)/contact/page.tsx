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
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-56 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-5xl mx-auto h-full flex items-center px-4">
          <div>
            <h1 className="text-4xl font-bold text-black">{cms?.heroTitle || 'Contact Us'}</h1>
            <p className="text-black/80 mt-2">{cms?.heroSubtitle || 'We’d love to hear from you. Send us a message and we’ll respond promptly.'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
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
              <Button disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">{isSubmitting ? "Sending..." : "Send Message"}</Button>
              {ok === true && <span className="text-green-600 text-sm">Message sent. We’ll get back to you soon.</span>}
              {ok === false && <span className="text-red-600 text-sm">Failed to send. Please try again.</span>}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Our Office</h3>
            <p className="text-sm text-gray-700">{cms?.address1 || '178 Expensive Avenue'}</p>
            <p className="text-sm text-gray-700">{cms?.cityLine || 'Philadelphia, 20100 PH'}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Contact</h3>
            <p className="text-sm text-gray-700">Phone: {cms?.phone || '+1 (555) 000-0000'}</p>
            <p className="text-sm text-gray-700">Email: {cms?.email || 'info@mjcarros.com'}</p>
            <p className="text-sm text-gray-700">Web: {cms?.web || 'www.mjcarros.com'}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Hours</h3>
            {(cms?.hours || 'Mon-Fri: 9-6; Sat: 10-4; Sun: Closed').split(';').map((line) => (
              <p key={line} className="text-sm text-gray-700">{line.trim()}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


