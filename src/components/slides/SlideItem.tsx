"use client";

import React, { useRef } from "react";
import { Slide } from "@/types";
import { formatLineRanges, validateSlide } from "@/lib/validation";
import { Button } from "@/components/ui/button";

interface SlideItemProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  totalLines: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

export function SlideItem({
  slide,
  index,
  isActive,
  totalLines,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onReorder,
}: SlideItemProps) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const validation = validateSlide(slide, totalLines);
  const hasErrors = !validation.isValid;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragOverIndex(null);
  };

  const formatDuration = (duration: number) => {
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getAnimationStyleIcon = (style: string) => {
    switch (style) {
      case "fade":
        return "⚡";
      case "slide":
        return "➡️";
      case "typewriter":
        return "⌨️";
      case "highlight":
        return "🔆";
      default:
        return "⚡";
    }
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group relative p-2 rounded-lg border cursor-pointer transition-all duration-200
        ${
          isActive
            ? "bg-blue-50 border-blue-300 shadow-sm"
            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
        ${isDragging ? "opacity-50" : ""}
        ${dragOverIndex === index ? "border-blue-400 bg-blue-25" : ""}
        ${hasErrors ? "border-red-300 bg-red-50" : ""}
      `}
      onClick={onSelect}
    >
      {/* Drag indicator */}
      <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
        ⋮⋮
      </div>

      {/* Slide content */}
      <div className="ml-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">
              #{index + 1}
            </span>
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {slide.name}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              title="Edit slide"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              title="Duplicate slide"
            >
              📋
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this slide?")) {
                  onDelete();
                }
              }}
              className="h-6 w-6 text-gray-400 hover:text-red-600"
              title="Delete slide"
            >
              🗑️
            </Button>
          </div>
        </div>

        {/* Line ranges */}
        <div className="mb-1">
          <span className="text-xs text-gray-500">Lines: </span>
          <span className="text-xs font-mono text-gray-700">
            {formatLineRanges(slide.lineRanges)}
          </span>
        </div>

        {/* Animation info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <span>{getAnimationStyleIcon(slide.animationStyle)}</span>
              <span className="capitalize">{slide.animationStyle}</span>
            </span>
            <span>•</span>
            <span>{formatDuration(slide.duration)}</span>
          </div>
        </div>

        {/* Error messages */}
        {hasErrors && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            <div className="font-medium mb-1">Validation errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-2 top-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );
}
