import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";
import { ExportClient } from "./ExportClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const content = getIntlayer("export-page", locale);
  return { title: content.page.title.value };
}

export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const content = getIntlayer("export-page", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {content.page.heading.value}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {content.page.description.value}
        </p>
      </div>
      <ExportClient />
    </div>
  );
}
