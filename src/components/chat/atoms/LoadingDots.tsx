import { useEffect, useState } from "react";

const LoadingDots = () => {
  const [dots, setDots] = useState<string>('...');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="animate-pulse">{dots}</span>;
};

export default LoadingDots