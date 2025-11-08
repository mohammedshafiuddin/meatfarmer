import fs from "fs";
import path from "path";

export class DiskPersistedSet {
  private set: Set<string>;
  private readonly filePath: string;
  private dirty = false;

  constructor(filePath: string = "./persister") {
    this.filePath = path.resolve(filePath);

    // ✅ Ensure file exists
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "", "utf8");
    }

    // ✅ Load existing values from file
    const contents = fs.readFileSync(this.filePath, "utf8");
    this.set = new Set(
      contents.split("\n").map(x => x.trim()).filter(x => x.length > 0)
    );

    this.registerExitHandlers();
  }

  private persist() {
    if (!this.dirty) return;
    fs.writeFileSync(this.filePath, Array.from(this.set).join("\n"), "utf8");
    this.dirty = false;
  }

  private markDirty() {
    this.dirty = true;
  }

  add(value: string): void {
    if (!this.set.has(value)) {
      this.set.add(value);
      this.markDirty();
      this.persist();
    }
  }

  delete(value: string): void {
    if (this.set.delete(value)) {
      this.markDirty();
      this.persist();
    }
  }

  has(value: string): boolean {
    return this.set.has(value);
  }

  values(): string[] {
    return Array.from(this.set);
  }

  clear(): void {
    if (this.set.size > 0) {
      this.set.clear();
      this.markDirty();
      this.persist();
    }
  }

  private registerExitHandlers() {
    const flush = () => this.persist();

    process.on("exit", flush);
    process.on("SIGINT", () => { flush(); process.exit(); });
    process.on("SIGTERM", () => { flush(); process.exit(); });
    process.on("uncaughtException", (err) => {
      console.error("Uncaught exception. Flushing DiskPersistedSet:", err);
      flush();
      process.exit(1);
    });
  }
}
