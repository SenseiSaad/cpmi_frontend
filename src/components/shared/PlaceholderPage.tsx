import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon size={32} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-black text-primary-500 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Feature in development
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
