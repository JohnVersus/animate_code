"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Slide } from "@/types";
import { SlideJSONValidator, JSONValidationResult } from "@/lib/jsonValidation";

interface JSONEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
  totalLines?: number;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export function JSONEditor({
  slides,
  onSlidesChange,
  totalLines = 0,
  onUnsavedChangesChange,
}: JSONEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [validationResult, setValidationResult] =
    useState<JSONValidationResult>({
      isValid: true,
      errors: [],
      warnings: [],
    });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalText, setOriginalText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validator] = useState(() => new SlideJSONValidator(totalLines));

  // Convert slides to formatted JSON when component mounts or slides change externally
  useEffect(() => {
    const formattedJson = JSON.stringify(slides, null, 2);
    setJsonText(formattedJson);
    setOriginalText(formattedJson);
    setValidationResult({ isValid: true, errors: [], warnings: [] });
    setHasUnsavedChanges(false);
  }, [slides]);

  // Update validator when totalLines changes
  useEffect(() => {
    validator.setTotalLines(totalLines);
  }, [totalLines, validator]);

  const validateJSON = useCallback(
    (text: string): JSONValidationResult => {
      return validator.validateJSON(text);
    },
    [validator]
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = event.target.value;
      setJsonText(newText);

      const result = validateJSON(newText);
      setValidationResult(result);

      // Auto-save: If valid, update slides immediately and mark as saved
      if (result.isValid) {
        try {
          const parsedSlides = JSON.parse(newText) as Slide[];
          onSlidesChange(parsedSlides);
          // Update original text to reflect the saved state
          setOriginalText(newText);
          setHasUnsavedChanges(false);
          onUnsavedChangesChange?.(false);
        } catch (error) {
          // This shouldn't happen since we validated above, but just in case
          console.error("Unexpected JSON parse error:", error);
          const hasChanges = newText !== originalText;
          setHasUnsavedChanges(hasChanges);
          onUnsavedChangesChange?.(hasChanges);
        }
      } else {
        // If invalid, mark as having unsaved changes
        const hasChanges = newText !== originalText;
        setHasUnsavedChanges(hasChanges);
        onUnsavedChangesChange?.(hasChanges);
      }
    },
    [validateJSON, onSlidesChange, originalText, onUnsavedChangesChange]
  );

  const handleFormatJSON = useCallback(() => {
    const formatted = SlideJSONValidator.formatJSON(jsonText);
    if (formatted !== jsonText) {
      setJsonText(formatted);

      // Re-validate after formatting
      const result = validateJSON(formatted);
      setValidationResult(result);

      // Auto-save logic for formatting - same as handleTextChange
      if (result.isValid) {
        try {
          const parsedSlides = JSON.parse(formatted) as Slide[];
          onSlidesChange(parsedSlides);
          // Update original text to reflect the saved state
          setOriginalText(formatted);
          setHasUnsavedChanges(false);
          onUnsavedChangesChange?.(false);
        } catch (error) {
          console.error("Format parse error:", error);
          const hasChanges = formatted !== originalText;
          setHasUnsavedChanges(hasChanges);
          onUnsavedChangesChange?.(hasChanges);
        }
      } else {
        // If invalid, mark as having unsaved changes
        const hasChanges = formatted !== originalText;
        setHasUnsavedChanges(hasChanges);
        onUnsavedChangesChange?.(hasChanges);
      }
    }
  }, [
    jsonText,
    validateJSON,
    onSlidesChange,
    originalText,
    onUnsavedChangesChange,
  ]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            handleFormatJSON();
            break;
        }
      }
    },
    [handleFormatJSON]
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with controls */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              JSON Editor
            </span>
            {!validationResult.isValid && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {validationResult.errors.length} error
                {validationResult.errors.length !== 1 ? "s" : ""}
              </span>
            )}
            {validationResult.warnings.length > 0 && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                {validationResult.warnings.length} warning
                {validationResult.warnings.length !== 1 ? "s" : ""}
              </span>
            )}
            {validationResult.isValid &&
              validationResult.warnings.length === 0 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  Valid
                </span>
              )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormatJSON}
              className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              disabled={!validationResult.isValid}
              title="Format JSON (Ctrl/Cmd+S)"
            >
              Format
            </button>
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Invalid JSON
              </span>
            )}
          </div>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <textarea
          ref={textareaRef}
          value={jsonText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className={`flex-1 p-4 font-mono text-sm resize-none border-none outline-none ${
            validationResult.isValid ? "bg-white" : "bg-red-50"
          }`}
          placeholder={`Enter JSON for slides...

Keyboard shortcuts:
• Ctrl/Cmd+Z: Undo (native browser undo)
• Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: Redo (native browser redo)
• Ctrl/Cmd+S: Format JSON`}
          spellCheck={false}
        />

        {/* Error and Warning display */}
        {(validationResult.errors.length > 0 ||
          validationResult.warnings.length > 0) && (
          <div className="border-t border-gray-200 max-h-40 overflow-y-auto">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border-b border-red-200 p-3">
                <div className="text-xs font-medium text-red-800 mb-2">
                  Validation Errors ({validationResult.errors.length}):
                </div>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={`error-${index}`} className="text-xs text-red-700">
                      <span className="font-medium">{error.path}:</span>{" "}
                      {error.message}
                      {error.line && (
                        <span className="text-red-500 ml-1">
                          (line {error.line})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 p-3">
                <div className="text-xs font-medium text-yellow-800 mb-2">
                  Warnings ({validationResult.warnings.length}):
                </div>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li
                      key={`warning-${index}`}
                      className="text-xs text-yellow-700"
                    >
                      <span className="font-medium">{warning.path}:</span>{" "}
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
