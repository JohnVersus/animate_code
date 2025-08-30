"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Project, Slide } from "@/types";
import { storageService } from "@/services/storage";
import { localStorageService } from "@/services/localStorageService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Code, Trash2, Calendar, Settings } from "lucide-react";
import { clearDatabase } from "@/utils/dbUtils";

interface CodeManagerProps {
  onCodeSelect: (code: string, language: string, slides: Slide[]) => void;
  currentCode?: string;
  currentLanguage?: string;
  currentSlides?: Slide[];
  onAutoSave?: (projectName: string) => void;
}

export function CodeManager({
  onCodeSelect,
  currentCode = "",
  currentLanguage = "javascript",
  currentSlides = [],
  onAutoSave,
}: CodeManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [showDebugOptions, setShowDebugOptions] = useState(false);

  // Use ref to access current projects without causing re-renders
  const projectsRef = useRef<Project[]>([]);

  // Update ref when projects change
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-save current project when code or slides change
  const autoSaveCurrentProject = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const project = projectsRef.current.find((p) => p.id === selectedProject);
      if (project) {
        const updatedProject: Project = {
          ...project,
          code: currentCode,
          language: currentLanguage,
          slides: currentSlides,
        };

        await storageService.autoSave(updatedProject);

        // Update local state without causing re-render loop
        setProjects((prev) =>
          prev.map((p) => (p.id === selectedProject ? updatedProject : p))
        );

        if (onAutoSave) {
          onAutoSave(project.name);
        }
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [
    selectedProject,
    currentCode,
    currentLanguage,
    currentSlides,
    onAutoSave,
  ]);

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!selectedProject || !currentCode) return;

    const timeoutId = setTimeout(() => {
      autoSaveCurrentProject();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [
    selectedProject,
    currentCode,
    currentLanguage,
    currentSlides,
    autoSaveCurrentProject,
  ]);

  // Handle project selection
  const handleProjectSelect = useCallback(
    (project: Project) => {
      setSelectedProject(project.id);
      onCodeSelect(project.code, project.language, project.slides);

      // Save to localStorage for persistence
      localStorageService.setLastSelectedProject(project.id);
      localStorageService.addToRecentProjects(project.id);
    },
    [onCodeSelect]
  );

  // Auto-select last selected project after projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const lastSelectedId = localStorageService.getLastSelectedProject();
      if (lastSelectedId) {
        const lastProject = projects.find((p) => p.id === lastSelectedId);
        if (lastProject) {
          handleProjectSelect(lastProject);
        }
      }
    }
  }, [projects.length, selectedProject, handleProjectSelect, projects]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setStorageError(null);
      const projectList = await storageService.listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setStorageError(
        "Unable to access project storage. Please refresh the page or try a different browser."
      );
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewProject = async () => {
    if (!newProjectName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const projectData = {
        name: newProjectName.trim(),
        code: `// Welcome to ${newProjectName}
function example() {
  console.log("Start coding here!");
  return "Hello, World!";
}`,
        language: "javascript",
        slides: [],
        settings: {
          globalSpeed: 1,
          defaultAnimationStyle: "fade" as const,
          videoSettings: {
            resolution: "1080p" as const,
            frameRate: 30 as const,
            format: "mp4" as const,
          },
        },
      };

      const projectId = await storageService.saveProject(projectData);

      // Reload projects
      const updatedProjects = await storageService.listProjects();
      setProjects(updatedProjects);

      // Find and select the new project
      const newProject = updatedProjects.find((p) => p.id === projectId);
      if (newProject) {
        handleProjectSelect(newProject);
      }

      setNewProjectName("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering project selection

    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await storageService.deleteProject(projectId);

      // If we're deleting the currently selected project, clear selection
      if (selectedProject === projectId) {
        setSelectedProject(null);
        localStorageService.clearLastSelectedProject();
      }

      // Remove from recent projects
      localStorageService.removeFromRecentProjects(projectId);

      await loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleClearDatabase = async () => {
    if (!confirm("This will delete ALL projects permanently. Are you sure?")) {
      return;
    }

    try {
      await clearDatabase();
      setProjects([]);
      setSelectedProject(null);
      setStorageError(null);
      alert("Database cleared successfully. The page will now reload.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear database:", error);
      alert(
        "Failed to clear database. Please try refreshing the page manually."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading projects...</div>
    );
  }

  if (storageError) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Code Projects</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-red-600 mb-3">{storageError}</p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 mr-2"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => setShowDebugOptions(!showDebugOptions)}
                size="sm"
                variant="outline"
              >
                <Settings className="w-3 h-3 mr-1" />
                Debug Options
              </Button>
            </div>
            {showDebugOptions && (
              <div className="mt-4 p-3 bg-gray-50 rounded border text-left">
                <p className="text-xs text-gray-600 mb-2">
                  If refreshing doesn&apos;t work, you can try clearing the
                  database:
                </p>
                <Button
                  onClick={handleClearDatabase}
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                >
                  Clear All Data
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ This will permanently delete all your projects
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Create Button */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Code Projects</h2>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        createNewProject();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createNewProject}
                    disabled={!newProjectName.trim() || isCreating}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Code className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No projects yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProject === project.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleProjectSelect(project)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    onClick={(e) => deleteProject(project.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {project.language}
                    </span>
                    <span className="ml-2">
                      {project.slides.length} slide
                      {project.slides.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
