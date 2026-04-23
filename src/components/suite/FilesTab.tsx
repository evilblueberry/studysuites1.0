"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, Trash2, Download, X, Loader2 } from "lucide-react";
import { cn, formatFileSize, formatDate } from "@/lib/utils";

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  storageUrl: string;
  fileSizeBytes: number | null;
  uploadedAt: string;
}

interface Props {
  files: UploadedFile[];
  suiteId: string;
  isOwner: boolean;
}

export default function FilesTab({ files: initialFiles, suiteId, isOwner }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!isOwner) return;
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        accepted.forEach((f) => formData.append("files", f));

        const res = await fetch(`/api/suites/${suiteId}/files`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const { data } = await res.json();
        setFiles((prev) => [...data, ...prev]);
      } catch (err) {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [suiteId, isOwner]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: !isOwner || uploading,
  });

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("docx")) return "📝";
    return "📃";
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Upload zone (owner only) */}
      {isOwner && (
        <div
          {...getRootProps()}
          className={cn(
            "glass-card border-2 border-dashed rounded-2xl p-8 text-center mb-6 cursor-pointer transition-all duration-200",
            isDragActive ? "border-indigo-500/70 bg-indigo-500/10" : "border-white/10 hover:border-white/20",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm text-muted-foreground">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className={cn("w-8 h-8", isDragActive ? "text-indigo-400" : "text-muted-foreground")} />
              <p className="font-medium text-sm">
                {isDragActive ? "Drop to upload" : "Add more files"}
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — up to 20MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg mb-4">{error}</p>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No files uploaded yet.{" "}
          {isOwner ? "Drag files above to add them." : "The owner hasn't uploaded any files."}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">{files.length} file{files.length === 1 ? "" : "s"}</p>
          {files.map((file) => (
            <div key={file.id} className="glass-card p-4 flex items-center gap-4">
              <span className="text-2xl flex-shrink-0">{getFileIcon(file.fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.fileName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {file.fileSizeBytes ? formatFileSize(file.fileSizeBytes) : "Unknown size"} ·{" "}
                  {formatDate(file.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={file.storageUrl}
                  download={file.fileName}
                  className="p-2 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
