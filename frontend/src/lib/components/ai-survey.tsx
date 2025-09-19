'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Badge } from '@/lib/components/ui/badge';
import { Progress } from '@/lib/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/lib/components/ui/radio-group';
import { Label } from '@/lib/components/ui/label';
import { Textarea } from '@/lib/components/ui/textarea';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
// import { createClient } from "@/lib/supabase/client" // Removed supabase dependency
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'radio' | 'textarea';
  options?: string[];
}

interface SurveyResult {
  category: string;
  confidence: number;
  reasoning: string;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'experience',
    question: '창업 경험이 있으신가요?',
    type: 'radio',
    options: [
      '처음 창업을 준비합니다',
      '1-2회 창업 경험이 있습니다',
      '3회 이상 창업 경험이 있습니다',
    ],
  },
  {
    id: 'budget',
    question: '초기 투자 가능한 예산 규모는 어느 정도인가요?',
    type: 'radio',
    options: [
      '1천만원 미만',
      '1천만원 - 5천만원',
      '5천만원 - 1억원',
      '1억원 이상',
    ],
  },
  {
    id: 'industry_preference',
    question: '어떤 업종에 관심이 있으신가요?',
    type: 'radio',
    options: [
      '음식점/카페',
      '소매업/유통',
      '서비스업',
      'IT/기술',
      '제조업',
      '잘 모르겠습니다',
    ],
  },
  {
    id: 'work_style',
    question: '선호하는 업무 스타일은 무엇인가요?',
    type: 'radio',
    options: [
      '고객과 직접 소통하는 일',
      '혼자 집중해서 하는 일',
      '팀과 협업하는 일',
      '창의적인 일',
    ],
  },
  {
    id: 'location',
    question: '사업을 시작하고 싶은 지역은 어디인가요?',
    type: 'radio',
    options: [
      '강남/서초구',
      '홍대/마포구',
      '명동/중구',
      '강북/성북구',
      '기타 서울 지역',
      '서울 외 지역',
    ],
  },
  {
    id: 'goals',
    question: '창업을 통해 달성하고 싶은 목표를 자유롭게 적어주세요.',
    type: 'textarea',
  },
];

export function AiSurvey() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  // const supabase = createClient() // Removed supabase dependency

  const currentQuestion = surveyQuestions[currentStep];
  const progress = ((currentStep + 1) / surveyQuestions.length) * 100;

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      analyzeSurvey();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const analyzeSurvey = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('분석 중 오류가 발생했습니다');

      const analysisResults = await response.json();
      setResults(analysisResults.recommendations);

      // Save user interests to database
      if (user && analysisResults.recommendations.length > 0) {
        const interestsToSave = analysisResults.recommendations.map(
          (result: SurveyResult) => ({
            user_id: user.userId,
            business_category: result.category,
            interest_level: Math.ceil(result.confidence / 20), // Convert 0-100 to 1-5 scale
          }),
        );

        // await supabase.from("user_interests").upsert(interestsToSave, { // Mock save for now
        //   onConflict: "user_id,business_category",
        // })
        console.log('Mock save interests:', interestsToSave); // Placeholder for actual save
      }

      setIsCompleted(true);
    } catch (error) {
      console.error('Survey analysis error:', error);
      // Show mock results as fallback
      setResults([
        {
          category: '카페/음료',
          confidence: 85,
          reasoning:
            '고객 소통을 선호하고 서비스업에 관심이 있으며, 창의적인 업무를 좋아하는 성향이 카페 운영에 적합합니다.',
        },
        {
          category: '온라인 쇼핑몰',
          confidence: 72,
          reasoning:
            '혼자 집중해서 하는 일을 선호하고 IT 분야에 관심이 있어 온라인 비즈니스에 적합한 성향을 보입니다.',
        },
        {
          category: '미용/뷰티',
          confidence: 68,
          reasoning:
            '고객과의 직접적인 소통을 중시하고 창의적인 일을 선호하는 특성이 미용업에 잘 맞습니다.',
        },
      ]);
      setIsCompleted(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetSurvey = () => {
    setCurrentStep(0);
    setAnswers({});
    setResults([]);
    setIsCompleted(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            AI 분석 완료
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              당신의 답변을 바탕으로 AI가 추천하는 창업 분야입니다.
            </p>

            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.category}</h4>
                  <Badge
                    className={`${getConfidenceColor(
                      result.confidence,
                    )} text-white`}
                  >
                    {result.confidence}% 적합
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.reasoning}
                </p>
              </div>
            ))}

            <div className="flex gap-2 mt-6">
              <Button
                onClick={resetSurvey}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                다시 설문하기
              </Button>
              <Button className="flex-1">
                <Lightbulb className="w-4 h-4 mr-2" />
                추천 지역 보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            AI 분석 중...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              당신의 답변을 분석하여 최적의 창업 분야를 찾고 있습니다...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI 창업 적성 분석
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              질문 {currentStep + 1} / {surveyQuestions.length}
            </span>
            <span>{Math.round(progress)}% 완료</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {currentQuestion.question}
            </h3>

            {currentQuestion.type === 'radio' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={value => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${currentQuestion.id}-${index}`}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'textarea' && (
              <Textarea
                placeholder="자유롭게 작성해주세요..."
                value={answers[currentQuestion.id] || ''}
                onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                rows={4}
              />
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>

            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              {currentStep === surveyQuestions.length - 1 ? (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  분석하기
                </>
              ) : (
                <>
                  다음
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
