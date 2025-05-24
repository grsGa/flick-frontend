'use client';

import * as React from 'react';
import { Check, AlertTriangle, Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// 内容警告类型
export type ContentWarningType = 'nudity' | 'violence' | 'sensitive' | null;

// 内容警告选项
const contentWarningTypes = [
  {
    value: 'nudity',
    label: '裸露',
    description: '含有裸露或性暗示内容'
  },
  {
    value: 'violence',
    label: '暴力',
    description: '含有暴力、流血或创伤性内容'
  },
  {
    value: 'sensitive',
    label: '敏感',
    description: '含有可能使部分用户感到不安的内容'
  }
];

// 组件属性
interface ContentWarningSelectorProps {
  value: ContentWarningType;
  onChange: (value: ContentWarningType) => void;
}

export function ContentWarningSelector({ value, onChange }: ContentWarningSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // 获取当前选中的内容警告类型标签
  const selectedType = contentWarningTypes.find(type => type.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="选择内容警告"
          className={cn("w-full justify-between", value && "text-blue-600 border-blue-600/20 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20")}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 opacity-70" />
              <span>{selectedType?.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 opacity-70" />
              <span>添加内容警告</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="start">
        <Command>
          <CommandInput placeholder="搜索内容警告类型..." />
          <CommandList>
            <CommandEmpty>未找到匹配的内容警告类型</CommandEmpty>
            <CommandGroup>
              {contentWarningTypes.map((type) => (
                <CommandItem
                  key={type.value}
                  value={type.value}
                  onSelect={() => {
                    onChange(type.value as ContentWarningType);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === type.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>无内容警告</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// 显示内容警告标签的组件
export function ContentWarningBadge({ type }: { type: ContentWarningType }) {
  if (!type) return null;
  
  const selectedType = contentWarningTypes.find(t => t.value === type);
  
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
      <AlertTriangle className="h-3 w-3 mr-1" />
      {selectedType?.label || '内容警告'}
    </Badge>
  );
} 