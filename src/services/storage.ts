import Dexie, { Table } from "dexie";
import { Project, ErrorType, AppError } from "../types";

// Database schema for IndexedDB
export class CodeAnimatorDB extends Dexie {
  projects!: Table<Project>;

  constructor() {
    super("CodeAnimatorDB");
    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt",
    });

    // Add error handling for database issues
    this.on("blocked", () => {
      console.warn(
        "Database is blocked. Please close other tabs with this application."
      );
    });

    this.on("versionchange", () => {
      console.warn("Database version changed. Reloading...");
      window.location.reload();
    });
  }
}

// Create database instance with error handling
let db: CodeAnimatorDB;
let dbInitialized = false;

const initializeDB = async (): Promise<CodeAnimatorDB> => {
  if (dbInitialized && db) {
    return db;
  }

  try {
    db = new CodeAnimatorDB();
    await db.open();
    dbInitialized = true;
    return db;
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);

    // If IndexedDB fails, try to delete and recreate
    try {
      await Dexie.delete("CodeAnimatorDB");
      db = new CodeAnimatorDB();
      await db.open();
      dbInitialized = true;
      console.log("Successfully recreated database after error");
      return db;
    } catch (recreateError) {
      console.error("Failed to recreate database:", recreateError);
      throw new Error(
        "IndexedDB is not available. Please try refreshing the page or use a different browser."
      );
    }
  }
};

export interface StorageService {
  saveProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<string>;
  updateProject(project: Project): Promise<void>;
  loadProject(id: string): Promise<Project>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
  autoSave(project: Project): Promise<void>;
}

class StorageServiceImpl implements StorageService {
  private autoSaveTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly AUTO_SAVE_DELAY = 2000; // 2 seconds debounce

  /**
   * Save a new project to IndexedDB
   */
  async saveProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const database = await initializeDB();
      const now = new Date();
      const newProject: Project = {
        ...project,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      };

      await database.projects.add(newProject);
      return newProject.id;
    } catch (error) {
      throw this.createStorageError("Failed to save project", error);
    }
  }

  /**
   * Update an existing project in IndexedDB
   */
  async updateProject(project: Project): Promise<void> {
    try {
      const database = await initializeDB();
      const updatedProject = {
        ...project,
        updatedAt: new Date(),
      };

      const result = await database.projects.update(project.id, updatedProject);
      if (result === 0) {
        throw new Error(`Project with id ${project.id} not found`);
      }
    } catch (error) {
      throw this.createStorageError("Failed to update project", error);
    }
  }

  /**
   * Load a project by ID from IndexedDB
   */
  async loadProject(id: string): Promise<Project> {
    try {
      const database = await initializeDB();
      const project = await database.projects.get(id);
      if (!project) {
        throw new Error(`Project with id ${id} not found`);
      }
      return project;
    } catch (error) {
      throw this.createStorageError("Failed to load project", error);
    }
  }

  /**
   * List all projects from IndexedDB, sorted by updatedAt descending
   */
  async listProjects(): Promise<Project[]> {
    try {
      const database = await initializeDB();
      return await database.projects.orderBy("updatedAt").reverse().toArray();
    } catch (error) {
      console.error("Failed to list projects:", error);
      // Return empty array if database fails, don't crash the app
      return [];
    }
  }

  /**
   * Delete a project by ID from IndexedDB
   */
  async deleteProject(id: string): Promise<void> {
    try {
      const database = await initializeDB();
      // First check if project exists
      const project = await database.projects.get(id);
      if (!project) {
        throw new Error(`Project with id ${id} not found`);
      }

      await database.projects.delete(id);

      // Clear any pending auto-save for this project
      this.clearAutoSave(id);
    } catch (error) {
      throw this.createStorageError("Failed to delete project", error);
    }
  }

  /**
   * Auto-save a project with debouncing to avoid excessive saves
   */
  async autoSave(project: Project): Promise<void> {
    // Clear existing timeout for this project
    this.clearAutoSave(project.id);

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      try {
        await this.updateProject(project);
        this.autoSaveTimeouts.delete(project.id);
      } catch (error) {
        // Log error but don't throw to avoid disrupting user experience
        console.error("Auto-save failed:", error);
      }
    }, this.AUTO_SAVE_DELAY);

    this.autoSaveTimeouts.set(project.id, timeout);
  }

  /**
   * Clear auto-save timeout for a project
   */
  private clearAutoSave(projectId: string): void {
    const timeout = this.autoSaveTimeouts.get(projectId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoSaveTimeouts.delete(projectId);
    }
  }

  /**
   * Generate a unique ID for projects
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a standardized storage error
   */
  private createStorageError(message: string, originalError: any): AppError {
    return {
      type: ErrorType.STORAGE_ERROR,
      message,
      details: originalError,
      timestamp: new Date(),
    };
  }

  /**
   * Clear all pending auto-saves (useful for cleanup)
   */
  clearAllAutoSaves(): void {
    this.autoSaveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.autoSaveTimeouts.clear();
  }
}

// Export singleton instance
export const storageService = new StorageServiceImpl();

// Export database initialization function for advanced usage if needed
export { initializeDB };
