'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Badge } from '@/lib/components/ui/badge';
import { ScrollArea } from '@/lib/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/lib/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search, Filter, X } from 'lucide-react';
import storeCategories from '@/lib/data/store_categories.json';

/* ---------- ① JSON → 3단 트리 ---------- */
type Raw = {
  상권업종대분류명: string;
  상권업종중분류명: string;
  상권업종소분류명: string;
};
type Tree = Record<string, Record<string, string[]>>;

function makeTree(rows: Raw[]): Tree {
  const tree: Tree = {};
  rows.forEach(r => {
    const {
      상권업종대분류명: major,
      상권업종중분류명: mid,
      상권업종소분류명: sub,
    } = r;
    tree[major] ??= {};
    tree[major][mid] ??= [];
    tree[major][mid].push(sub);
  });
  return tree;
}

const businessCategories = makeTree(storeCategories as Raw[]);

/* ---------- ② 필터 컴포넌트 ---------- */
interface StoreFilterProps {
  selectedCategories: string[];
  onFilterChange: (categories: string[]) => void;
}

export function StoreFilter({ selectedCategories, onFilterChange }: StoreFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMajor, setExpandedMajor] = useState<string[]>([]);
  const [expandedMinor, setExpandedMinor] = useState<string[]>([]);

  const toggle = (list: string[], v: string, setter: (s: string[]) => void) =>
      setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  /* ---------- ③ 검색 필터 ---------- */
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.entries(businessCategories).filter(
        ([major, minors]) =>
            major.toLowerCase().includes(term) ||
            Object.entries(minors).some(
                ([minor, subs]) =>
                    minor.toLowerCase().includes(term) ||
                    subs.some(sub => sub.toLowerCase().includes(term)),
            ),
    );
  }, [searchTerm]);

  /* ---------- ④ UI ---------- */
  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> 업종별 필터
          </span>
            {selectedCategories.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange([])}
                >
                  <X className="w-4 h-4" />
                </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                placeholder={`업종 검색... (총 ${storeCategories.length}개)`}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                }
                className="pl-10"
            />
          </div>

          {/* 선택 배지 */}
          {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  선택된 업종 ({selectedCategories.length}개)
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.map(cat => (
                      <Badge
                          key={cat}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                              onFilterChange(selectedCategories.filter(c => c !== cat))
                          }
                      >
                        {cat} <X className="w-3 h-3 ml-1" />
                      </Badge>
                  ))}
                </div>
              </div>
          )}

          {/* 카테고리 트리 */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filtered.map(([major, minors]) => (
                  <Collapsible
                      key={major}
                      open={expandedMajor.includes(major)}
                      onOpenChange={() =>
                          toggle(expandedMajor, major, setExpandedMajor)
                      }
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-2">
                        {expandedMajor.includes(major) ? (
                            <ChevronDown className="w-4 h-4 mr-2" />
                        ) : (
                            <ChevronRight className="w-4 h-4 mr-2" />
                        )}
                        {major}
                        <Badge variant="outline" className="ml-auto">
                          {Object.values(minors).flat().length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="ml-6 space-y-1">
                      {Object.entries(minors).map(([minor, subs]) => (
                          <Collapsible
                              key={minor}
                              open={expandedMinor.includes(minor)}
                              onOpenChange={() =>
                                  toggle(expandedMinor, minor, setExpandedMinor)
                              }
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                  variant="ghost"
                                  className="w-full justify-start p-2 text-sm"
                              >
                                {expandedMinor.includes(minor) ? (
                                    <ChevronDown className="w-3 h-3 mr-2" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 mr-2" />
                                )}
                                {minor}
                                <Badge variant="outline" className="ml-auto">
                                  {subs.length}
                                </Badge>
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="ml-6 space-y-1">
                              {subs.map(sub => (
                                  <Button
                                      key={sub}
                                      variant={
                                        selectedCategories.includes(sub)
                                            ? 'secondary'
                                            : 'ghost'
                                      }
                                      className="w-full justify-start p-2 text-sm"
                                      onClick={() =>
                                          onFilterChange(
                                              selectedCategories.includes(sub)
                                                  ? selectedCategories.filter(c => c !== sub)
                                                  : [...selectedCategories, sub],
                                          )
                                      }
                                  >
                                    {sub}
                                  </Button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
