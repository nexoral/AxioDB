import HttpRouter from "../../../Helper/http/HttpRouter.helper";
import AuthController from "../../controller/Auth/Auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export default async function authRouter(router: HttpRouter): Promise<void> {
  router.post("/login", async (request, reply) => new AuthController().login(request, reply));

  router.post(
    "/logout",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().logout(request, reply),
  );

  router.get(
    "/me",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().me(request, reply),
  );

  router.patch(
    "/change-password",
    { preHandler: [requireAuth] },
    async (request, reply) => new AuthController().changePassword(request, reply),
  );
}
