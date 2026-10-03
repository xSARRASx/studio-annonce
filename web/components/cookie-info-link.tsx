import Link from "next/link";
import { Cookie } from "lucide-react";

export function CookieInfoLink() {
  return <Link className="sa-cookie-info-link" href="/cookies/">
    <Cookie size={15} aria-hidden="true" /> Cookies et stockage local
  </Link>;
}
