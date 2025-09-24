import { Router } from "express";
import { postsController } from "./posts.controller";
import { validateBody, validateQuery } from "../../middleware/validate";
import { ListPostsQuerySchema, PostCreateSchema, PostUpdateSchema } from "./post.schemas";

const router = Router();

router.post("/", validateBody(PostCreateSchema), postsController.create);
router.get("/", validateQuery(ListPostsQuerySchema), postsController.list);
router.get("/:id", postsController.getById);
router.patch("/:id", validateBody(PostUpdateSchema), postsController.update);
router.delete("/:id", postsController.delete);

export default router;


