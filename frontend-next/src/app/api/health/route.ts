import { ensureRequestContext, responseHeadersFromContext } from "../../../middleware/requestId";

export async function GET(request: Request): Promise<Response> {
  const context = ensureRequestContext(request.headers);
  const body = JSON.stringify({ status: "ok" });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...responseHeadersFromContext(context),
    },
  });
}


