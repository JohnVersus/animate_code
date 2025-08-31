import { Slide, AnimationStyle, LineRange } from "@/types";
import { validateLineRanges, validateSlide } from "./validation";

export interface JSONValidationError {
  path: string;
  message: string;
  code: string;
  line?: number;
}

export interface JSONValidationResult {
  isValid: boolean;
  errors: JSONValidationError[];
  warnings: JSONValidationError[];
}

/**
 * Comprehensive JSON schema validation for slides
 */
export class SlideJSONValidator {
  private totalLines: number;

  constructor(totalLines: number = 0) {
    this.totalLines = totalLines;
  }

  /**
   * Update the total lines count for validation
   */
  setTotalLines(totalLines: number): void {
    this.totalLines = totalLines;
  }

  /**
   * Validate JSON string and parse slides
   */
  validateJSON(jsonString: string): JSONValidationResult {
    const errors: JSONValidationError[] = [];
    const warnings: JSONValidationError[] = [];

    // Step 1: Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      const error = parseError as Error;
      const lineMatch = error.message.match(/line (\d+)/);
      const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

      errors.push({
        path: "root",
        message: `Invalid JSON syntax: ${error.message}`,
        code: "INVALID_JSON",
        line,
      });

      return { isValid: false, errors, warnings };
    }

    // Step 2: Validate root structure
    if (!Array.isArray(parsed)) {
      errors.push({
        path: "root",
        message: "JSON must be an array of slides",
        code: "INVALID_ROOT_TYPE",
      });
      return { isValid: false, errors, warnings };
    }

    // Step 3: Validate each slide
    const slideIds = new Set<string>();
    const slideNames = new Set<string>();
    const slideOrders = new Set<number>();

    parsed.forEach((slide: any, index: number) => {
      const slidePath = `slides[${index}]`;
      this.validateSlideStructure(slide, slidePath, errors, warnings);

      // Check for duplicate IDs
      if (slide.id && slideIds.has(slide.id)) {
        errors.push({
          path: `${slidePath}.id`,
          message: `Duplicate slide ID: ${slide.id}`,
          code: "DUPLICATE_ID",
        });
      } else if (slide.id) {
        slideIds.add(slide.id);
      }

      // Check for duplicate names (warning only)
      if (slide.name && slideNames.has(slide.name)) {
        warnings.push({
          path: `${slidePath}.name`,
          message: `Duplicate slide name: ${slide.name}`,
          code: "DUPLICATE_NAME",
        });
      } else if (slide.name) {
        slideNames.add(slide.name);
      }

      // Check for duplicate orders (warning only)
      if (typeof slide.order === "number" && slideOrders.has(slide.order)) {
        warnings.push({
          path: `${slidePath}.order`,
          message: `Duplicate slide order: ${slide.order}`,
          code: "DUPLICATE_ORDER",
        });
      } else if (typeof slide.order === "number") {
        slideOrders.add(slide.order);
      }
    });

    // Step 4: Validate slide sequence and ordering
    this.validateSlideSequence(parsed, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate individual slide structure
   */
  private validateSlideStructure(
    slide: any,
    slidePath: string,
    errors: JSONValidationError[],
    warnings: JSONValidationError[]
  ): void {
    // Required field: id
    if (!slide.hasOwnProperty("id")) {
      errors.push({
        path: `${slidePath}.id`,
        message: "Missing required field 'id'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else if (typeof slide.id !== "string") {
      errors.push({
        path: `${slidePath}.id`,
        message: "Field 'id' must be a string",
        code: "INVALID_FIELD_TYPE",
      });
    } else if (slide.id.trim() === "") {
      errors.push({
        path: `${slidePath}.id`,
        message: "Field 'id' cannot be empty",
        code: "EMPTY_REQUIRED_FIELD",
      });
    }

    // Required field: name
    if (!slide.hasOwnProperty("name")) {
      errors.push({
        path: `${slidePath}.name`,
        message: "Missing required field 'name'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else if (typeof slide.name !== "string") {
      errors.push({
        path: `${slidePath}.name`,
        message: "Field 'name' must be a string",
        code: "INVALID_FIELD_TYPE",
      });
    } else if (slide.name.trim() === "") {
      errors.push({
        path: `${slidePath}.name`,
        message: "Field 'name' cannot be empty",
        code: "EMPTY_REQUIRED_FIELD",
      });
    }

    // Required field: lineRanges
    if (!slide.hasOwnProperty("lineRanges")) {
      errors.push({
        path: `${slidePath}.lineRanges`,
        message: "Missing required field 'lineRanges'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else if (!Array.isArray(slide.lineRanges)) {
      errors.push({
        path: `${slidePath}.lineRanges`,
        message: "Field 'lineRanges' must be an array",
        code: "INVALID_FIELD_TYPE",
      });
    } else {
      this.validateLineRanges(
        slide.lineRanges,
        `${slidePath}.lineRanges`,
        errors,
        warnings
      );
    }

    // Required field: duration
    if (!slide.hasOwnProperty("duration")) {
      errors.push({
        path: `${slidePath}.duration`,
        message: "Missing required field 'duration'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else if (typeof slide.duration !== "number") {
      errors.push({
        path: `${slidePath}.duration`,
        message: "Field 'duration' must be a number",
        code: "INVALID_FIELD_TYPE",
      });
    } else if (slide.duration <= 0) {
      errors.push({
        path: `${slidePath}.duration`,
        message: "Field 'duration' must be greater than 0",
        code: "INVALID_FIELD_VALUE",
      });
    } else if (slide.duration < 100) {
      warnings.push({
        path: `${slidePath}.duration`,
        message:
          "Duration less than 100ms may be too fast for smooth animation",
        code: "DURATION_TOO_SHORT",
      });
    } else if (slide.duration > 10000) {
      warnings.push({
        path: `${slidePath}.duration`,
        message: "Duration greater than 10 seconds may be too slow",
        code: "DURATION_TOO_LONG",
      });
    }

    // Required field: animationStyle
    if (!slide.hasOwnProperty("animationStyle")) {
      errors.push({
        path: `${slidePath}.animationStyle`,
        message: "Missing required field 'animationStyle'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else {
      const validStyles: AnimationStyle[] = [
        "fade",
        "slide",
        "typewriter",
        "highlight",
      ];
      if (!validStyles.includes(slide.animationStyle)) {
        errors.push({
          path: `${slidePath}.animationStyle`,
          message: `Invalid animation style '${
            slide.animationStyle
          }'. Must be one of: ${validStyles.join(", ")}`,
          code: "INVALID_FIELD_VALUE",
        });
      }
    }

    // Required field: order
    if (!slide.hasOwnProperty("order")) {
      errors.push({
        path: `${slidePath}.order`,
        message: "Missing required field 'order'",
        code: "MISSING_REQUIRED_FIELD",
      });
    } else if (typeof slide.order !== "number") {
      errors.push({
        path: `${slidePath}.order`,
        message: "Field 'order' must be a number",
        code: "INVALID_FIELD_TYPE",
      });
    } else if (slide.order < 0) {
      errors.push({
        path: `${slidePath}.order`,
        message: "Field 'order' must be non-negative",
        code: "INVALID_FIELD_VALUE",
      });
    } else if (!Number.isInteger(slide.order)) {
      errors.push({
        path: `${slidePath}.order`,
        message: "Field 'order' must be an integer",
        code: "INVALID_FIELD_VALUE",
      });
    }

    // Check for unknown fields
    const knownFields = [
      "id",
      "name",
      "lineRanges",
      "duration",
      "animationStyle",
      "order",
    ];
    Object.keys(slide).forEach((key) => {
      if (!knownFields.includes(key)) {
        warnings.push({
          path: `${slidePath}.${key}`,
          message: `Unknown field '${key}' will be ignored`,
          code: "UNKNOWN_FIELD",
        });
      }
    });
  }

  /**
   * Validate line ranges array
   */
  private validateLineRanges(
    lineRanges: any[],
    rangePath: string,
    errors: JSONValidationError[],
    warnings: JSONValidationError[]
  ): void {
    if (lineRanges.length === 0) {
      errors.push({
        path: rangePath,
        message: "At least one line range is required",
        code: "EMPTY_LINE_RANGES",
      });
      return;
    }

    const validRanges: LineRange[] = [];

    lineRanges.forEach((range: any, index: number) => {
      const rangeItemPath = `${rangePath}[${index}]`;

      if (typeof range !== "object" || range === null) {
        errors.push({
          path: rangeItemPath,
          message: "Line range must be an object",
          code: "INVALID_FIELD_TYPE",
        });
        return;
      }

      // Validate start field
      if (!range.hasOwnProperty("start")) {
        errors.push({
          path: `${rangeItemPath}.start`,
          message: "Missing required field 'start'",
          code: "MISSING_REQUIRED_FIELD",
        });
      } else if (typeof range.start !== "number") {
        errors.push({
          path: `${rangeItemPath}.start`,
          message: "Field 'start' must be a number",
          code: "INVALID_FIELD_TYPE",
        });
      } else if (!Number.isInteger(range.start)) {
        errors.push({
          path: `${rangeItemPath}.start`,
          message: "Field 'start' must be an integer",
          code: "INVALID_FIELD_VALUE",
        });
      } else if (range.start < 1) {
        errors.push({
          path: `${rangeItemPath}.start`,
          message: "Field 'start' must be at least 1",
          code: "INVALID_FIELD_VALUE",
        });
      }

      // Validate end field
      if (!range.hasOwnProperty("end")) {
        errors.push({
          path: `${rangeItemPath}.end`,
          message: "Missing required field 'end'",
          code: "MISSING_REQUIRED_FIELD",
        });
      } else if (typeof range.end !== "number") {
        errors.push({
          path: `${rangeItemPath}.end`,
          message: "Field 'end' must be a number",
          code: "INVALID_FIELD_TYPE",
        });
      } else if (!Number.isInteger(range.end)) {
        errors.push({
          path: `${rangeItemPath}.end`,
          message: "Field 'end' must be an integer",
          code: "INVALID_FIELD_VALUE",
        });
      } else if (range.end < 1) {
        errors.push({
          path: `${rangeItemPath}.end`,
          message: "Field 'end' must be at least 1",
          code: "INVALID_FIELD_VALUE",
        });
      }

      // Cross-field validation
      if (
        typeof range.start === "number" &&
        typeof range.end === "number" &&
        Number.isInteger(range.start) &&
        Number.isInteger(range.end)
      ) {
        if (range.start > range.end) {
          errors.push({
            path: rangeItemPath,
            message: `Start line (${range.start}) cannot be greater than end line (${range.end})`,
            code: "INVALID_RANGE",
          });
        }

        // Validate against total lines if available
        if (this.totalLines > 0) {
          if (range.start > this.totalLines) {
            errors.push({
              path: `${rangeItemPath}.start`,
              message: `Start line (${range.start}) exceeds total lines (${this.totalLines})`,
              code: "LINE_OUT_OF_BOUNDS",
            });
          }
          if (range.end > this.totalLines) {
            errors.push({
              path: `${rangeItemPath}.end`,
              message: `End line (${range.end}) exceeds total lines (${this.totalLines})`,
              code: "LINE_OUT_OF_BOUNDS",
            });
          }
        }

        // Add to valid ranges for overlap checking
        if (
          range.start <= range.end &&
          range.start >= 1 &&
          (this.totalLines === 0 || range.end <= this.totalLines)
        ) {
          validRanges.push({ start: range.start, end: range.end });
        }
      }

      // Check for unknown fields in range
      const knownRangeFields = ["start", "end"];
      Object.keys(range).forEach((key) => {
        if (!knownRangeFields.includes(key)) {
          warnings.push({
            path: `${rangeItemPath}.${key}`,
            message: `Unknown field '${key}' in line range will be ignored`,
            code: "UNKNOWN_FIELD",
          });
        }
      });
    });

    // Check for overlapping ranges
    this.checkOverlappingRanges(validRanges, rangePath, warnings);
  }

  /**
   * Check for overlapping line ranges
   */
  private checkOverlappingRanges(
    ranges: LineRange[],
    rangePath: string,
    warnings: JSONValidationError[]
  ): void {
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const range1 = ranges[i];
        const range2 = ranges[j];

        if (range1.start <= range2.end && range2.start <= range1.end) {
          warnings.push({
            path: rangePath,
            message: `Overlapping line ranges: [${range1.start}-${range1.end}] and [${range2.start}-${range2.end}]`,
            code: "OVERLAPPING_RANGES",
          });
        }
      }
    }
  }

  /**
   * Validate slide sequence and ordering
   */
  private validateSlideSequence(
    slides: any[],
    errors: JSONValidationError[],
    warnings: JSONValidationError[]
  ): void {
    if (slides.length === 0) {
      errors.push({
        path: "slides",
        message: "At least one slide is required",
        code: "EMPTY_SLIDES_ARRAY",
      });
      return;
    }

    // Check if orders form a valid sequence
    const orders = slides
      .map((slide, index) => ({ order: slide.order, index }))
      .filter(({ order }) => typeof order === "number")
      .sort((a, b) => a.order - b.order);

    // Check for gaps in ordering
    for (let i = 0; i < orders.length - 1; i++) {
      const currentOrder = orders[i].order;
      const nextOrder = orders[i + 1].order;

      if (nextOrder - currentOrder > 1) {
        warnings.push({
          path: "slides",
          message: `Gap in slide ordering between ${currentOrder} and ${nextOrder}`,
          code: "ORDERING_GAP",
        });
      }
    }

    // Suggest reordering if orders don't start from 0
    if (orders.length > 0 && orders[0].order !== 0) {
      warnings.push({
        path: "slides",
        message: "Slide ordering should start from 0 for optimal organization",
        code: "ORDERING_NOT_ZERO_BASED",
      });
    }
  }

  /**
   * Auto-format JSON with proper indentation
   */
  static formatJSON(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // Return original string if parsing fails
      return jsonString;
    }
  }
}
