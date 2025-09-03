"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Slide } from "@/types";
import { SlideItem } from "./SlideItem";
import { SlideEditor } from "./SlideEditor";
import { JSONEditor } from "./JSONEditor";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SlideManagerProps {
  slides: Slide[];
  currentSlide: number;
  totalLines: number;
  onSlidesChange: (slides: Slide[]) => void;
  onCurrentSlideChange: (index: number) => void;
}

export function SlideManager({
  slides,
  currentSlide,
  totalLines,
  onSlidesChange,
  onCurrentSlideChange,
}: SlideManagerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<"visual" | "json">("visual");
  const [jsonModeSlides, setJsonModeSlides] = useState<Slide[]>(slides);
  const [hasUnsavedJsonChanges, setHasUnsavedJsonChanges] = useState(false);

  // Sync jsonModeSlides when slides change from outside (e.g., visual mode changes)
  useEffect(() => {
    if (editingMode === "visual") {
      setJsonModeSlides(slides);
    }
  }, [slides, editingMode]);

  const handleCreateSlide = useCallback(
    (slideData: Omit<Slide, "id" | "order">) => {
      const newSlide: Slide = {
        ...slideData,
        id: crypto.randomUUID(),
        order: slides.length,
      };

      const updatedSlides = [...slides, newSlide];
      onSlidesChange(updatedSlides);
      setIsPopoverOpen(false);
    },
    [slides, onSlidesChange]
  );

  const handleEditSlide = useCallback(
    (slideId: string, slideData: Omit<Slide, "id" | "order">) => {
      const updatedSlides = slides.map((slide) =>
        slide.id === slideId ? { ...slide, ...slideData } : slide
      );
      onSlidesChange(updatedSlides);
    },
    [slides, onSlidesChange]
  );

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      const updatedSlides = slides
        .filter((slide) => slide.id !== slideId)
        .map((slide, index) => ({ ...slide, order: index }));

      onSlidesChange(updatedSlides);

      // Adjust current slide if necessary
      if (currentSlide >= updatedSlides.length) {
        onCurrentSlideChange(Math.max(0, updatedSlides.length - 1));
      }
    },
    [slides, currentSlide, onSlidesChange, onCurrentSlideChange]
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      const slideToClone = slides.find((slide) => slide.id === slideId);
      if (!slideToClone) return;

      const newSlide: Slide = {
        ...slideToClone,
        id: crypto.randomUUID(),
        name: `${slideToClone.name} (Copy)`,
        order: slides.length,
      };

      const updatedSlides = [...slides, newSlide];
      onSlidesChange(updatedSlides);
    },
    [slides, onSlidesChange]
  );

  const handleReorderSlides = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragSlide = slides[dragIndex];
      const updatedSlides = [...slides];

      // Remove the dragged slide
      updatedSlides.splice(dragIndex, 1);
      // Insert it at the new position
      updatedSlides.splice(hoverIndex, 0, dragSlide);

      // Update order values
      const reorderedSlides = updatedSlides.map((slide, index) => ({
        ...slide,
        order: index,
      }));

      onSlidesChange(reorderedSlides);

      // Update current slide index if necessary
      if (currentSlide === dragIndex) {
        onCurrentSlideChange(hoverIndex);
      } else if (dragIndex < currentSlide && hoverIndex >= currentSlide) {
        onCurrentSlideChange(currentSlide - 1);
      } else if (dragIndex > currentSlide && hoverIndex <= currentSlide) {
        onCurrentSlideChange(currentSlide + 1);
      }
    },
    [slides, currentSlide, onSlidesChange, onCurrentSlideChange]
  );

  const handleSlideSelect = useCallback(
    (index: number) => {
      onCurrentSlideChange(index);
    },
    [onCurrentSlideChange]
  );

  const handleCancelEdit = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const handleToggleEditingMode = useCallback(() => {
    const newMode = editingMode === "visual" ? "json" : "visual";

    // If switching to JSON mode, sync the current slides
    if (newMode === "json") {
      setJsonModeSlides(slides);
    }

    setEditingMode(newMode);
  }, [editingMode, slides]);

  const handleUnsavedChangesChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedJsonChanges(hasChanges);
  }, []);

  const confirmModeSwitch = useCallback(() => {
    if (hasUnsavedJsonChanges) {
      return window.confirm(
        "You have invalid JSON that cannot be auto-saved. Switching modes will discard these changes. Do you want to continue?"
      );
    }
    return true;
  }, [hasUnsavedJsonChanges]);

  const handleJsonSlidesChange = useCallback(
    (newSlides: Slide[]) => {
      setJsonModeSlides(newSlides);
      // Immediately apply changes to the main slides
      onSlidesChange(newSlides);
    },
    [onSlidesChange]
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {slides.length} slide{slides.length !== 1 ? "s" : ""}
            </span>
            {editingMode === "visual" && (
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm">Add Slide</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <SlideEditor
                    totalLines={totalLines}
                    slideCount={slides.length}
                    onSave={handleCreateSlide}
                    onCancel={handleCancelEdit}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* JSON/Visual Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => {
                  if (editingMode === "json") {
                    // Check for unsaved changes when switching from JSON to Visual
                    if (confirmModeSwitch()) {
                      setEditingMode("visual");
                      setHasUnsavedJsonChanges(false);
                    }
                  } else {
                    setEditingMode("visual");
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  editingMode === "visual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Visual
                {editingMode === "json" && hasUnsavedJsonChanges && (
                  <span className="ml-1 w-1.5 h-1.5 bg-orange-500 rounded-full inline-block"></span>
                )}
              </button>
              <button
                onClick={() => {
                  if (editingMode === "visual") {
                    setJsonModeSlides(slides);
                    setEditingMode("json");
                  } else {
                    setEditingMode("json");
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  editingMode === "json"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                JSON
                {editingMode === "json" && hasUnsavedJsonChanges && (
                  <span className="ml-1 w-1.5 h-1.5 bg-orange-500 rounded-full inline-block"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {editingMode === "visual" ? (
          /* Visual Mode - Slide List - Grid Layout */
          <div className="h-full overflow-y-auto overflow-x-hidden">
            {slides.length === 0 ? (
              <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
                <div>
                  <p className="text-sm">No slides yet.</p>
                  <p className="text-xs mt-1">
                    Click &quot;Add Slide&quot; to get started.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {slides.map((slide, index) => (
                    <div key={slide.id} className="w-full">
                      <SlideItem
                        slide={slide}
                        index={index}
                        isActive={index === currentSlide}
                        totalLines={totalLines}
                        onSelect={() => handleSlideSelect(index)}
                        onEdit={handleEditSlide}
                        onDelete={() => handleDeleteSlide(slide.id)}
                        onDuplicate={() => handleDuplicateSlide(slide.id)}
                        onReorder={handleReorderSlides}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* JSON Mode */
          <JSONEditor
            slides={jsonModeSlides}
            onSlidesChange={handleJsonSlidesChange}
            totalLines={totalLines}
            onUnsavedChangesChange={handleUnsavedChangesChange}
          />
        )}
      </div>
    </div>
  );
}
