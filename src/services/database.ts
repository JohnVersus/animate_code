// Database service using Dexie.js for local storage
import Dexie, { Table } from "dexie";
import { Project } from "@/types";

export class CodeAnimatorDB extends Dexie {
  projects!: Table<Project>;

  constructor() {
    super("CodeAnimatorDB");
    this.version(1).stores({
      projects: "id, name, language, createdAt, updatedAt",
    });
  }
}

export const db = new CodeAnimatorDB();
