import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedAmountProps {
  value: number; // 최종 목표 금액
  duration?: number; // 애니메이션 지속 시간 (초 단위)
  formatter?: (value: number) => string; // 포맷팅 함수 (formatAmount 등)
}

const AnimatedAmount: React.FC<AnimatedAmountProps> = ({
  value,
  duration = 1, // Framer Motion은 기본적으로 초(s) 단위를 사용합니다.
  formatter = (val) => val.toLocaleString(),
}) => {
  // 1. 숫자의 상태를 React State가 아닌 MotionValue로 관리 (리렌더링 방지)
  const motionValue = useMotionValue(0);

  // 2. 숫자가 변할 때마다 formatter를 거쳐 문자열로 변환
  const displayValue = useTransform(motionValue, (latest) =>
    formatter(Math.round(latest))
  );

  useEffect(() => {
    // 3. animate 함수를 통해 0에서 value까지 부드럽게 도달
    const controls = animate(motionValue, value, {
      duration: duration,
      ease: "easeOut", // 끝날 때 점점 느려지는 자연스러운 효과
    });

    // 컴포넌트 언마운트 시 애니메이션 정리
    return () => controls.stop();
  }, [value, duration, motionValue]);

  // motion.span이 displayValue의 변화를 감지하고 스스로 업데이트합니다.
  return <motion.span>{displayValue}</motion.span>;
};

export default AnimatedAmount;
