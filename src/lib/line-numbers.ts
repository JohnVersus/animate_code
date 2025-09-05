import { LineRange } from "@/types";

/**
 * Expands an array of LineRange objects into a flat array of unique numbers.
 * @param ranges - The array of LineRange objects to expand.
 * @returns A sorted array of unique line numbers.
 */
function expandLineRanges(ranges: LineRange[]): number[] {
  const numbers = new Set<number>();
  ranges.forEach((range) => {
    for (let i = range.start; i <= range.end; i++) {
      numbers.add(i);
    }
  });
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Compacts a sorted array of numbers into an array of LineRange objects.
 * @param numbers - A sorted array of line numbers.
 * @returns An array of LineRange objects representing the compacted ranges.
 */
function compactLineNumbers(numbers: number[]): LineRange[] {
  if (numbers.length === 0) {
    return [];
  }

  const ranges: LineRange[] = [];
  let start = numbers[0];
  let end = numbers[0];

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === end + 1) {
      end = numbers[i];
    } else {
      ranges.push({ start, end });
      start = numbers[i];
      end = numbers[i];
    }
  }

  ranges.push({ start, end });
  return ranges;
}

/**
 * Updates an array of LineRange objects by adding or removing a specific line number.
 * @param ranges - The initial array of LineRange objects.
 * @param lineNumber - The line number to add or remove.
 * @param action - The action to perform: 'add' or 'remove'.
 * @returns A new array of LineRange objects with the line number updated.
 */
export function updateLineRanges(
  ranges: LineRange[],
  lineNumber: number,
  action: "add" | "remove"
): LineRange[] {
  const expandedNumbers = expandLineRanges(ranges);
  const numberSet = new Set(expandedNumbers);

  if (action === "add") {
    numberSet.add(lineNumber);
  } else {
    numberSet.delete(lineNumber);
  }

  const newNumbers = Array.from(numberSet).sort((a, b) => a - b);
  return compactLineNumbers(newNumbers);
}
