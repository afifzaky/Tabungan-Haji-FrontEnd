import type { Metadata } from "next";
import { NasabahDetailView } from "@/components/nasabah-detail-view";

export const metadata: Metadata = {
  title: "Detail Nasabah — BSI Haji Admin",
};

export default async function NasabahDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NasabahDetailView id={id} />;
}
