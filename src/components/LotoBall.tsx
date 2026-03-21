interface LotoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  isBonus?: boolean;
  isPrediction?: boolean;
  delay?: number;
  maxNumber?: number;
}

function getBallColor(num: number, maxNumber = 43): string {
  const band = Math.ceil(maxNumber / 5);
  if (num <= band) return 'bg-red-500';
  if (num <= band * 2) return 'bg-blue-500';
  if (num <= band * 3) return 'bg-emerald-500';
  if (num <= band * 4) return 'bg-orange-500';
  return 'bg-purple-500';
}

const sizes = {
  sm: 'w-7 h-7 text-[10px] sm:w-8 sm:h-8 sm:text-xs',
  md: 'w-9 h-9 text-xs sm:w-11 sm:h-11 sm:text-sm',
  lg: 'w-10 h-10 text-sm sm:w-14 sm:h-14 sm:text-lg font-bold',
};

export default function LotoBall({ number, size = 'md', isBonus, isPrediction, delay = 0, maxNumber }: LotoBallProps) {
  const sizeClass = sizes[size];
  const colorClass = getBallColor(number, maxNumber);

  if (isBonus) {
    return (
      <span
        className={`${sizeClass} inline-flex items-center justify-center rounded-full border-2 border-amber-400 text-amber-400 font-semibold ball-animate shrink-0`}
        style={{ animationDelay: `${delay}ms` }}
      >
        {number}
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} ${colorClass} ${isPrediction ? 'prediction-ball' : ''} inline-flex items-center justify-center rounded-full text-white font-semibold shadow-lg ball-animate shrink-0`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {number}
    </span>
  );
}
