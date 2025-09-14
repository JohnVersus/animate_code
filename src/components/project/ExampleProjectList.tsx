"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExampleProject, getExampleProjects } from "@/services/defaultProject";

interface ExampleProjectListProps {
  onExampleSelect: (example: ExampleProject) => void;
}

export function ExampleProjectList({
  onExampleSelect,
}: ExampleProjectListProps) {
  const exampleProjects = getExampleProjects();

  return (
    <div className="space-y-3">
      {exampleProjects.map((example) => (
        <Card
          key={example.name}
          className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 text-left"
          onClick={() => onExampleSelect(example)}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-900">
              {example.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                {example.language}
              </span>
              <span className="ml-2">
                {example.slides.length} slide
                {example.slides.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
