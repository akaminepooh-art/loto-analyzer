interface LotoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  isBonus?: boolean;
  isPrediction?: boolean;
  delay?: number;
  maxNumber?: number;
}

function getBallGradient(num: number, maxNumber = 43): string {
  const band = Math.ceil(maxNumber / 5);
  if (num <= band) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)';
  if (num <= band * 2) return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)';
  if (num <= band * 3) return 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)';
  if (num <= band * 4) return 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)';
  return 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)';
}

const sizes = {
  sm: 'w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm',
  md: 'w-10 h-10 text-sm sm:w-12 sm:h-12 sm:text-base',
  lg: 'w-12 h-12 text-base sm:w-14 sm:h-14 sm:text-lg font-bold',
};

export default function LotoBall({ number, size = 'md', isBonus, isPrediction, delay = 0, maxNumber }: LotoBallProps) {
  const sizeClass = sizes[size];

  if (isBonus) {
    return (
      <span
        className={`${sizeClass} inline-flex items-center justify-center rounded-full font-semibold ball-animate shrink-0`}
        style={{
          animationDelay: `${delay}ms`,
          border: '2px solid #FFD700',
          color: '#FFD700',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.1)',
        }}
      >
        {number}
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} ${isPrediction ? 'prediction-ball' : ''} inline-flex items-center justify-center rounded-full text-white font-semibold ball-animate shrink-0`}
      style={{
        animationDelay: `${delay}ms`,
        background: getBallGradient(number, maxNumber),
        boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)`,
      }}
    >
      {number}
    </span>
  );
}
