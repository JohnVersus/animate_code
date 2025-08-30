import Dexie from "dexie";

/**
 * Utility functions for database management and troubleshooting
 */

/**
 * Clear the IndexedDB database completely
 * This can help resolve corruption issues
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    await Dexie.delete("CodeAnimatorDB");
    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
};

/**
 * Check if IndexedDB is available in the current browser
 */
export const isIndexedDBAvailable = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      "indexedDB" in window &&
      indexedDB !== null
    );
  } catch {
    return false;
  }
};

/**
 * Get database information for debugging
 */
export const getDatabaseInfo = async (): Promise<{
  isAvailable: boolean;
  databases?: string[];
  error?: string;
}> => {
  try {
    if (!isIndexedDBAvailable()) {
      return {
        isAvailable: false,
        error: "IndexedDB is not available in this browser",
      };
    }

    // Try to get list of databases (if supported)
    if ("databases" in indexedDB) {
      const databases = await (indexedDB as any).databases();
      return {
        isAvailable: true,
        databases: databases.map((db: any) => db.name),
      };
    }

    return {
      isAvailable: true,
      databases: ["Database list not supported in this browser"],
    };
  } catch (error) {
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
