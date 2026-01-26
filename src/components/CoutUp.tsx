import React, { useEffect, useState } from "react";

interface CountUpProps {
  end: number; // 목표 숫자
  duration?: number; // 애니메이션 지속 시간 (ms)
  formatter?: (value: number) => string; // 천단위 콤마 등 포맷팅
}

const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1000,
  formatter = (val) => val.toLocaleString(),
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // EaseOutExpo 효과: 처음엔 빠르고 끝에 느려지는 효과
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);

      const currentValue = Math.floor(
        easeOutExpo * (end - startValue) + startValue
      );
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{formatter(count)}</span>;
};

export default CountUp;
