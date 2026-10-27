import { FeatureBand } from "@/components/sample/FeatureBand";
import { Hero } from "@/components/sample/Hero";
import { SiteHeader } from "@/components/sample/SiteHeader";
import { Swatches } from "@/components/sample/Swatches";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <FeatureBand />
        <Swatches />
      </main>
    </>
  );
}
