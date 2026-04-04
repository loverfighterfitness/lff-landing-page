/**
 * Admin Media Library — LFF
 * Accessible at /admin — protected, admin-only.
 * Upload, view, and manage all site media assets.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useRef, useState } from "react";
import { Upload, Trash2, Copy, Check, Image, FileText, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

const LOGO_CREAM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_59ca0122.png";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy URL"
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-lff-cream/50 hover:text-lff-cream" />
      )}
    </button>
  );
}

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const utils = trpc.useUtils();
  const { data: assets, isLoading: assetsLoading } = trpc.storage.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const uploadMutation = trpc.storage.upload.useMutation({
    onSuccess: () => {
      utils.storage.list.invalidate();
      setLabel("");
      toast.success("File uploaded successfully");
    },
    onError: (err) => toast.error(`Upload failed: ${err.message}`),
  });

  const deleteMutation = trpc.storage.delete.useMutation({
    onSuccess: () => {
      utils.storage.list.invalidate();
      toast.success("Asset removed");
    },
    onError: (err) => toast.error(`Delete failed: ${err.message}`),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await uploadMutation.mutateAsync({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64,
            fileSize: file.size,
            label: label || undefined,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
  };

  // Auth guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#54412F" }}>
        <Loader2 className="animate-spin text-lff-cream/50" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: "#54412F" }}>
        <img src={LOGO_CREAM} alt="LFF" className="h-16" />
        <p className="text-lff-cream/60 text-sm">Admin access required</p>
        <a
          href={getLoginUrl()}
          className="px-6 py-3 bg-lff-cream text-lff-dark font-medium text-sm tracking-wider uppercase rounded-sm hover:bg-lff-cream-dark transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#54412F" }}>
        <img src={LOGO_CREAM} alt="LFF" className="h-16" />
        <p className="text-lff-cream/60 text-sm">You don't have admin access.</p>
        <a href="/" className="text-lff-cream/40 text-xs hover:text-lff-cream underline">
          Back to site
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-lff-cream" style={{ backgroundColor: "#2A1F15" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-lff-cream/10 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(42,31,21,0.95)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_CREAM} alt="LFF" className="h-9" />
            <span className="text-lff-cream/30 text-xs tracking-widest uppercase font-medium">
              Media Library
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/leads"
              className="text-lff-cream/40 text-xs hover:text-lff-cream transition-colors tracking-wider uppercase"
            >
              Leads
            </a>
            <a
              href="/"
              className="text-lff-cream/40 text-xs hover:text-lff-cream transition-colors tracking-wider uppercase"
            >
              View Site
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-lff-cream/40 text-xs hover:text-lff-cream transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Upload Zone */}
        <section className="mb-10">
          <h2 className="text-lff-cream/40 text-xs tracking-[0.3em] uppercase font-medium mb-4">
            Upload Files
          </h2>

          {/* Label input */}
          <div className="mb-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label (e.g. testimonial, hero, logo)"
              className="w-full max-w-sm bg-lff-dark-surface border border-lff-cream/10 rounded-sm px-4 py-2.5 text-sm text-lff-cream placeholder:text-lff-cream/30 focus:outline-none focus:border-lff-cream/25 transition-colors"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-sm cursor-pointer transition-all duration-300 ${
              dragOver
                ? "border-lff-cream/40 bg-lff-cream/5"
                : "border-lff-cream/10 hover:border-lff-cream/20 bg-lff-dark-surface/40"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={28} className="animate-spin text-lff-cream/50" />
                <p className="text-lff-cream/50 text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-lff-cream/30" />
                <div className="text-center">
                  <p className="text-lff-cream/60 text-sm font-medium">
                    Drop files here or click to browse
                  </p>
                  <p className="text-lff-cream/30 text-xs mt-1">
                    Images, videos, PDFs — any file type
                  </p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </section>

        {/* Asset Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lff-cream/40 text-xs tracking-[0.3em] uppercase font-medium">
              All Assets
            </h2>
            {assets && (
              <span className="text-lff-cream/30 text-xs">
                {assets.length} file{assets.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {assetsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-lff-cream/30" />
            </div>
          ) : assets && assets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative bg-lff-dark-surface border border-lff-cream/8 rounded-sm overflow-hidden hover:border-lff-cream/15 transition-all duration-300"
                >
                  {/* Preview */}
                  <div className="aspect-square bg-lff-dark flex items-center justify-center overflow-hidden">
                    {asset.mimeType.startsWith("image/") ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText size={32} className="text-lff-cream/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-lff-cream/70 text-xs font-medium truncate" title={asset.filename}>
                      {asset.filename}
                    </p>
                    {asset.label && (
                      <p className="text-lff-cream/30 text-xs truncate">{asset.label}</p>
                    )}
                    <p className="text-lff-cream/25 text-xs mt-0.5">{formatBytes(asset.fileSize)}</p>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={asset.url} />
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${asset.filename}"?`)) {
                          deleteMutation.mutate({ id: asset.id });
                        }
                      }}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400/60 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Image size={40} className="text-lff-cream/15" />
              <p className="text-lff-cream/30 text-sm">No files uploaded yet</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
