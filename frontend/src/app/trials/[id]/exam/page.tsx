'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileCheck,
  Send,
  HelpCircle,
  Laptop,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '@/lib/api';
import { Question, Attempt, Answer, Option } from '@/types';
import { formatTime, getDifficultyBadge, getQuestionTypeLabel } from '@/lib/utils';

export default function TrialExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersState, setAnswersState] = useState<Record<number, {
    option_ids: number[];
    text_answer: string;
    uploaded_filename?: string;
  }>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Timer & file input refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Start or resume attempt on mount
  useEffect(() => {
    const initExam = async () => {
      try {
        const res = await api.post(`/attempts/start/${id}/`);
        const { attempt: attData, questions: qList, is_completed } = res.data;

        if (is_completed) {
          showToast('Cette épreuve a déjà été finalisée.', 'info');
          router.push(`/trials/${id}`);
          return;
        }

        setAttempt(attData);
        setQuestions(qList);
        setRemainingSeconds(attData.remaining_seconds || 0);

        // Pre-fill existing answers state
        const initialAnswers: Record<number, any> = {};
        attData.answers?.forEach((ans: Answer) => {
          if (ans.question_id) {
            initialAnswers[ans.question_id] = {
              option_ids: ans.selected_option_ids || [],
              text_answer: ans.text_answer || '',
              uploaded_filename: ans.original_filename || '',
            };
          }
        });
        setAnswersState(initialAnswers);
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Erreur lors du chargement de l\'épreuve.', 'error');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initExam();
  }, [id, router, showToast]);

  // 2. Synchronized Countdown Timer
  useEffect(() => {
    if (remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds]);

  const handleTimeExpired = async () => {
    showToast('Temps écoulé ! Votre épreuve est enregistrée automatiquement.', 'warning');
    if (attempt) {
      try {
        await api.post(`/attempts/submit/${attempt.id}/`, {
          time_spent_seconds: (attempt.trial_order * 60)
        });
        router.push(`/trials/${id}`);
      } catch (e) {
        router.push('/dashboard');
      }
    }
  };

  // 3. Save single question answer
  const saveCurrentAnswer = async (qId: number, options: number[], text: string) => {
    if (!attempt) return;
    setIsSaving(true);
    try {
      await api.post(`/attempts/save/${attempt.id}/`, {
        question_id: qId,
        option_ids: options,
        text_answer: text,
      });
    } catch (err: any) {
      if (err.response?.data?.expired) {
        handleTimeExpired();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptionToggle = (question: Question, optionId: number) => {
    const currentAnswer = answersState[question.id] || { option_ids: [], text_answer: '' };
    let updatedOptions: number[] = [];

    if (question.question_type === 'SINGLE_CHOICE' || question.question_type === 'TRUE_FALSE') {
      updatedOptions = [optionId];
    } else if (question.question_type === 'MULTIPLE_CHOICE') {
      const exists = currentAnswer.option_ids.includes(optionId);
      if (exists) {
        updatedOptions = currentAnswer.option_ids.filter((id) => id !== optionId);
      } else {
        updatedOptions = [...currentAnswer.option_ids, optionId];
      }
    }

    const updated = { ...currentAnswer, option_ids: updatedOptions };
    setAnswersState((prev) => ({ ...prev, [question.id]: updated }));
    saveCurrentAnswer(question.id, updatedOptions, currentAnswer.text_answer);
  };

  const handleTextChange = (questionId: number, text: string) => {
    const currentAnswer = answersState[questionId] || { option_ids: [], text_answer: '' };
    const updated = { ...currentAnswer, text_answer: text };
    setAnswersState((prev) => ({ ...prev, [questionId]: updated }));
  };

  const handleTextBlur = (questionId: number) => {
    const ans = answersState[questionId];
    if (ans) {
      saveCurrentAnswer(questionId, ans.option_ids, ans.text_answer);
    }
  };

  const handleFileUpload = async (questionId: number, file: File, allowedExtensions?: string) => {
    if (!attempt) return;

    // 1. Client-side file size check (Max 50 Mo)
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast('Le fichier est trop volumineux. La taille maximale autorisée est de 50 Mo.', 'error');
      return;
    }

    // 2. Client-side extension check
    if (allowedExtensions) {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const allowedList = allowedExtensions
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowedList.length > 0 && !allowedList.includes(ext)) {
        showToast(
          `Format '${ext}' non autorisé. Formats acceptés : ${allowedList.join(', ')}`,
          'error'
        );
        return;
      }
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/attempts/upload/${attempt.id}/${questionId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnswersState((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          uploaded_filename: res.data.filename,
        },
      }));
      showToast(`Fichier "${res.data.filename}" téléversé avec succès !`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors du dépôt du fichier.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      await api.post(`/attempts/submit/${attempt.id}/`);
      showToast('Épreuve soumise avec succès !', 'success');
      router.push(`/trials/${id}`);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de la soumission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !attempt) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answersState[currentQuestion.id] : undefined;

  // Stats on questions answered
  const answeredCount = questions.filter((q) => {
    const a = answersState[q.id];
    if (!a) return false;
    if (q.question_type === 'PRACTICAL') return Boolean(a.uploaded_filename);
    if (q.question_type === 'SHORT_TEXT' || q.question_type === 'NUMERIC') return Boolean(a.text_answer?.trim());
    return a.option_ids && a.option_ids.length > 0;
  }).length;

  const isTimerCritical = remainingSeconds > 0 && remainingSeconds < 180; // Less than 3 minutes

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 select-none">
      {/* Exam Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-court.png" alt="TeCoX" className="h-8 w-auto brightness-125" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                {attempt.trial_title}
              </h1>
              <p className="text-[11px] text-slate-400">
                Épreuve #{attempt.trial_order} • {questions.length} questions
              </p>
            </div>
          </div>

          {/* Countdown Timer & Save indicator */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              {isSaving ? (
                <>
                  <Spinner size="sm" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Réponses enregistrées</span>
                </>
              )}
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold tracking-wider ${
                isTimerCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                  : 'bg-slate-800 text-cyan-300 border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowConfirmModal(true)}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Terminer
            </Button>
          </div>
        </div>
      </header>

      {/* Main Examination Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Question List Navigator */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Progression de l'épreuve</span>
              <span className="font-mono">
                {answeredCount} / {questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const a = answersState[q.id];
                const isAnswered =
                  q.question_type === 'PRACTICAL'
                    ? Boolean(a?.uploaded_filename)
                    : q.question_type === 'SHORT_TEXT' || q.question_type === 'NUMERIC'
                    ? Boolean(a?.text_answer?.trim())
                    : a?.option_ids && a.option_ids.length > 0;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center border ${
                      isCurrent
                        ? 'bg-[#082F6A] text-white border-[#082F6A] ring-2 ring-blue-300 dark:ring-cyan-500'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                <span>Répondu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#082F6A] border border-[#082F6A]" />
                <span>Question active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-white border border-slate-300" />
                <span>Non répondu</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Active Question Workspace */}
        <div className="lg:col-span-9 space-y-6">
          {currentQuestion && (
            <Card className="shadow-md">
              {/* Question Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-[#082F6A] text-white font-mono font-bold text-xs">
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {getQuestionTypeLabel(currentQuestion.question_type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    {currentQuestion.points} points
                  </Badge>
                  {getDifficultyBadge(currentQuestion.difficulty).label && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${getDifficultyBadge(currentQuestion.difficulty).className}`}>
                      {getDifficultyBadge(currentQuestion.difficulty).label}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Prompt */}
                <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                  {currentQuestion.prompt}
                </div>

                {/* Optional Illustration Image */}
                {currentQuestion.image && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-w-lg">
                    <img src={currentQuestion.image} alt="Illustration" className="w-full h-auto object-cover" />
                  </div>
                )}

                {/* Input Fields by Question Type */}

                {/* 1. MCQ Single Choice & True/False */}
                {(currentQuestion.question_type === 'SINGLE_CHOICE' || currentQuestion.question_type === 'TRUE_FALSE') && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = currentAnswer?.option_ids?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleOptionToggle(currentQuestion, opt.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 border-[#082F6A] dark:border-cyan-500 ring-1 ring-[#082F6A]'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#082F6A] bg-[#082F6A] dark:border-cyan-400 dark:bg-cyan-400'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. MCQ Multiple Choice */}
                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-slate-500 italic">
                      Plusieurs réponses sont possibles. Cochez toutes les cases applicables.
                    </p>
                    {currentQuestion.options.map((opt) => {
                      const isSelected = currentAnswer?.option_ids?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleOptionToggle(currentQuestion, opt.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/60 border-[#082F6A] dark:border-cyan-500 ring-1 ring-[#082F6A]'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[#082F6A] bg-[#082F6A] text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-900'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Short Text or Numeric Answer */}
                {(currentQuestion.question_type === 'SHORT_TEXT' || currentQuestion.question_type === 'NUMERIC') && (
                  <div className="space-y-3 pt-2 max-w-md">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Votre réponse :
                    </label>
                    <input
                      type={currentQuestion.question_type === 'NUMERIC' ? 'text' : 'text'}
                      className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#082F6A] focus:border-[#082F6A]"
                      placeholder={currentQuestion.question_type === 'NUMERIC' ? 'Ex: 1024' : 'Tapez votre réponse ici...'}
                      value={currentAnswer?.text_answer || ''}
                      onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                      onBlur={() => handleTextBlur(currentQuestion.id)}
                    />
                  </div>
                )}

                {/* 4. Practical Task with File Download & Upload */}
                {currentQuestion.question_type === 'PRACTICAL' && (
                  <div className="space-y-5 pt-2">
                    {/* Practical Instructions */}
                    {currentQuestion.practical_instructions && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-cyan-600" />
                          Consignes de réalisation :
                        </h4>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80">
                          {currentQuestion.practical_instructions}
                        </div>
                      </div>
                    )}

                    {/* Downloadable resource attachment if provided */}
                    {currentQuestion.attachment && (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-[#082F6A] dark:text-cyan-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Ressource de travail à télécharger
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {currentQuestion.attachment_name || 'Modele_TDC_Ressource'}
                            </p>
                          </div>
                        </div>
                        <a href={currentQuestion.attachment} download target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            Télécharger la ressource
                          </Button>
                        </a>
                      </div>
                    )}

                    {/* Dropzone / Upload Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleFileUpload(currentQuestion.id, file, currentQuestion.practical_allowed_extensions);
                        }
                      }}
                      className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-4 transition-all ${
                        isDragging
                          ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30 scale-[1.01]'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={currentQuestion.practical_allowed_extensions}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(currentQuestion.id, file, currentQuestion.practical_allowed_extensions);
                          }
                          e.target.value = ''; // Reset input to allow re-uploading same filename
                        }}
                      />

                      {currentAnswer?.uploaded_filename ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <FileCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Fichier déposé : <span className="text-cyan-600 dark:text-cyan-400 font-mono">{currentAnswer.uploaded_filename}</span>
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              ✓ Fichier sauvegardé et prêt pour la correction du jury
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            isLoading={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            leftIcon={<Upload className="w-4 h-4" />}
                          >
                            Remplacer le fichier
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                              isDragging ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              Déposez votre fichier de mission ici
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Formats autorisés : <span className="font-mono text-slate-700 dark:text-slate-300">{currentQuestion.practical_allowed_extensions}</span> (Max 50 Mo)
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              Glissez-déposez votre fichier directement ici ou cliquez sur le bouton ci-dessous
                            </p>
                          </div>
                          <Button
                            size="md"
                            variant="primary"
                            type="button"
                            isLoading={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            leftIcon={<Upload className="w-4 h-4" />}
                          >
                            Sélectionner un fichier
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Navigation Footer */}
              <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Précédent
                </Button>

                {currentIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => setShowConfirmModal(true)}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Vérifier & Soumettre
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Soumettre l'épreuve définitivement ?"
        description="Une fois soumise, vous ne pourrez plus modifier vos réponses pour cette épreuve."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Questions répondues :</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Temps restant :</span>
              <span className="font-bold font-mono text-[#082F6A] dark:text-cyan-400">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>

          {answeredCount < questions.length && (
            <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Attention : vous n'avez pas répondu à toutes les questions ({questions.length - answeredCount} question(s) restante(s)).
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmModal(false)}>
              Reprendre l'épreuve
            </Button>
            <Button
              variant="success"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSubmitAttempt}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Confirmer la soumission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
