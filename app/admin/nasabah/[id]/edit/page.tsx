import type { Metadata } from "next";
import { NasabahFormView } from "@/components/nasabah-form-view";

export const metadata: Metadata = {
  title: "Edit Nasabah — BSI Haji Admin",
};

export default async function NasabahEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NasabahFormView mode="edit" id={id} />;
}
