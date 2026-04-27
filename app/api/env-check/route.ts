import { getSupabasePublicEnv } from "@/app/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const { check } = getSupabasePublicEnv();
  return Response.json(check);
}

