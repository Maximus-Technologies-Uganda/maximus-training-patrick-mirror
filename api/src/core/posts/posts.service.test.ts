import { PostsService } from "./posts.service";

describe("PostsService", () => {
  let service: PostsService;

  beforeEach(() => {
    service = new PostsService();
  });

  describe("create", () => {
    it("should create a post successfully with id and timestamps", async () => {
      const created = await service.create({ title: "Hello", content: "World content" });
      expect(created).toMatchObject({ title: "Hello", content: "World content" });
      expect(typeof created.id).toBe("string");
      expect(created.id).toBeTruthy();
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getById", () => {
    it("should return the correct post when the ID exists", async () => {
      const created = await service.create({ title: "T1", content: "C1" });
      const fetched = await service.getById(created.id);
      expect(fetched).toEqual(created);
    });

    it("should return null when the ID does not exist", async () => {
      const fetched = await service.getById("missing-id");
      expect(fetched).toBeNull();
    });
  });

  describe("list", () => {
    it("should return an empty paginated response when there are no posts", async () => {
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.currentPage).toBe(1);
    });

    it("should return a paginated list of posts correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await service.create({ title: `T${i}`, content: `C${i}` });
        // Small delay to ensure unique createdAt timestamps
        await new Promise((resolve) => setTimeout(resolve, 2));
      }

      const page1 = await service.list({ page: 1, pageSize: 2 });
      expect(page1.items.map((p) => p.title)).toEqual(["T5", "T4"]);
      expect(page1.totalItems).toBe(5);
      expect(page1.totalPages).toBe(3);
      expect(page1.currentPage).toBe(1);

      const page2 = await service.list({ page: 2, pageSize: 2 });
      expect(page2.items.map((p) => p.title)).toEqual(["T3", "T2"]);
      expect(page2.totalItems).toBe(5);
      expect(page2.totalPages).toBe(3);
      expect(page2.currentPage).toBe(2);

      const page3 = await service.list({ page: 3, pageSize: 2 });
      expect(page3.items.map((p) => p.title)).toEqual(["T1"]);
      expect(page3.totalItems).toBe(5);
      expect(page3.totalPages).toBe(3);
      expect(page3.currentPage).toBe(3);
    });
  });

  describe("update", () => {
    it("should update an existing post's data and updatedAt timestamp", async () => {
      const created = await service.create({ title: "Old", content: "Content" });
      const prevUpdatedAt = created.updatedAt;
      await new Promise((r) => setTimeout(r, 2));
      const updated = await service.update(created.id, { title: "New" });

      expect(updated).not.toBeNull();
      expect(updated!.id).toBe(created.id);
      expect(updated!.title).toBe("New");
      expect(updated!.content).toBe("Content");
      expect(updated!.createdAt).toEqual(created.createdAt);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(prevUpdatedAt.getTime());
    });

    it("should return null when trying to update a non-existent post", async () => {
      const updated = await service.update("does-not-exist", { title: "X" });
      expect(updated).toBeNull();
    });
  });

  describe("replace", () => {
    it("should replace post data, preserve id/createdAt, and return Date instances", async () => {
      const created = await service.create({ title: "Original", content: "Original content" });
      const originalCreatedAt = created.createdAt;
      await new Promise((r) => setTimeout(r, 2));

      const replaced = await service.replace(created.id, { title: "Replaced", content: "Replaced content" });

      expect(replaced).not.toBeNull();
      expect(replaced!.id).toBe(created.id);
      expect(replaced!.title).toBe("Replaced");
      expect(replaced!.content).toBe("Replaced content");
      expect(replaced!.createdAt).toBeInstanceOf(Date);
      expect(replaced!.updatedAt).toBeInstanceOf(Date);
      expect(replaced!.createdAt).toEqual(originalCreatedAt);
      expect(replaced!.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
    });

    it("should return null when trying to replace a non-existent post", async () => {
      const replaced = await service.replace("does-not-exist", { title: "X", content: "Y" });
      expect(replaced).toBeNull();
    });
  });

  describe("delete", () => {
    it("should remove a post and return true", async () => {
      const created = await service.create({ title: "T", content: "C" });
      const ok = await service.delete(created.id);
      expect(ok).toBe(true);
      const fetched = await service.getById(created.id);
      expect(fetched).toBeNull();
    });

    it("should return false when trying to delete a non-existent post", async () => {
      const ok = await service.delete("missing");
      expect(ok).toBe(false);
    });
  });
});


