export async function GET(_request: Request): Promise<Response> {
  const body = JSON.stringify({ status: "ok" });
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}


