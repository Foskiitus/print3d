import { getAuthUserId } from "@/lib/auth";

export async function getUserId(): Promise<string> {
  const userId = await getAuthUserId();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}
