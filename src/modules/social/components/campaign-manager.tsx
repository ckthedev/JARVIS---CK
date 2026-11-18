"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SocialCampaignDto,
  CampaignStatus,
  SocialPlatform,
} from "../types";
import { ALL_PLATFORMS, PlatformBadge, PlatformIcon, getPlatformMeta } from "./social-badges";
import { cn } from "@/lib/utils";

interface CampaignManagerProps {
  onSelectCampaign?: (campaignId: string) => void;
}

export function CampaignManager({ onSelectCampaign }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<SocialCampaignDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaignDto | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formStatus, setFormStatus] = useState<CampaignStatus>("PLANNING");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formPlatforms, setFormPlatforms] = useState<SocialPlatform[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const q = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/social/campaigns${q}`);
      if (res.ok) {
        const d = await res.json();
        setCampaigns(d.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setFormName("");
    setFormDescription("");
    setFormObjective("");
    setFormStatus("PLANNING");
    setFormStartDate("");
    setFormEndDate("");
    setFormPlatforms([]);
    setFormNotes("");
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (c: SocialCampaignDto) => {
    setEditingCampaign(c);
    setFormName(c.name);
    setFormDescription(c.description || "");
    setFormObjective(c.objective || "");
    setFormStatus(c.status);
    setFormStartDate(c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "");
    setFormEndDate(c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "");
    setFormPlatforms(c.platforms as SocialPlatform[]);
    setFormNotes(c.internalNotes || "");
    setError(null);
    setDialogOpen(true);
  };

  const togglePlatform = (p: SocialPlatform) => {
    if (formPlatforms.includes(p)) {
      setFormPlatforms(formPlatforms.filter((item) => item !== p));
    } else {
      setFormPlatforms([...formPlatforms, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Campaign name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        objective: formObjective.trim() || null,
        status: formStatus,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        platforms: formPlatforms,
        internalNotes: formNotes.trim() || null,
      };

      const url = editingCampaign
        ? `/api/social/campaigns/${editingCampaign.id}`
        : "/api/social/campaigns";
      const method = editingCampaign ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save campaign");
      }

      setDialogOpen(false);
      fetchCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving campaign";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete campaign "${name}"? Existing posts will be unlinked safely.`)) {
      try {
        const res = await fetch(`/api/social/campaigns/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchCampaigns();
        }
      } catch (err) {
        console.error("Failed to delete campaign:", err);
      }
    }
  };

  const getCampaignStatusBadge = (st: CampaignStatus) => {
    switch (st) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
      case "PLANNING":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Planning</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Archived</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c1320]">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Campaigns</h2>
          <span className="text-xs text-muted-foreground ml-1">
            ({campaigns.length} total)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <Button
            size="sm"
            onClick={openCreateDialog}
            className="text-xs gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-xs border border-dashed border-white/[0.08] rounded-xl p-8 space-y-3">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-foreground">No campaigns created yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Organize themed initiatives, product launches, or seasonal promotions across your social channels.
          </p>
          <Button
            size="sm"
            onClick={openCreateDialog}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Create First Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const hasDates = c.startDate || c.endDate;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/[0.08] bg-[#0c1320] p-5 flex flex-col justify-between hover:border-white/[0.18] transition-all space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1">
                      {c.name}
                    </h3>
                    {getCampaignStatusBadge(c.status)}
                  </div>

                  {c.objective && (
                    <p className="text-xs text-primary/90 font-medium line-clamp-1">
                      Target: {c.objective}
                    </p>
                  )}

                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {c.platforms && c.platforms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {c.platforms.map((p) => (
                        <PlatformBadge key={p} platform={p as SocialPlatform} showLabel={false} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress / Status Distribution Bar */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.postCount || 0} associated post(s)</span>
                    {hasDates && (
                      <span className="text-[11px] font-mono flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {c.startDate ? new Date(c.startDate).toLocaleDateString() : "Any"} -{" "}
                        {c.endDate ? new Date(c.endDate).toLocaleDateString() : "Any"}
                      </span>
                    )}
                  </div>

                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden flex">
                    {c.statusDistribution && c.postCount && c.postCount > 0 ? (
                      <>
                        <div
                          style={{ width: `${((c.statusDistribution["PUBLISHED"] || 0) / c.postCount) * 100}%` }}
                          className="bg-green-500 h-full"
                          title={`Published: ${c.statusDistribution["PUBLISHED"] || 0}`}
                        />
                        <div
                          style={{ width: `${((c.statusDistribution["SCHEDULED"] || 0) / c.postCount) * 100}%` }}
                          className="bg-cyan-500 h-full"
                          title={`Scheduled: ${c.statusDistribution["SCHEDULED"] || 0}`}
                        />
                        <div
                          style={{ width: `${((c.statusDistribution["APPROVED"] || 0) / c.postCount) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Approved: ${c.statusDistribution["APPROVED"] || 0}`}
                        />
                        <div
                          style={{ width: `${((c.statusDistribution["DRAFT"] || 0) / c.postCount) * 100}%` }}
                          className="bg-blue-500 h-full"
                          title={`Draft: ${c.statusDistribution["DRAFT"] || 0}`}
                        />
                      </>
                    ) : (
                      <div className="w-full bg-white/[0.05] h-full" />
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1">
                  {onSelectCampaign ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectCampaign(c.id)}
                      className="text-xs h-7 text-primary hover:text-primary px-2"
                    >
                      View Posts &rarr;
                    </Button>
                  ) : <div />}

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(c)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id, c.name)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingCampaign ? "Edit Campaign" : "New Campaign"}
        description="Define campaign theme, target objectives, and scheduled timeline."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Campaign Name *</label>
              <input
                placeholder="e.g. Black Friday 2026 Blitz"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Objective / Target</label>
              <input
                placeholder="e.g. Generate 500 waitlist signups for V2 launch"
                value={formObjective}
                onChange={(e) => setFormObjective(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Description</label>
              <textarea
                placeholder="General notes, key messages, narrative arc..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-secondary-text">Start Date</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-secondary-text">End Date</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-secondary-text">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as CampaignStatus)}
                className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Target Platforms */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary-text">Target Platforms</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PLATFORMS.map((p) => {
                  const isSelected = formPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card/40 border-border/80 text-secondary-text hover:text-foreground"
                      )}
                    >
                      <PlatformIcon platform={p} className="h-3 w-3" />
                      <span>{getPlatformMeta(p).label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs"
            >
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {editingCampaign ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
