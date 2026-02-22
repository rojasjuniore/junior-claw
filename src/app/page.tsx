import { Header } from "@/components/layout/Header";
import { OfficeView } from "@/components/office/OfficeView";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Office" 
        subtitle="Your AI agent headquarters"
      />
      <div className="flex-1 p-6">
        <OfficeView />
      </div>
    </div>
  );
}
