import { createFileRoute } from "@tanstack/react-router";
import { HomeLedger } from "@/components/home-ledger";

export const Route = createFileRoute("/")({
  component: HomeLedger,
});
