import { redirect } from "next/navigation";

export default function TreasuryIndexPage() {
  redirect("/dashboard/pools");
}
