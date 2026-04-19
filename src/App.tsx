import { DisassemblyProvider } from "./components/disassembly/DisassemblyContext";
import HeroSection from "./components/disassembly/HeroSection";
import MappingSection from "./components/disassembly/MappingSection";

export default function App() {
  return (
    <DisassemblyProvider>
      <main class="relative min-h-screen overflow-hidden">
        <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <HeroSection />
          <MappingSection />
        </div>
      </main>
    </DisassemblyProvider>
  );
}
