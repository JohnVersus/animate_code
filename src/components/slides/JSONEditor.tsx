"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Slide } from "@/types";

interface JSONEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
  totalLines?: number;
}

interface ValidationError {
  line?: number;
  message: string;
}

export function JSONEditor({
  slides,
  onSlidesChange,
  totalLines,
}: JSONEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isValid, setIsValid] = useState(true);

  // Convert slides to formatted JSON when component mounts or slides change externally
  useEffect(() => {
    const formattedJson = JSON.stringify(slides, null, 2);
    setJsonText(formattedJson);
    setValidationErrors([]);
    setIsValid(true);
  }, [slides]);

  const validateJSON = useCallback(
    (text: string): ValidationError[] => {
      const errors: ValidationError[] = [];

      try {
        const parsed = JSON.parse(text);

        // Check if it's an array
        if (!Array.isArray(parsed)) {
          errors.push({ message: "JSON must be an array of slides" });
          return errors;
        }

        // Validate each slide
        parsed.forEach((slide: any, index: number) => {
          const slideNum = index + 1;

          // Required fields
          if (!slide.id || typeof slide.id !== "string") {
            errors.push({
              message: `Slide ${slideNum}: 'id' is required and must be a string`,
            });
          }

          if (!slide.name || typeof slide.name !== "string") {
            errors.push({
              message: `Slide ${slideNum}: 'name' is required and must be a string`,
            });
          }

          if (!Array.isArray(slide.lineRanges)) {
            errors.push({
              message: `Slide ${slideNum}: 'lineRanges' must be an array`,
            });
          } else {
            // Validate line ranges
            slide.lineRanges.forEach((range: any, rangeIndex: number) => {
              if (
                typeof range.start !== "number" ||
                typeof range.end !== "number"
              ) {
                errors.push({
                  message: `Slide ${slideNum}, Range ${
                    rangeIndex + 1
                  }: 'start' and 'end' must be numbers`,
                });
              }
              if (range.start < 1 || range.end < 1) {
                errors.push({
                  message: `Slide ${slideNum}, Range ${
                    rangeIndex + 1
                  }: line numbers must be >= 1`,
                });
              }
              if (range.start > range.end) {
                errors.push({
                  message: `Slide ${slideNum}, Range ${
                    rangeIndex + 1
                  }: 'start' must be <= 'end'`,
                });
              }
              if (
                totalLines &&
                (range.start > totalLines || range.end > totalLines)
              ) {
                errors.push({
                  message: `Slide ${slideNum}, Range ${
                    rangeIndex + 1
                  }: line numbers must be <= ${totalLines} (total lines)`,
                });
              }
            });
          }

          if (typeof slide.duration !== "number" || slide.duration <= 0) {
            errors.push({
              message: `Slide ${slideNum}: 'duration' must be a positive number`,
            });
          }

          const validAnimationStyles = [
            "fade",
            "slide",
            "typewriter",
            "highlight",
          ];
          if (!validAnimationStyles.includes(slide.animationStyle)) {
            errors.push({
              message: `Slide ${slideNum}: 'animationStyle' must be one of: ${validAnimationStyles.join(
                ", "
              )}`,
            });
          }

          if (typeof slide.order !== "number" || slide.order < 0) {
            errors.push({
              message: `Slide ${slideNum}: 'order' must be a non-negative number`,
            });
          }
        });
      } catch (parseError) {
        errors.push({
          message: `Invalid JSON: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`,
        });
      }

      return errors;
    },
    [totalLines]
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = event.target.value;
      setJsonText(newText);

      const errors = validateJSON(newText);
      setValidationErrors(errors);
      setIsValid(errors.length === 0);

      // If valid, update slides
      if (errors.length === 0) {
        try {
          const parsedSlides = JSON.parse(newText) as Slide[];
          onSlidesChange(parsedSlides);
        } catch (error) {
          // This shouldn't happen since we validated above, but just in case
          console.error("Unexpected JSON parse error:", error);
        }
      }
    },
    [validateJSON, onSlidesChange]
  );

  const handleFormatJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
    } catch (error) {
      // If JSON is invalid, don't format
    }
  }, [jsonText]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with controls */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              JSON Editor
            </span>
            {!isValid && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {validationErrors.length} error
                {validationErrors.length !== 1 ? "s" : ""}
              </span>
            )}
            {isValid && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Valid
              </span>
            )}
          </div>
          <button
            onClick={handleFormatJSON}
            className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            disabled={!isValid}
          >
            Format
          </button>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <textarea
          value={jsonText}
          onChange={handleTextChange}
          className={`flex-1 p-4 font-mono text-sm resize-none border-none outline-none ${
            isValid ? "bg-white" : "bg-red-50"
          }`}
          placeholder="Enter JSON for slides..."
          spellCheck={false}
        />

        {/* Error display */}
        {validationErrors.length > 0 && (
          <div className="border-t border-red-200 bg-red-50 p-3 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium text-red-800 mb-2">
              Validation Errors:
            </div>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-xs text-red-700">
                  • {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
