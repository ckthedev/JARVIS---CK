"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoredFileDto } from "../types";

interface FileRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: StoredFileDto | null;
  onSuccess: () => void;
}

export function FileRenameDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: FileRenameDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && file) {
      setName(file.originalName);
      setError(null);
      setLoading(false);
    }
  }, [open, file]);

  if (!file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Filename cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename file");

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Rename File"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="rename-input" className="text-xs text-secondary-text">
            Filename
          </Label>
          <Input
            id="rename-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-[#0D1421] border-border text-foreground text-xs focus:border-primary"
            autoFocus
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border bg-transparent text-secondary-text hover:text-foreground text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-primary text-black font-medium hover:bg-primary/90 text-xs gap-1.5"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Save</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
