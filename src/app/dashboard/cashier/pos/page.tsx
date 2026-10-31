"use client";
import { useState, useEffect } from "react";
import { PageHeader, Button, Card, CardBody, Input, Select, showToast, Badge } from "@/components/ui";
import { Coffee, Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone, CheckCircle, Receipt, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: string;
  categoryId: number | null;
  categoryName: string | null;
  stockQuantity: number;
  isAvailable: boolean;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

export default function CashierPOSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [cashGiven, setCashGiven] = useState("");

  useEffect(() => {
    fetch("/api/cafe/categories").then(r => r.json()).then(res => res.success && setCategories(res.data));
    fetch("/api/cafe/products?pageSize=100&available=true&inStock=true")
      .then(r => r.json()).then(res => {
        if (res.success) setProducts(res.data.items);
      });
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCat === "all" || p.categoryId === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = activeCat === "all" && !search ? products.reduce<Record<string, Product[]>>((acc, p) => {
    const cn = p.categoryName || "Other";
    if (!acc[cn]) acc[cn] = [];
    acc[cn].push(p);
    return acc;
  }, {}) : null;

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(x => x.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stockQuantity) {
          showToast(`Only ${p.stockQuantity} in stock`, "warning");
          return prev;
        }
        return prev.map(x => x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [...prev, { productId: p.id, name: p.name, price: parseFloat(p.price), quantity: 1 }];
    });
  };

  const updateQty = (pid: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === pid) {
        const newQ = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (pid: number) => setCart(prev => prev.filter(i => i.productId !== pid));
  const clearCart = () => {
    setCart([]); setCustomerName(""); setDiscount(0); setCheckoutOpen(false); setReceipt(null); setCashGiven("");
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = Math.round(afterDiscount * 0.08 * 100) / 100;
  const total = Math.round((afterDiscount + tax) * 100) / 100;

  const handlePayment = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const orderRes = await fetch("/api/cafe/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || "Walk-in",
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
          discount: discountAmount,
        }),
      }).then(r => r.json());
      if (!orderRes.success) {
        showToast(orderRes.error || "Order failed", "error");
        setProcessing(false);
        return;
      }
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderRes.data.id,
          amount: total,
          paymentMethod,
        }),
      }).then(r => r.json());
      if (payRes.success) {
        setReceipt({
          order: orderRes.data,
          payment: payRes.data,
          items: cart,
          subtotal, discount: discountAmount, tax, total,
          customerName: customerName || "Walk-in",
          paymentMethod,
        });
        showToast("Payment successful!", "success");
        // refresh products to update stock
        fetch("/api/cafe/products?pageSize=100").then(r => r.json()).then(res => res.success && setProducts(res.data.items));
      } else {
        showToast(payRes.error || "Payment failed", "error");
      }
    } catch (e) {
      showToast("Something went wrong", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Point of Sale"
        description="Process café orders and payments"
        actions={
          <Button variant="outline" onClick={clearCart}>New Order</Button>
        }
      />

      {receipt ? (
        <Card className="max-w-lg mx-auto">
          <CardBody className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Payment Successful</h2>
              <p className="text-sm text-slate-500 mt-1">Receipt #{receipt.payment.transactionReference}</p>
            </div>
            <div className="border-y border-slate-200 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium">{receipt.customerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-medium capitalize">{receipt.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{new Date().toLocaleString()}</span></div>
            </div>
            <div className="py-4 space-y-1 text-sm">
              {receipt.items.map((i: CartItem) => (
                <div key={i.productId} className="flex justify-between">
                  <span>{i.quantity}x {i.name}</span>
                  <span>{formatCurrency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
              {receipt.discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{formatCurrency(receipt.discount)}</span></div>}
              <div className="flex justify-between text-slate-600"><span>Tax (8%)</span><span>{formatCurrency(receipt.tax)}</span></div>
              <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" onClick={clearCart}>New Order</Button>
              <Button variant="outline" onClick={() => window.print()}><Receipt size={16} /> Print</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Products */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100 text-sm"
                  />
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveCat("all")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                      activeCat === "all" ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                        activeCat === c.id ? "bg-navy-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <CardBody className="p-4">
                {grouped ? (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([catName, items]) => (
                      <div key={catName}>
                        <h3 className="font-semibold text-slate-900 text-sm mb-3">{catName}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {items.map(p => <ProductButton key={p.id} product={p} onClick={() => addToCart(p)} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filtered.map(p => <ProductButton key={p.id} product={p} onClick={() => addToCart(p)} />)}
                    {filtered.length === 0 && <p className="col-span-full text-center text-slate-500 py-8">No products found</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={18} /> Current Order
                </h3>
                {cart.length > 0 && <Badge variant="info">{cart.reduce((s,i)=>s+i.quantity,0)} items</Badge>}
              </div>
              <CardBody className="p-0">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                    Cart is empty. Click products to add.
                  </div>
                ) : (
                  <>
                    <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.productId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-slate-500">{formatCurrency(item.price)} each</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded border border-slate-300 hover:bg-slate-100 flex items-center justify-center">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded bg-navy-700 text-white hover:bg-navy-800 flex items-center justify-center">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 space-y-3">
                      <Input
                        label="Customer Name (optional)"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Walk-in customer"
                      />
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Discount ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount || ""}
                          onChange={e => setDiscount(Number(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100"
                        />
                      </div>
                      <div className="space-y-1 text-sm pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
                        <div className="flex justify-between text-slate-600"><span>Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
                        <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-100"><span>Total</span><span>{formatCurrency(total)}</span></div>
                      </div>
                      {checkoutOpen && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                              {PAYMENT_METHODS.map(m => {
                                const Icon = m.icon;
                                return (
                                  <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                                    className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${paymentMethod === m.id ? "border-navy-600 bg-navy-50 text-navy-800" : "border-slate-200 hover:bg-slate-50"}`}>
                                    <Icon size={18} />{m.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {paymentMethod === "cash" && (
                            <Input
                              label="Cash Given"
                              type="number"
                              value={cashGiven}
                              onChange={e => setCashGiven(e.target.value)}
                            />
                          )}
                          <Button className="w-full" size="lg" onClick={handlePayment} loading={processing}>
                            {paymentMethod === "cash" && cashGiven ? (
                              <>Charge {formatCurrency(total)} • Change: {formatCurrency(Math.max(0, Number(cashGiven) - total))}</>
                            ) : (
                              <>Complete Payment {formatCurrency(total)}</>
                            )}
                          </Button>
                          <Button variant="ghost" className="w-full" onClick={() => setCheckoutOpen(false)}>
                            <X size={14} /> Cancel
                          </Button>
                        </div>
                      )}
                      {!checkoutOpen && (
                        <Button className="w-full" size="lg" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>
                          <CreditCard size={16} /> Proceed to Payment
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductButton({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={product.stockQuantity < 1}
      className="p-3 rounded-xl border border-slate-200 hover:border-navy-400 hover:shadow-md text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-navy-50 group"
    >
      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center mb-2 group-hover:from-amber-200 group-hover:to-orange-300">
        <Coffee size={32} className="text-amber-800" />
      </div>
      <div className="font-medium text-sm text-slate-900 line-clamp-1">{product.name}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-bold text-navy-700 text-sm">{formatCurrency(product.price)}</span>
        {product.stockQuantity < 5 && product.stockQuantity > 0 && (
          <span className="text-xs text-amber-600">{product.stockQuantity} left</span>
        )}
      </div>
    </button>
  );
}
