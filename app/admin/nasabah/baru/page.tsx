import type { Metadata } from "next";
import { NasabahFormView } from "@/components/nasabah-form-view";

export const metadata: Metadata = {
  title: "Tambah Nasabah — BSI Haji Admin",
};

export default function NasabahBaruPage() {
  return <NasabahFormView mode="create" />;
}
