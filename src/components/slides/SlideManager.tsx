"use client";

import React, { useState, useCallback } from "react";
import { Slide } from "@/types";
import { SlideItem } from "./SlideItem";
import { SlideEditor } from "./SlideEditor";
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
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddSlide = useCallback(() => {
    setIsCreating(true);
    setIsPopoverOpen(true);
  }, []);

  const handleCreateSlide = useCallback(
    (slideData: Omit<Slide, "id" | "order">) => {
      const newSlide: Slide = {
        ...slideData,
        id: crypto.randomUUID(),
        order: slides.length,
      };

      const updatedSlides = [...slides, newSlide];
      onSlidesChange(updatedSlides);
      setIsCreating(false);
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
      setEditingSlide(null);
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
    setEditingSlide(null);
    setIsCreating(false);
    setIsPopoverOpen(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {slides.length} slide{slides.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" disabled={editingSlide !== null}>
                Add Slide
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <SlideEditor
                totalLines={totalLines}
                onSave={handleCreateSlide}
                onCancel={handleCancelEdit}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Slide List - Horizontal Layout */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden slide-container">
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
          <div className="p-2 h-full">
            <div className="flex space-x-3 h-full min-w-max">
              {slides.map((slide, index) => (
                <div key={slide.id} className="flex-shrink-0 w-64">
                  {editingSlide === slide.id ? (
                    <SlideEditor
                      slide={slide}
                      totalLines={totalLines}
                      onSave={(slideData) =>
                        handleEditSlide(slide.id, slideData)
                      }
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <SlideItem
                      slide={slide}
                      index={index}
                      isActive={index === currentSlide}
                      totalLines={totalLines}
                      onSelect={() => handleSlideSelect(index)}
                      onEdit={() => setEditingSlide(slide.id)}
                      onDelete={() => handleDeleteSlide(slide.id)}
                      onDuplicate={() => handleDuplicateSlide(slide.id)}
                      onReorder={handleReorderSlides}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
