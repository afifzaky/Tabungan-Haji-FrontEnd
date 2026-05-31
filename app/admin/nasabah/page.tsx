import type { Metadata } from "next";
import { NasabahListView } from "@/components/nasabah-list-view";

export const metadata: Metadata = {
  title: "Manajemen Nasabah — BSI Haji Admin",
};

export default function NasabahPage() {
  return <NasabahListView />;
}
