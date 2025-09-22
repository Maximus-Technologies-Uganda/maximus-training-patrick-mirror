import { Router } from "express";
import { postsController } from "./posts.controller";
import { validate } from "../../middleware/validate.ts";
import { PostCreateSchema, PostUpdateSchema } from "../../../../src/core/posts/post.schemas";

const router = Router();

router.post("/", validate(PostCreateSchema), postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getById);
router.patch("/:id", validate(PostUpdateSchema), postsController.update);
router.delete("/:id", postsController.delete);

export default router;


