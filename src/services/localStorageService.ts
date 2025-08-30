// LocalStorage service for additional persistence and quick access
// This complements the IndexedDB storage for better user experience

interface LocalStorageData {
  lastSelectedProject?: string;
  recentProjects?: string[];
  appSettings?: {
    theme?: "light" | "dark";
    autoSave?: boolean;
  };
}

class LocalStorageService {
  private readonly STORAGE_KEY = "code-animator-data";
  private readonly MAX_RECENT_PROJECTS = 5;

  /**
   * Get all data from localStorage
   */
  private getData(): LocalStorageData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
      return {};
    }
  }

  /**
   * Save data to localStorage
   */
  private saveData(data: LocalStorageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  /**
   * Set the last selected project ID
   */
  setLastSelectedProject(projectId: string): void {
    const data = this.getData();
    data.lastSelectedProject = projectId;
    this.saveData(data);
  }

  /**
   * Get the last selected project ID
   */
  getLastSelectedProject(): string | null {
    const data = this.getData();
    return data.lastSelectedProject || null;
  }

  /**
   * Add a project to recent projects list
   */
  addToRecentProjects(projectId: string): void {
    const data = this.getData();
    const recent = data.recentProjects || [];

    // Remove if already exists
    const filtered = recent.filter((id) => id !== projectId);

    // Add to beginning
    filtered.unshift(projectId);

    // Keep only the most recent ones
    data.recentProjects = filtered.slice(0, this.MAX_RECENT_PROJECTS);

    this.saveData(data);
  }

  /**
   * Get recent projects list
   */
  getRecentProjects(): string[] {
    const data = this.getData();
    return data.recentProjects || [];
  }

  /**
   * Remove a project from recent projects
   */
  removeFromRecentProjects(projectId: string): void {
    const data = this.getData();
    if (data.recentProjects) {
      data.recentProjects = data.recentProjects.filter(
        (id) => id !== projectId
      );
      this.saveData(data);
    }
  }

  /**
   * Clear last selected project (useful when project is deleted)
   */
  clearLastSelectedProject(): void {
    const data = this.getData();
    delete data.lastSelectedProject;
    this.saveData(data);
  }

  /**
   * Save app settings
   */
  saveAppSettings(settings: LocalStorageData["appSettings"]): void {
    const data = this.getData();
    data.appSettings = { ...data.appSettings, ...settings };
    this.saveData(data);
  }

  /**
   * Get app settings
   */
  getAppSettings(): LocalStorageData["appSettings"] {
    const data = this.getData();
    return data.appSettings || {};
  }

  /**
   * Clear all localStorage data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
