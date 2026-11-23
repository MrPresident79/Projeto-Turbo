import turboWorker from "../../worker/index";

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  CODE_PEPPER?: string;
  ADMIN_API_TOKEN?: string;
  EMERGENCY_ACCESS_CODE?: string;
}

// Cloudflare Pages Functions adapter. Same secure backend, same origin and cookie
// as the React app. D1 binding must be configured under the name "DB".
export const onRequest: PagesFunction<Env> = async (context) => {
  return turboWorker.fetch(context.request, context.env);
};
