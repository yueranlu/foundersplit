import { redirect } from "next/navigation";

// /bills is retired now that home shows a running Splitwise-style balance.
// Keep the route as a permanent redirect so old links still work.
export default function BillsPage() {
  redirect("/");
}
