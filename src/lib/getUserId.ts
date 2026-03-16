import { auth } from "@/lib/auth";

export async function getUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user.id;
}
