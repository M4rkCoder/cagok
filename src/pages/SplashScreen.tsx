import { motion } from "framer-motion";
import FinanceModeRounded from "@/components/FinanceModeRounded";

export default function SplashScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white">
      {/* 로고 애니메이션: 살짝 커지면서 나타남 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <FinanceModeRounded className="w-32 h-32 text-blue-500" />
      </motion.div>

      {/* 텍스트 애니메이션: 아래에서 위로 부드럽게 올라옴 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2, // 로고보다 약간 늦게 시작
          duration: 0.5,
          ease: "easeOut",
        }}
        className="tracking-widest text-center text-4xl font-black text-blue-500"
      >
        C'AGOK
      </motion.h1>

      {/* 하단 로딩 바 (선택 사항: 심플함을 더해줌) */}
      <motion.div
        className="w-16 h-1 bg-blue-100 rounded-full overflow-hidden mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="h-full bg-blue-500"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  );
}
