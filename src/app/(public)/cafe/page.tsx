"use client";
import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui";
import { Coffee, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  categoryName: string | null;
  categoryId: number | null;
  stockQuantity: number;
  imageUrl: string | null;
}

interface Category {
  id: number;
  name: string;
}

const emojiMap: Record<string, string> = {
  Coffee: "☕",
  Tea: "🍵",
  Beverages: "🥤",
  Snacks: "🥐",
  Desserts: "🍰",
};

export default function CafePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cafe/categories")
      .then(r => r.json())
      .then(res => res.success && setCategories(res.data));
    fetch("/api/cafe/products?available=true&pageSize=100")
      .then(r => r.json())
      .then(res => {
        if (res.success) setProducts(res.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCat === "all" || p.categoryId === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.stockQuantity > 0;
  });

  const grouped: Record<string, Product[]> = {};
  if (activeCat === "all" && !search) {
    for (const p of filtered) {
      const cn = p.categoryName || "Other";
      if (!grouped[cn]) grouped[cn] = [];
      grouped[cn].push(p);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
            <Coffee size={16} />
            <span>Our Menu</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-['Playfair_Display']">The Library Café</h1>
          <p className="mt-4 text-lg text-amber-100 max-w-xl mx-auto">
            Artisan coffee, fine teas, fresh pastries, and light bites — all made to enjoy with your favorite book.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCat("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCat === "all" ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Items
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCat === c.id ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {emojiMap[c.name] || ""} {c.name}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-500">Loading menu...</p>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-10">
            {Object.entries(grouped).map(([catName, items]) => (
              <div key={catName}>
                <h2 className="text-2xl font-bold font-['Playfair_Display'] text-navy-900 mb-4 flex items-center gap-2">
                  <span className="text-3xl">{emojiMap[catName] || "🍽️"}</span>
                  {catName}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(p => (
                    <Card key={p.id} className="card-hover">
                      <CardBody className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{p.name}</h3>
                          {p.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                          )}
                        </div>
                        <div className="text-lg font-bold text-navy-700 whitespace-nowrap">
                          {formatCurrency(p.price)}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} className="card-hover">
                <CardBody className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{p.categoryName}</p>
                    <h3 className="font-semibold text-slate-900 mt-1">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-navy-700 whitespace-nowrap">
                    {formatCurrency(p.price)}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
        {filtered.length === 0 && !loading && (
          <p className="text-center py-12 text-slate-500">No items found.</p>
        )}
      </div>
    </div>
  );
}
