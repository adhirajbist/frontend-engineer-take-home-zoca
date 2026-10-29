import { redirect } from "next/navigation";

/** TEMPORARY: the landing page replaces this. */
export default function Home() {
  redirect("/campaign");
}
