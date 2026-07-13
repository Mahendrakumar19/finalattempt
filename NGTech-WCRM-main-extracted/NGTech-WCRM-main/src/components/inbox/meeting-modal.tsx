"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onMeetingGenerated: (messageText: string) => void;
}

export function MeetingModal({ open, onOpenChange, contactId, onMeetingGenerated }: MeetingModalProps) {
  const [title, setTitle] = useState("Discovery Call");
  const [meetingLink, setMeetingLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Topic is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: contactId,
          title,
          meeting_link: meetingLink || null,
          scheduled_at: scheduledAt || null,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.messageText) {
        toast.success("Meeting proposal generated!");
        onMeetingGenerated(data.messageText);
        onOpenChange(false);
        // Reset form
        setTitle("Discovery Call");
        setMeetingLink("");
        setScheduledAt("");
      } else {
        toast.error(data.error || "Failed to schedule meeting.");
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
          <DialogTitle>Propose Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Topic</label>
            <input
              type="text"
              required
              placeholder="e.g. Discovery Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Booking Link (Optional)</label>
            <input
              type="url"
              placeholder="e.g. https://calendly.com/your-link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground">Paste your Calendly or meeting link here to share it easily.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proposed Date/Time (Optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
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
