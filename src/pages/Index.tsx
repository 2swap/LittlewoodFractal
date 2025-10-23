import { useState } from "react";
import { FractalCanvas } from "@/components/FractalCanvas";
import { ControlPanel } from "@/components/ControlPanel";

interface Complex {
  re: number;
  im: number;
}

interface ConvergenceStats {
  totalRoots: number;
  convergedRoots: number;
  convergenceRate: number;
  avgIterations: number;
}

const Index = () => {
  const [mode, setMode] = useState<"complex" | "integer">("complex");
  const [degree, setDegree] = useState(6);
  const [maxRoots, setMaxRoots] = useState(10000);
  const maxIterations = 100; // Fixed value
  const [coefficients, setCoefficients] = useState<Complex[]>([
    { re: 1, im: 0 },
    { re: -1, im: 0 },
  ]);
  const [coefficientSum, setCoefficientSum] = useState(3);

  const handleCoefficientCountChange = (count: number) => {
    const newCoeffs = [...coefficients];
    if (count > coefficients.length) {
      // Add new coefficients
      for (let i = coefficients.length; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        newCoeffs.push({ re: Math.cos(angle), im: Math.sin(angle) });
      }
    } else {
      // Remove coefficients
      newCoeffs.length = count;
    }
    setCoefficients(newCoeffs);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Fullscreen Canvas */}
      <FractalCanvas
        degree={degree}
        coefficients={coefficients}
        onCoefficientsChange={setCoefficients}
        maxRoots={maxRoots}
        maxIterations={maxIterations}
        mode={mode}
        coefficientSum={coefficientSum}
      />
      
      {/* Overlaid Control Panel */}
      <aside className="absolute top-4 left-4 w-[350px] max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden p-6">
        <ControlPanel
          mode={mode}
          onModeChange={setMode}
          degree={degree}
          onDegreeChange={setDegree}
          coefficientCount={coefficients.length}
          onCoefficientCountChange={handleCoefficientCountChange}
          coefficientSum={coefficientSum}
          onCoefficientSumChange={setCoefficientSum}
          maxRoots={maxRoots}
          onMaxRootsChange={setMaxRoots}
        />
      </aside>
    </div>
  );
};

export default Index;
