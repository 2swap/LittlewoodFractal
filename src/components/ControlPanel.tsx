import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ControlPanelProps {
  mode: "complex" | "integer";
  onModeChange: (mode: "complex" | "integer") => void;
  degree: number;
  onDegreeChange: (value: number) => void;
  coefficientCount: number;
  onCoefficientCountChange: (value: number) => void;
  coefficientSum: number;
  onCoefficientSumChange: (value: number) => void;
  maxRoots: number;
  onMaxRootsChange: (value: number) => void;
}

export const ControlPanel = ({
  mode,
  onModeChange,
  degree,
  onDegreeChange,
  coefficientCount,
  onCoefficientCountChange,
  coefficientSum,
  onCoefficientSumChange,
  maxRoots,
  onMaxRootsChange,
}: ControlPanelProps) => {
  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as "complex" | "integer")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="complex">Complex</TabsTrigger>
          <TabsTrigger value="integer">Coefficient Sum</TabsTrigger>
        </TabsList>
        
        <TabsContent value="complex" className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label htmlFor="degree-slider" className="text-sm font-medium text-foreground">
              Polynomial Degree: {degree}
            </Label>
            <Slider
              id="degree-slider"
              min={2}
              max={10}
              step={1}
              value={[degree]}
              onValueChange={(value) => onDegreeChange(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="coefficient-slider" className="text-sm font-medium text-foreground">
              Number of Coefficients: {coefficientCount}
            </Label>
            <Slider
              id="coefficient-slider"
              min={2}
              max={10}
              step={1}
              value={[coefficientCount]}
              onValueChange={(value) => onCoefficientCountChange(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxroots-slider" className="text-sm font-medium text-foreground">
              Max Roots: {maxRoots.toLocaleString()}
            </Label>
            <Slider
              id="maxroots-slider"
              min={10000}
              max={500000}
              step={10000}
              value={[maxRoots]}
              onValueChange={(value) => onMaxRootsChange(value[0])}
              className="w-full"
            />
          </div>
        </TabsContent>

        <TabsContent value="integer" className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label htmlFor="degree-slider-int" className="text-sm font-medium text-foreground">
              Polynomial Degree: {degree}
            </Label>
            <Slider
              id="degree-slider-int"
              min={2}
              max={10}
              step={1}
              value={[degree]}
              onValueChange={(value) => onDegreeChange(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="coefficient-sum-slider" className="text-sm font-medium text-foreground">
              Max Coefficient Sum: {coefficientSum}
            </Label>
            <Slider
              id="coefficient-sum-slider"
              min={2}
              max={20}
              step={1}
              value={[coefficientSum]}
              onValueChange={(value) => onCoefficientSumChange(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxroots-slider-int" className="text-sm font-medium text-foreground">
              Max Roots: {maxRoots.toLocaleString()}
            </Label>
            <Slider
              id="maxroots-slider-int"
              min={10000}
              max={500000}
              step={10000}
              value={[maxRoots]}
              onValueChange={(value) => onMaxRootsChange(value[0])}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
