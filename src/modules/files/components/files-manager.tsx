"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  FolderPlus,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StoredFileDto,
  FolderDto,
  FolderBreadcrumb,
  FileViewSection,
  StorageOverviewStats,
} from "../types";
import { FilesNav } from "./files-nav";
import { FilesToolbar } from "./files-toolbar";
import { FileCard } from "./file-card";
import { FileRow } from "./file-row";
import { FileUploadDialog } from "./file-upload-dialog";
import { FolderDialog } from "./folder-dialog";
import { FolderDeleteDialog } from "./folder-delete-dialog";
import { FileMoveModal } from "./file-move-modal";
import { FilePreviewModal } from "./file-preview-modal";
import { FileDetailsPanel } from "./file-details-panel";
import { FileRenameDialog } from "./file-rename-dialog";

export function FilesManager() {
  // Navigation & Filter state
  const [currentSection, setCurrentSection] = useState<FileViewSection>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "sizeBytes">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Data state
  const [files, setFiles] = useState<StoredFileDto[]>([]);
  const [folders, setFolders] = useState<FolderDto[]>([]);
  const [stats, setStats] = useState<StorageOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Dialog & Modal states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderDto | null>(null);
  const [parentFolderIdForNew, setParentFolderIdForNew] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderDto | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [filesToMove, setFilesToMove] = useState<StoredFileDto[]>([]);
  const [previewFile, setPreviewFile] = useState<StoredFileDto | null>(null);
  const [detailsFile, setDetailsFile] = useState<StoredFileDto | null>(null);
  const [renameFile, setRenameFile] = useState<StoredFileDto | null>(null);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/files/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load storage stats:", err);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/files/folders?all=true");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
      }
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("section", currentSection);

      if (currentSection === "folder" && selectedFolderId) {
        params.set("folderId", selectedFolderId);
      } else if (currentSection === "all" && selectedFolderId) {
        params.set("folderId", selectedFolderId);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      setFiles(data.files);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred fetching files");
    } finally {
      setLoading(false);
    }
  }, [currentSection, selectedFolderId, searchQuery, sortBy, sortOrder]);

  const fetchBreadcrumbs = useCallback(async (folderId: string | null) => {
    if (!folderId) {
      setBreadcrumbs([]);
      return;
    }
    try {
      const res = await fetch(`/api/files/folders/${folderId}`);
      if (res.ok) {
        const data = await res.json();
        setBreadcrumbs(data.breadcrumbs || []);
      }
    } catch (err) {
      console.error("Failed to fetch breadcrumbs:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFolders();
  }, [fetchStats, fetchFolders]);

  useEffect(() => {
    fetchFiles();
    setSelectedFileIds(new Set());
  }, [fetchFiles]);

  useEffect(() => {
    if (selectedFolderId) {
      fetchBreadcrumbs(selectedFolderId);
    } else {
      setBreadcrumbs([]);
    }
  }, [selectedFolderId, fetchBreadcrumbs]);

  // ===========================================================================
  // NAVIGATION HANDLERS
  // ===========================================================================

  const handleSelectSection = (section: FileViewSection, folderId?: string | null) => {
    setCurrentSection(section);
    setSelectedFolderId(folderId || null);
    setSelectedFileIds(new Set());
  };

  const handleNavigateBreadcrumb = (folderId: string | null) => {
    if (folderId) {
      setSelectedFolderId(folderId);
      setCurrentSection("folder");
    } else {
      setSelectedFolderId(null);
      setCurrentSection("all");
    }
    setSelectedFileIds(new Set());
  };

  // ===========================================================================
  // SELECTION HANDLERS
  // ===========================================================================

  const handleToggleSelect = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedFileIds(new Set(files.map((f) => f.id)));
  };

  const handleClearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const isAllSelected = files.length > 0 && selectedFileIds.size === files.length;

  // ===========================================================================
  // FILE ACTIONS
  // ===========================================================================

  const handleDownload = (file: StoredFileDto) => {
    const a = document.createElement("a");
    a.href = `/api/files/${file.id}/download`;
    a.download = file.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async (file: StoredFileDto) => {
    try {
      const res = await fetch(`/api/files/${file.id}/copy`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to copy file");
      }
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to copy file");
    }
  };

  const handleDelete = async (file: StoredFileDto) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file");
      }
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleRestore = async (file: StoredFileDto) => {
    try {
      const res = await fetch(`/api/files/${file.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to restore file");
      }
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore file");
    }
  };

  const handlePermanentDelete = async (file: StoredFileDto) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.originalName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/files/${file.id}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to permanently delete file");
      }
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to permanently delete file");
    }
  };

  // ===========================================================================
  // BULK ACTIONS
  // ===========================================================================

  const handleBulkDownload = () => {
    const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));
    selectedFiles.forEach((file) => {
      handleDownload(file);
    });
  };

  const handleBulkMove = () => {
    const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));
    setFilesToMove(selectedFiles);
    setMoveModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return;
    try {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          fileIds: Array.from(selectedFileIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete files");
      }
      setSelectedFileIds(new Set());
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk delete failed");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedFileIds.size === 0) return;
    try {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          fileIds: Array.from(selectedFileIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to restore files");
      }
      setSelectedFileIds(new Set());
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk restore failed");
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedFileIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedFileIds.size} files? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "permanent_delete",
          fileIds: Array.from(selectedFileIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to permanently delete files");
      }
      setSelectedFileIds(new Set());
      fetchFiles();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bulk permanent delete failed");
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to empty the trash? All deleted files and folders will be permanently removed.")) {
      return;
    }
    try {
      const res = await fetch("/api/files/trash", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to empty trash");
      }
      fetchFiles();
      fetchStats();
      fetchFolders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to empty trash");
    }
  };

  const isTrash = currentSection === "trash";

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#080D16]">
      {/* Left Sidebar Navigation */}
      <div className="w-64 shrink-0 hidden md:block h-full">
        <FilesNav
          currentSection={currentSection}
          selectedFolderId={selectedFolderId}
          folders={folders}
          stats={stats}
          onSelectSection={handleSelectSection}
          onOpenCreateFolder={(parentId) => {
            setFolderToEdit(null);
            setParentFolderIdForNew(parentId || null);
            setFolderDialogOpen(true);
          }}
          onOpenEditFolder={(folder) => {
            setFolderToEdit(folder);
            setFolderDialogOpen(true);
          }}
          onOpenDeleteFolder={(folder) => {
            setFolderToDelete(folder);
          }}
          onOpenEmptyTrash={handleEmptyTrash}
        />
      </div>

      {/* Main Files View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <FilesToolbar
          currentSection={currentSection}
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(sb, so) => {
            setSortBy(sb);
            setSortOrder(so);
          }}
          selectedCount={selectedFileIds.size}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          isAllSelected={isAllSelected}
          onOpenUpload={() => setUploadOpen(true)}
          onOpenCreateFolder={() => {
            setFolderToEdit(null);
            setParentFolderIdForNew(selectedFolderId);
            setFolderDialogOpen(true);
          }}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          onBulkMove={handleBulkMove}
          onBulkDownload={handleBulkDownload}
          onBulkDelete={handleBulkDelete}
          onBulkRestore={handleBulkRestore}
          onBulkPermanentDelete={handleBulkPermanentDelete}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-secondary-text">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading files...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-400">
              <AlertCircle className="h-8 w-8" />
              <span className="text-sm font-medium">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFiles()}
                className="text-xs border-border bg-[#0D1421] text-foreground"
              >
                Try Again
              </Button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-xl border border-dashed border-border/80 bg-[#0D1421]/40">
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                {isTrash ? <Trash2 className="h-6 w-6 text-red-400" /> : <FileText className="h-6 w-6" />}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {isTrash
                  ? "Trash is empty"
                  : searchQuery
                  ? "No matching files found"
                  : "No files here yet"}
              </h3>
              <p className="text-xs text-secondary-text max-w-sm mb-4">
                {isTrash
                  ? "Deleted files will appear here until they are permanently removed."
                  : searchQuery
                  ? `No files match your query "${searchQuery}".`
                  : "Upload files or create folders to organize your assets."}
              </p>
              {!isTrash && !searchQuery && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setUploadOpen(true)}
                    className="bg-primary text-black font-medium hover:bg-primary/90 text-xs gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Files</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFolderToEdit(null);
                      setParentFolderIdForNew(selectedFolderId);
                      setFolderDialogOpen(true);
                    }}
                    className="border-border bg-[#0D1421] text-xs gap-1.5 hover:border-primary/50"
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-primary" />
                    <span>New Folder</span>
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  selected={selectedFileIds.has(file.id)}
                  onToggleSelect={handleToggleSelect}
                  onPreview={(f) => setPreviewFile(f)}
                  onDownload={handleDownload}
                  onRename={(f) => setRenameFile(f)}
                  onMove={(f) => {
                    setFilesToMove([f]);
                    setMoveModalOpen(true);
                  }}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  onViewDetails={(f) => setDetailsFile(f)}
                  isTrash={isTrash}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="rounded-lg border border-border/80 bg-[#0D1421] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-[#111B2B]/70 text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={isAllSelected ? handleClearSelection : handleSelectAll}
                        className="rounded border-border bg-[#111B2B] text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5 hidden sm:table-cell">Category</th>
                    <th className="px-3 py-2.5">Size</th>
                    <th className="px-3 py-2.5 hidden md:table-cell">Folder</th>
                    <th className="px-3 py-2.5 hidden lg:table-cell">Uploaded</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      selected={selectedFileIds.has(file.id)}
                      onToggleSelect={handleToggleSelect}
                      onPreview={(f) => setPreviewFile(f)}
                      onDownload={handleDownload}
                      onRename={(f) => setRenameFile(f)}
                      onMove={(f) => {
                        setFilesToMove([f]);
                        setMoveModalOpen(true);
                      }}
                      onCopy={handleCopy}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                      onPermanentDelete={handlePermanentDelete}
                      onViewDetails={(f) => setDetailsFile(f)}
                      isTrash={isTrash}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folders={folders}
        defaultFolderId={selectedFolderId}
        onUploadSuccess={() => {
          fetchFiles();
          fetchStats();
          fetchFolders();
        }}
      />

      {/* Folder Create / Edit Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folderToEdit={folderToEdit}
        parentFolderId={parentFolderIdForNew}
        folders={folders}
        onSuccess={() => {
          fetchFolders();
          fetchStats();
        }}
      />

      {/* Folder Delete Dialog */}
      <FolderDeleteDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
        folder={folderToDelete}
        onSuccess={() => {
          setFolderToDelete(null);
          if (selectedFolderId === folderToDelete?.id) {
            setSelectedFolderId(null);
            setCurrentSection("all");
          }
          fetchFolders();
          fetchFiles();
          fetchStats();
        }}
      />

      {/* File Move Modal */}
      <FileMoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        filesToMove={filesToMove}
        folders={folders}
        onSuccess={() => {
          setSelectedFileIds(new Set());
          fetchFiles();
          fetchFolders();
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownload}
      />

      {/* File Details Panel */}
      <FileDetailsPanel
        open={!!detailsFile}
        onOpenChange={(open) => !open && setDetailsFile(null)}
        file={detailsFile}
        onDownload={handleDownload}
        onRename={(f) => setRenameFile(f)}
        onMove={(f) => {
          setFilesToMove([f]);
          setMoveModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* File Rename Dialog */}
      <FileRenameDialog
        open={!!renameFile}
        onOpenChange={(open) => !open && setRenameFile(null)}
        file={renameFile}
        onSuccess={() => {
          fetchFiles();
        }}
      />
    </div>
  );
}
