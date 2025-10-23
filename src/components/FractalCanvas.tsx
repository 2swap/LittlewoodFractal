import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface Complex {
  re: number;
  im: number;
}

interface FractalCanvasProps {
  degree: number;
  coefficients: Complex[];
  onCoefficientsChange: (coefficients: Complex[]) => void;
  onRenderComplete?: () => void;
  maxRoots: number;
  maxIterations: number;
  onConvergenceStats?: (stats: ConvergenceStats) => void;
  mode: "complex" | "integer";
  coefficientSum?: number;
}

interface ConvergenceStats {
  totalRoots: number;
  convergedRoots: number;
  convergenceRate: number;
  avgIterations: number;
}

export const FractalCanvas = ({ degree, coefficients, onCoefficientsChange, onRenderComplete, maxRoots, maxIterations, onConvergenceStats, mode, coefficientSum = 3 }: FractalCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [rootCount, setRootCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 });
  const [isMobile, setIsMobile] = useState(false);

  // Fixed viewport for consistent scaling
  const VIEWPORT_SIZE = 6; // Shows from -3 to 3 on both axes

  // Update canvas size to fill screen
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const dpr = window.devicePixelRatio || 1;
        setCanvasSize({
          width: window.innerWidth * dpr,
          height: window.innerHeight * dpr
        });
        // Detect mobile based on screen size
        setIsMobile(window.innerWidth < 768);
      }
    };

    // Initial update with small delay to ensure container is rendered
    setTimeout(updateCanvasSize, 0);
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    // Predict root count
    let estimatedRoots;
    if (mode === "integer") {
      // Calculate number of partitions (approximation for large numbers)
      const numPartitions = calculatePartitionCount(coefficientSum, degree);
      estimatedRoots = numPartitions * degree;
    } else {
      const numPolynomials = Math.pow(coefficients.length, degree);
      estimatedRoots = numPolynomials * degree;
    }
    
    if (estimatedRoots > maxRoots) {
      setErrorMessage(`Too many roots to render: ${estimatedRoots.toLocaleString()}. Maximum is ${maxRoots.toLocaleString()}. Please reduce degree or coefficient ${mode === "integer" ? "sum" : "count"}.`);
      setIsRendering(false); // Fix infinite loop bug
      return;
    }
    
    setErrorMessage(null);
    renderFractal();
  }, [degree, coefficients, maxRoots, maxIterations, canvasSize, mode, coefficientSum]);

  const calculatePartitionCount = (sum: number, parts: number): number => {
    // Simple approximation - actual calculation is done in generateIntegerPartitions
    const partitions = generateIntegerPartitions(sum, parts);
    return partitions.length;
  };

  const generateIntegerPartitions = (maxSum: number, parts: number): number[][] => {
    const result: number[][] = [];
    
    const partition = (remaining: number, numParts: number, min: number, current: number[]) => {
      if (numParts === 0) {
        if (remaining >= 0) {
          result.push([...current]);
        }
        return;
      }
      
      if (numParts === 1) {
        if (remaining >= min) {
          result.push([...current, remaining]);
        }
        return;
      }
      
      for (let i = min; i <= remaining; i++) {
        current.push(i);
        partition(remaining - i, numParts - 1, 0, current);
        current.pop();
      }
    };
    
    // Generate all partitions with sum <= maxSum
    for (let targetSum = 0; targetSum <= maxSum; targetSum++) {
      partition(targetSum, parts, 0, []);
    }
    
    return result;
  };

  const generateSignCombinations = (partition: number[]): number[][] => {
    const result: number[][] = [];
    const n = partition.length;
    const totalCombinations = Math.pow(2, n);
    
    for (let i = 0; i < totalCombinations; i++) {
      const combination: number[] = [];
      for (let j = 0; j < n; j++) {
        const sign = (i >> j) & 1 ? -1 : 1;
        combination.push(partition[j] * sign);
      }
      result.push(combination);
    }
    
    return result;
  };

  const generatePolynomials = (degree: number, coeffs: Complex[]) => {
    if (mode === "integer") {
      const partitions = generateIntegerPartitions(coefficientSum, degree);
      const allPolynomials: Complex[][] = [];
      
      for (const partition of partitions) {
        const signCombinations = generateSignCombinations(partition);
        for (const combination of signCombinations) {
          allPolynomials.push(combination.map(n => ({ re: n, im: 0 } as Complex)));
        }
      }
      
      return allPolynomials;
    } else {
      const numPolynomials = Math.pow(coeffs.length, degree);
      const polynomials: Complex[][] = [];

      for (let i = 0; i < numPolynomials; i++) {
        const poly: Complex[] = [];
        let temp = i;
        for (let j = 0; j < degree; j++) {
          poly.push(coeffs[temp % coeffs.length]);
          temp = Math.floor(temp / coeffs.length);
        }
        polynomials.push(poly);
      }

      return polynomials;
    }
  };

  const evaluatePolynomial = (coeffs: Complex[], z: Complex): Complex => {
    let result = { re: 0, im: 0 };
    let power = { re: 1, im: 0 };

    for (let i = 0; i < coeffs.length; i++) {
      // result += coeffs[i] * power
      const term = complexMultiply(coeffs[i], power);
      result = complexAdd(result, term);

      // power *= z
      power = complexMultiply(power, z);
    }

    return result;
  };

  const complexAdd = (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im,
  });

  const complexSubtract = (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im,
  });

  const complexMultiply = (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  });

  const complexDivide = (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
    };
  };

  const complexAbs = (z: Complex): number => Math.sqrt(z.re * z.re + z.im * z.im);

  const evaluateDerivative = (coeffs: Complex[], z: Complex): Complex => {
    let result = { re: 0, im: 0 };
    let power = { re: 1, im: 0 };

    for (let i = 1; i < coeffs.length; i++) {
      const coeff = complexMultiply(coeffs[i], { re: i, im: 0 });
      const term = complexMultiply(coeff, power);
      result = complexAdd(result, term);
      power = complexMultiply(power, z);
    }

    return result;
  };

  const findRootsDurandKerner = (coeffs: Complex[], maxIter: number): { roots: Complex[], converged: boolean, iterations: number } => {
    const degree = coeffs.length - 1;
    if (degree <= 0) return { roots: [], converged: true, iterations: 0 };

    // Make monic: divide all coefficients by leading coefficient
    const leading = coeffs[degree];
    const leadingAbs = complexAbs(leading);
    if (leadingAbs === 0) {
      return { roots: Array(degree).fill({ re: 0, im: 0 }), converged: true, iterations: 0 };
    }
    
    const monicCoeffs = coeffs.map(c => complexDivide(c, leading));

    // Compute adaptive radius: 1 + max|a_i| for i=0..degree-1
    let maxCoeffAbs = 0;
    for (let i = 0; i < degree; i++) {
      const abs = complexAbs(monicCoeffs[i]);
      if (abs > maxCoeffAbs) maxCoeffAbs = abs;
    }
    const radius = 1.0 + maxCoeffAbs;

    // Initialize roots on a circle with adaptive radius
    const roots: Complex[] = [];
    for (let i = 0; i < degree; i++) {
      const angle = (2 * Math.PI * i) / degree;
      roots.push({
        re: radius * Math.cos(angle),
        im: radius * Math.sin(angle),
      });
    }

    // Durand-Kerner iterations
    let finalIter = 0;
    let converged = false;
    const tolerance = 1e-6;
    
    for (let iter = 0; iter < maxIter; iter++) {
      let maxChange = 0;

      for (let i = 0; i < degree; i++) {
        const xi = roots[i];
        
        // Evaluate polynomial using Horner's method
        let p = monicCoeffs[degree];
        for (let k = degree - 1; k >= 0; k--) {
          p = complexAdd(complexMultiply(p, xi), monicCoeffs[k]);
        }

        // Compute denominator: product of (xi - xj) for all j != i
        let denom: Complex = { re: 1, im: 0 };
        for (let j = 0; j < degree; j++) {
          if (j === i) continue;
          let diff = complexSubtract(xi, roots[j]);
          
          // Perturb slightly if roots are too close
          if (complexAbs(diff) < 1e-10) {
            diff = complexAdd(diff, { re: 1e-6, im: 1e-6 });
          }
          denom = complexMultiply(denom, diff);
        }

        // Skip if denominator is zero
        if (complexAbs(denom) < 1e-15) {
          continue;
        }

        const correction = complexDivide(p, denom);
        const newXi = complexSubtract(xi, correction);
        const change = complexAbs(complexSubtract(newXi, xi));
        
        if (change > maxChange) maxChange = change;
        roots[i] = newXi;
      }

      finalIter = iter + 1;

      // Check for convergence
      if (maxChange < tolerance) {
        converged = true;
        break;
      }
    }

    return { roots, converged, iterations: finalIter };
  };

  const renderFractal = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const allRoots: Complex[] = [];
    let totalConverged = 0;
    let totalPolynomials = 0;
    let totalIterations = 0;

    // Generate all polynomials and find their roots
    const polynomials = generatePolynomials(degree, coefficients);
    
    for (let i = 0; i < polynomials.length; i++) {
      const poly = polynomials[i];
      const result = findRootsDurandKerner([{ re: 1, im: 0 }, ...poly], maxIterations);
      
      // Only include converged roots
      if (result.converged) {
        allRoots.push(...result.roots);
        totalConverged++;
      }
      totalPolynomials++;
      totalIterations += result.iterations;
    }

    setRootCount(allRoots.length);
    
    // Report convergence stats
    if (onConvergenceStats) {
      onConvergenceStats({
        totalRoots: allRoots.length,
        convergedRoots: totalConverged,
        convergenceRate: totalPolynomials > 0 ? (totalConverged / totalPolynomials) * 100 : 0,
        avgIterations: totalPolynomials > 0 ? totalIterations / totalPolynomials : 0,
      });
    }

    // Fixed viewport with equal scaling
    const minRe = -VIEWPORT_SIZE / 2;
    const maxRe = VIEWPORT_SIZE / 2;
    const minIm = -VIEWPORT_SIZE / 2;
    const maxIm = VIEWPORT_SIZE / 2;

    // Equal scale for both axes
    const scale = Math.min(canvas.width / VIEWPORT_SIZE, canvas.height / VIEWPORT_SIZE);

    const toCanvasX = (re: number) => canvas.width / 2 + re * scale;
    const toCanvasY = (im: number) => canvas.height / 2 - im * scale;

    // Integer ticks only, extended range
    const tickSpacing = 1;
    const startRe = -10;
    const endRe = 10;
    const startIm = -10;
    const endIm = 10;

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), canvas.height);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(canvas.width, toCanvasY(0));
    ctx.stroke();

    // Draw tickmarks and labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // X-axis tickmarks
    for (let re = startRe; re <= endRe; re += tickSpacing) {
      if (Math.abs(re) < tickSpacing / 2) continue; // Skip zero
      const x = toCanvasX(re);
      const y0 = toCanvasY(0);
      if (x >= 0 && x <= canvas.width) {
        // Tick mark
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y0 - 5);
        ctx.lineTo(x, y0 + 5);
        ctx.stroke();
        
        // Label
        const label = re.toString();
        const labelY = y0 > canvas.height - 30 ? y0 - 20 : y0 + 15;
        ctx.fillText(label, x, labelY);
      }
    }

    // Y-axis tickmarks
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let im = startIm; im <= endIm; im += tickSpacing) {
      if (Math.abs(im) < tickSpacing / 2) continue; // Skip zero
      const y = toCanvasY(im);
      const x0 = toCanvasX(0);
      if (y >= 0 && y <= canvas.height) {
        // Tick mark
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 - 5, y);
        ctx.lineTo(x0 + 5, y);
        ctx.stroke();
        
        // Label
        const label = im.toString() + "i";
        const labelX = x0 > canvas.width - 50 ? x0 - 55 : x0 + 10;
        ctx.fillText(label, labelX, y);
      }
    }

    // Draw roots with gradient colors
    allRoots.forEach((root, index) => {
      const x = toCanvasX(root.re);
      const y = toCanvasY(root.im);

      const hue = (index / allRoots.length) * 360;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.2)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw coefficient dots as white rings (responsive sizing) - only in complex mode
    if (mode === "complex") {
      const baseRadius = isMobile ? Math.min(canvas.width, canvas.height) * 0.025 : 8;
      
      coefficients.forEach((coeff, index) => {
        const x = toCanvasX(coeff.re);
        const y = toCanvasY(coeff.im);

        // Highlight if hovered or dragged
        const isActive = index === hoveredIndex || index === draggedIndex;
        const radius = isActive ? baseRadius * 1.4 : baseRadius;
        const lineWidth = isActive ? 4 : 3;

        // Simple white ring - no glow
        ctx.strokeStyle = 'white';
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      });
    }

    setIsRendering(false);
    onRenderComplete?.();
  };

  const toComplexCoord = (canvasX: number, canvasY: number): Complex => {
    const canvas = canvasRef.current;
    if (!canvas) return { re: 0, im: 0 };
    
    const scale = Math.min(canvas.width / VIEWPORT_SIZE, canvas.height / VIEWPORT_SIZE);
    const re = (canvasX - canvas.width / 2) / scale;
    const im = -(canvasY - canvas.height / 2) / scale;
    return { re, im };
  };

  const getCoeffAtPoint = (canvasX: number, canvasY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const scale = Math.min(canvas.width / VIEWPORT_SIZE, canvas.height / VIEWPORT_SIZE);
    const hitRadius = isMobile ? Math.min(canvas.width, canvas.height) * 0.04 : 15;
    
    for (let i = 0; i < coefficients.length; i++) {
      const x = canvas.width / 2 + coefficients[i].re * scale;
      const y = canvas.height / 2 - coefficients[i].im * scale;
      const dist = Math.sqrt((canvasX - x) ** 2 + (canvasY - y) ** 2);
      if (dist < hitRadius) return i;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "complex") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const index = getCoeffAtPoint(x, y);
    if (index !== null) {
      setDraggedIndex(index);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "complex") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (draggedIndex !== null) {
      const newCoord = toComplexCoord(x, y);
      const newCoeffs = [...coefficients];
      newCoeffs[draggedIndex] = newCoord;
      onCoefficientsChange(newCoeffs);
    } else {
      const hoveredCoeff = getCoeffAtPoint(x, y);
      setHoveredIndex(hoveredCoeff);
    }
  };

  const handleMouseUp = () => {
    setDraggedIndex(null);
  };

  const handleMouseLeave = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== "complex") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    const index = getCoeffAtPoint(x, y);
    if (index !== null) {
      setDraggedIndex(index);
      e.preventDefault(); // Prevent scrolling
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== "complex") return;
    const canvas = canvasRef.current;
    if (!canvas || draggedIndex === null) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;

    const newCoord = toComplexCoord(x, y);
    const newCoeffs = [...coefficients];
    newCoeffs[draggedIndex] = newCoord;
    onCoefficientsChange(newCoeffs);
    e.preventDefault(); // Prevent scrolling
  };

  const handleTouchEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-gradient-canvas">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full cursor-pointer touch-none"
        style={{ imageRendering: 'crisp-edges' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Rendering fractal...</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">Cannot Render</h3>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
