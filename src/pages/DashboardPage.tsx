import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  return (
    <>
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
        Dashboard
      </h1>
      <Button
        variant="secondary"
        onClick={async () => {
          const seed = await import("@/db/seed");
        }}
      >
        더미 데이터 생성
      </Button>
    </>
  );
};

export default DashboardPage;
