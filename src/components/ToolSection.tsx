import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import FileConverter from "@/components/FileConverter";

interface ToolSectionProps {
  tool: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    bgColor: string;
    type: string;
  };
  isOpen: boolean;
  onToggle: () => void;
}

export default function ToolSection({ tool, isOpen, onToggle }: ToolSectionProps) {
  return (
    <Card className="overflow-hidden" id={tool.id}>
      <div className="border-b border-slate-200 p-6">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={onToggle}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
              {tool.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{tool.title}</h3>
              <p className="text-slate-500">{tool.description}</p>
            </div>
          </div>
          <ChevronDown 
            className={`text-slate-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>
      {isOpen && (
        <CardContent className="p-6">
          <FileConverter type={tool.type} />
        </CardContent>
      )}
    </Card>
  );
}
