"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onQuoteGenerated: (messageText: string) => void;
}

export function QuoteModal({ open, onOpenChange, contactId, onQuoteGenerated }: QuoteModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [dealId, setDealId] = useState("auto");
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && contactId) {
      const fetchDeals = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("deals")
          .select("id, title, value, currency")
          .eq("contact_id", contactId)
          .neq("status", "won")
          .neq("status", "lost")
          .order("updated_at", { ascending: false });
          
        if (data) setActiveDeals(data);
      };
      fetchDeals();
    }
  }, [open, contactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      toast.error("Description and Amount are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: contactId,
          deal_id: dealId,
          description,
          amount: parseFloat(amount),
          currency,
          valid_until: validUntil || null,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.messageText) {
        toast.success("Quote generated successfully!");
        onQuoteGenerated(data.messageText);
        onOpenChange(false);
        // Reset form
        setDescription("");
        setAmount("");
        setValidUntil("");
        setDealId("auto");
      } else {
        toast.error(data.error || "Failed to generate quote.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Attach to Deal</label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="auto">✨ Auto (Smart Detect & Create)</option>
              {activeDeals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title} ({deal.currency} {deal.value})
                </option>
              ))}
              <option value="none">Do not attach to pipeline</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Website Design Package"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Valid Until (Optional)</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate & Attach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
