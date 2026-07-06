import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "../components/home-view";
import { guideDocs } from "../generated/guide-data";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <HomeView docs={guideDocs} />;
}
