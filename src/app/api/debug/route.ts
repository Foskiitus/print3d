import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    console.log("[debug] userId from Clerk:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    console.log(
      "[debug] clerkUser:",
      clerkUser?.id,
      clerkUser?.emailAddresses[0]?.emailAddress,
    );

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    console.log("[debug] existing in DB:", existing);

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
          name:
            `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
            null,
          role: "user",
        },
      });
      console.log("[debug] created:", created);
      return NextResponse.json({ status: "created", user: created });
    }

    return NextResponse.json({ status: "already exists", user: existing });
  } catch (error: any) {
    console.error("[debug] error:", error);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 },
    );
  }
}
