// Database service using Dexie.js for local storage
import Dexie, { Table } from "dexie";
import { CodeSnippet, AnimationProject } from "@/types";

export class CodeAnimatorDB extends Dexie {
  codeSnippets!: Table<CodeSnippet>;
  animationProjects!: Table<AnimationProject>;

  constructor() {
    super("CodeAnimatorDB");
    this.version(1).stores({
      codeSnippets: "id, title, language, createdAt, updatedAt",
      animationProjects: "id, name, codeSnippetId, createdAt, updatedAt",
    });
  }
}

export const db = new CodeAnimatorDB();
