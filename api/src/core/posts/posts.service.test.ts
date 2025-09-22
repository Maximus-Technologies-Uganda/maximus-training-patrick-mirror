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
    it("should return an empty array when there are no posts", async () => {
      const items = await service.list({ page: 1, pageSize: 10 });
      expect(items).toEqual([]);
    });

    it("should return a paginated list of posts correctly", async () => {
      for (let i = 1; i <= 5; i++) {
        await service.create({ title: `T${i}`, content: `C${i}` });
      }

      const page1 = await service.list({ page: 1, pageSize: 2 });
      expect(page1.map((p) => p.title)).toEqual(["T1", "T2"]);

      const page2 = await service.list({ page: 2, pageSize: 2 });
      expect(page2.map((p) => p.title)).toEqual(["T3", "T4"]);

      const page3 = await service.list({ page: 3, pageSize: 2 });
      expect(page3.map((p) => p.title)).toEqual(["T5"]);
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


