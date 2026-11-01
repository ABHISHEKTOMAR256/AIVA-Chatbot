"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  preview?: string | null;
  isUploading?: boolean;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  onRemove,
  accept = "image/*",
  maxSizeMB = 10,
  preview,
  isUploading = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return false;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be smaller than ${maxSizeMB}MB.`);
        return false;
      }

      return true;
    },
    [maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;

      const reader = new FileReader();
      reader.onload = () => {
        setLocalPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setLocalPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  }, [onRemove]);

  const displayPreview = preview || localPreview;

  return (
    <div className={cn("w-full", className)}>
      {displayPreview ? (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPreview}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Spinner size="md" className="border-white border-t-transparent" />
            </div>
          )}
          {!isUploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Remove image"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-150",
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          )}
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <ImageIcon className="h-8 w-8 text-primary-500" />
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
            <p className="text-sm text-gray-600">
              {isDragging ? (
                "Drop your image here"
              ) : (
                <>
                  <span className="font-medium text-primary-600">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FileUpload };
