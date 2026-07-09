import type { Metadata } from "next";
import { GraveyardExperience } from "./GraveyardExperience";
import "./graveyard.css";

export const metadata: Metadata = {
  title: "The Graveyard — feel it before you sign in",
  description:
    "Descend through years of forgotten subscriptions, bury them one click each, and watch the money stop bleeding. A playable preview of Subscription Graveyard.",
};

export default function GraveyardPage() {
  return <GraveyardExperience />;
}
