import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GenerationAccess,
  GenerationCapabilities,
  GenerationResult,
  MediaMode,
  StudioSelection,
  VikasTemplate,
} from '@/types/vikas';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Film,
  History,
  Image as ImageIcon,
  ImagePlus,
  Info,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { Link, usePathname, useRouter } from '@/core/i18n/navigation';
import { ApiError, apiGet, apiGetBlob, apiPost } from '@/lib/api-client';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import {
  clearStudioDraft,
  restoreStudioDraft,
  saveStudioDraft,
} from '@/lib/studio-draft';
import { formatStudioPrice } from '@/lib/studio-payment';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { useStudioCheckout } from '@/hooks/use-studio-checkout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VikasArtwork } from '@/components/vikas/artwork';

import { StudioPaymentDialog } from './studio-payment-dialog';

import '@/styles/vikas-studio.css';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ASPECT_RATIOS = ['1:1', '3:4', '9:16', '16:9'] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

function isWorking(result?: GenerationResult | null) {
  return result?.status === 'pending' || result?.status === 'processing';
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('image_read_failed'));
    };
    reader.onerror = () => reject(new Error('image_read_failed'));
    reader.readAsDataURL(file);
  });
}

/** Product block: translates content and connects the studio to authenticated APIs. */
export function VikasStudio({
  templates,
  selection,
  onModeChange,
}: {
  templates: VikasTemplate[];
  selection: StudioSelection;
  onModeChange?: (mode: MediaMode) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Router location changes before the outgoing component unmounts. Keep the
  // draft attached to this studio, never to the sign-in page being entered.
  const draftScope = useRef(pathname).current;
  const { data: session, isPending: sessionPending } = useSession();
  const queryClient = useQueryClient();
  const initialTemplate = templates.find(
    (item) => item.id === selection.templateId
  );
  const [mode, setMode] = useState<MediaMode>(selection.mode);
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GenerationResult | null>(
    null
  );
  const [outputTab, setOutputTab] = useState<'preview' | 'history'>('preview');
  const [mediaError, setMediaError] = useState(false);
  const [preparingVideo, setPreparingVideo] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [checkoutReturn, setCheckoutReturn] = useState<
    'return' | 'cancel' | null
  >(null);
  const [awaitingPaymentUntil, setAwaitingPaymentUntil] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'error' | null>(
    null
  );
  const draftEdited = useRef(false);
  const draftOwner = useRef<string | null>(session?.user.id ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string | null>(null);
  const lastSelectionRef = useRef<number | null>(null);
  const activeUserRef = useRef<string | undefined>(session?.user.id);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paywallRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const restoredOutput = useRef(false);
  const submittedTaskId = useRef<string | null>(null);
  const trackedResult = useRef<string | null>(null);
  const modeSwitching = useRef(false);

  const capabilities = useQuery({
    queryKey: ['vikas-generation-config'],
    queryFn: () => apiGet<GenerationCapabilities>('/api/generations/config'),
    staleTime: 60_000,
    retry: 1,
  });
  const access = useQuery({
    queryKey: ['vikas-generation-access', session?.user.id],
    queryFn: () => apiGet<GenerationAccess>('/api/generations/access'),
    enabled: Boolean(session?.user),
    staleTime: 0,
    refetchInterval: (query) => {
      if (Date.now() >= awaitingPaymentUntil) return false;
      const short =
        mode === 'video'
          ? (query.state.data?.videoPaidCredits ?? 0) <
            (capabilities.data?.videoCredits ?? 796)
          : (query.state.data?.paidCredits ?? 0) <
            (capabilities.data?.imageCredits ?? 51);
      return short ? 2500 : false;
    },
    retry: 1,
  });
  const history = useQuery({
    queryKey: ['vikas-generation-history', session?.user.id],
    queryFn: () => apiGet<GenerationResult[]>('/api/generations'),
    enabled: Boolean(session?.user),
    staleTime: 10_000,
    retry: 1,
  });
  const generation = useMutation({
    mutationFn: (variables: {
      userId: string;
      requestId: string;
      mediaType: MediaMode;
      prompt: string;
      image?: string;
      aspectRatio: AspectRatio;
      usePaidCredits: boolean;
    }) => {
      const { userId: _userId, ...body } = variables;
      return apiPost<GenerationResult>('/api/generations', body);
    },
    retry: false,
    onSuccess: (result, variables) => {
      if (activeUserRef.current !== variables.userId) return;
      setSelectedTask(result);
      submittedTaskId.current = result.id;
      setOutputTab('preview');
      setMediaError(false);
      // An ambiguous submission must retain its key so a retry cannot spend twice.
      if (!isWorking(result) || !result.error) requestIdRef.current = null;
      void queryClient.invalidateQueries({
        queryKey: ['vikas-generation-history'],
      });
      void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      void queryClient.invalidateQueries({
        queryKey: ['vikas-generation-access'],
      });
    },
  });
  const task = useQuery({
    queryKey: ['vikas-generation', session?.user.id, selectedTask?.id],
    queryFn: () =>
      apiGet<GenerationResult>(`/api/generations/${selectedTask!.id}`),
    enabled: Boolean(
      session?.user &&
      selectedTask?.id &&
      isWorking(selectedTask) &&
      !selectedTask.error
    ),
    initialData: selectedTask ?? undefined,
    refetchInterval: (query) =>
      isWorking(query.state.data) && !query.state.data?.error ? 4_000 : false,
    refetchIntervalInBackground: false,
    retry: 1,
  });
  // A terminal history entry is newer than a potentially cached pending poll.
  const result = isWorking(selectedTask)
    ? (task.data ?? selectedTask)
    : selectedTask;
  const working = generation.isPending || isWorking(result);
  const selectedTemplate = templates.find((item) => item.id === templateId);
  const credits =
    mode === 'video'
      ? (capabilities.data?.videoCredits ?? 796)
      : (capabilities.data?.imageCredits ?? 51);
  const freeImage =
    mode === 'image' && access.data?.freeImageAvailable === true;
  const trialPaused = mode === 'image' && access.data?.trialPaused === true;
  const availableCredits =
    (mode === 'video'
      ? access.data?.videoPaidCredits
      : access.data?.paidCredits) ?? 0;
  const needsPayment = Boolean(
    session?.user && access.data && !freeImage && availableCredits < credits
  );
  const configured = capabilities.data?.configured === true;
  const resultUrl =
    result?.url && /^https?:\/\//i.test(result.url) ? result.url : undefined;
  const hasCompletedOutput = result?.status === 'success' && !!resultUrl;
  const statusLabels: Record<GenerationResult['status'], string> = {
    pending: m['vikas.studio.status_pending'](),
    processing: m['vikas.studio.status_processing'](),
    success: m['vikas.studio.status_success'](),
    failed: m['vikas.studio.status_failed'](),
    canceled: m['vikas.studio.status_canceled'](),
  };

  function edited() {
    draftEdited.current = true;
    requestIdRef.current = null;
    setError('');
    setCopied(false);
  }

  function errorMessage(cause: unknown) {
    const message = cause instanceof Error ? cause.message : '';
    if (/Free image availability changed/i.test(message))
      return m['vikas.studio.trial_changed']();
    if (/insufficient credits|not enough credits/i.test(message))
      return m['vikas.studio.credits_error']();
    if (/unauthorized|sign in|authentication/i.test(message))
      return m['vikas.studio.sign_in_hint']();
    if (/not configured|unavailable/i.test(message))
      return m['vikas.studio.configuration_hint']();
    if (/image_read_failed/i.test(message))
      return m['vikas.studio.image_error']();
    if (cause instanceof ApiError && cause.message) return cause.message;
    return m['vikas.studio.request_error']();
  }

  const form = useForm({
    defaultValues: {
      prompt: selection.prompt ?? initialTemplate?.prompt ?? '',
      aspectRatio: '3:4' as AspectRatio,
    },
    validators: {
      onSubmit: z.object({
        prompt: z
          .string()
          .trim()
          .min(3, m['vikas.studio.prompt_length']())
          .max(2000, m['vikas.studio.prompt_length']()),
        aspectRatio: z.enum(ASPECT_RATIOS),
      }),
    },
    onSubmit: async ({ value }) => {
      setError('');
      if (!session?.user) {
        setError(m['vikas.studio.sign_in_hint']());
        return;
      }
      if (!configured) {
        setError(m['vikas.studio.configuration_hint']());
        return;
      }
      if (!access.data || needsPayment) {
        setError(m['vikas.studio.credits_error']());
        return;
      }
      if (mode === 'video' && !photo) {
        setError(m['vikas.studio.video_photo_required']());
        return;
      }
      try {
        const image = photo ? await readImage(photo) : undefined;
        trackMarketingEvent('generation_started', {
          mode,
          has_photo: Boolean(image),
          free_image: freeImage,
        });
        requestIdRef.current ??= crypto.randomUUID();
        await generation.mutateAsync({
          userId: session.user.id,
          requestId: requestIdRef.current,
          mediaType: mode,
          prompt: value.prompt.trim(),
          ...(image ? { image } : {}),
          aspectRatio: value.aspectRatio,
          usePaidCredits: !freeImage,
        });
      } catch (cause) {
        setError(errorMessage(cause));
        if (cause instanceof ApiError)
          void queryClient.invalidateQueries({
            queryKey: ['vikas-generation-access', session.user.id],
          });
      }
    },
  });
  const draftValues = useStore(form.store, (state) => state.values);

  const workspaceSearch = pathname === '/create' ? `mode=${mode}&` : '';
  const returnPath = `${pathname}${pathname === '/create' ? `?mode=${mode}` : ''}#studio`;
  const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(returnPath)}`;
  const payment = useStudioCheckout({
    source: 'studio',
    redirect: `${pathname}?${workspaceSearch}checkout=return#studio`,
    cancelRedirect: `${pathname}?${workspaceSearch}checkout=cancel#studio`,
    prepare: () => saveDraft(draftScope, mode, templateId, photo, draftValues),
  });
  const videoOffer = payment.plans.data?.videoOffer;
  const imageOffer = payment.plans.data?.products.find(
    (product) => product.productId === 'vikas_starter_once'
  );
  const videoPrice = videoOffer && formatStudioPrice(videoOffer, getLocale());
  const canChoosePayment = Boolean(payment.plans.data?.providers.length);

  function saveDraft(
    scope: string,
    draftMode: MediaMode,
    draftTemplate: string,
    draftPhoto: File | null,
    values: typeof draftValues
  ) {
    return saveStudioDraft(
      {
        scope,
        ownerId: session?.user.id ?? null,
        mode: draftMode,
        templateId: draftTemplate,
        ...values,
      },
      draftPhoto
    ).catch(() => {
      setDraftStatus('error');
    });
  }

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get(
      'checkout'
    );
    if (checkout !== 'return' && checkout !== 'cancel') return;
    setCheckoutReturn(checkout);
    if (checkout === 'return') setAwaitingPaymentUntil(Date.now() + 30_000);
    trackMarketingEvent(
      checkout === 'return' ? 'checkout_returned' : 'checkout_canceled',
      { source: 'studio' }
    );
  }, []);

  useEffect(() => {
    if (sessionPending) return;
    let canceled = false;
    if (
      draftOwner.current !== null &&
      draftOwner.current !== (session?.user.id ?? null)
    ) {
      draftEdited.current = false;
      setPhoto(null);
      form.reset();
      setDraftStatus(null);
    }
    draftOwner.current = session?.user.id ?? null;
    setDraftReady(false);
    void restoreStudioDraft(draftScope, session?.user.id ?? null)
      .then((draft) => {
        if (canceled || draftEdited.current) return;
        if (draft) {
          setMode(draft.mode);
          setTemplateId(draft.templateId);
          form.setFieldValue('prompt', draft.prompt);
          form.setFieldValue('aspectRatio', draft.aspectRatio);
          setPhoto(draft.photo);
          if (draft.photoMissing)
            setPhotoError(m['vikas.studio.draft_photo_missing']());
          draftEdited.current = true;
          setDraftStatus(draft.photoMissing ? 'error' : 'saved');
        }
      })
      .catch(() => {
        if (!canceled) setDraftStatus('error');
      })
      .finally(() => {
        if (!canceled) setDraftReady(true);
      });
    return () => {
      canceled = true;
    };
  }, [sessionPending, session?.user.id, draftScope, form]);

  useEffect(() => {
    if (!draftReady || !draftEdited.current || sessionPending) return;
    let canceled = false;
    void saveStudioDraft(
      {
        scope: draftScope,
        ownerId: session?.user.id ?? null,
        mode,
        templateId,
        ...draftValues,
      },
      photo
    )
      .then(() => {
        if (!canceled) setDraftStatus('saved');
      })
      .catch(() => {
        if (!canceled) setDraftStatus('error');
      });
    return () => {
      canceled = true;
    };
  }, [
    draftReady,
    draftValues,
    mode,
    templateId,
    photo,
    sessionPending,
    session?.user.id,
    draftScope,
  ]);

  function discardDraft() {
    draftEdited.current = false;
    void clearStudioDraft();
    setPhoto(null);
    setTemplateId('');
    form.setFieldValue('prompt', '');
    setDraftStatus(null);
    requestIdRef.current = null;
  }

  useEffect(() => {
    if (lastSelectionRef.current === selection.revision) return;
    const firstSelection = lastSelectionRef.current === null;
    lastSelectionRef.current = selection.revision;
    if (!firstSelection) draftEdited.current = true;
    const next = templates.find((item) => item.id === selection.templateId);
    setMode(selection.mode);
    setTemplateId(next?.id ?? '');
    if (selection.prompt !== undefined || next) {
      form.setFieldValue('prompt', selection.prompt ?? next?.prompt ?? '');
    }
    setSelectedTask(null);
    setOutputTab('preview');
    setError('');
    setCopied(false);
    setMediaError(false);
    requestIdRef.current = null;
  }, [selection, templates, form]);

  useEffect(() => {
    if (!draftReady || !history.data || restoredOutput.current) return;
    restoredOutput.current = true;
    const latest = history.data.find((entry) => entry.mediaType === mode);
    if (latest && Date.now() - Date.parse(latest.createdAt) < 86_400_000)
      setSelectedTask((current) => current ?? latest);
  }, [draftReady, history.data, mode]);

  useEffect(() => {
    if (sessionPending || activeUserRef.current === session?.user.id) return;
    activeUserRef.current = session?.user.id;
    restoredOutput.current = false;
    setSelectedTask(null);
    setOutputTab('preview');
    requestIdRef.current = null;
  }, [session?.user.id, sessionPending]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (result?.status === 'success' || result?.status === 'failed') {
      void queryClient.invalidateQueries({
        queryKey: ['vikas-generation-history'],
      });
      void queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      void queryClient.invalidateQueries({
        queryKey: ['vikas-generation-access'],
      });
    }
  }, [result?.id, result?.status, queryClient]);

  useEffect(() => {
    if (!hasCompletedOutput || !result || trackedResult.current === result.id)
      return;
    trackedResult.current = result.id;
    if (submittedTaskId.current !== result.id) return;
    submittedTaskId.current = null;
    trackMarketingEvent('generation_succeeded', {
      mode: result.mediaType,
      free_image: result.freeImage === true,
    });
    if (window.matchMedia('(max-width: 767px)').matches)
      outputRef.current?.scrollIntoView({ block: 'start' });
  }, [hasCompletedOutput, result]);

  useEffect(() => {
    const element = paywallRef.current;
    if (!element || !needsPayment || working || !configured) return;
    const recordImpression = () => {
      trackMarketingEvent('paywall_viewed', { mode });
      track('paywall_hit', {
        feature: mode === 'image' ? 'image_generation' : 'video_generation',
        visibility: 'visible',
      });
    };
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.intersectionRatio < 0.25) return;
        observer.disconnect();
        recordImpression();
      },
      { threshold: 0.25 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode, needsPayment, working, configured]);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    },
    []
  );

  function selectPhoto(file?: File) {
    if (!file) return;
    // A native file picker can interrupt the hero's smooth scroll. Reveal
    // the upload result (or validation error) once the picker has closed.
    requestAnimationFrame(() => {
      const field = fileInputRef.current?.closest('.vs-field');
      const bounds = field?.getBoundingClientRect();
      if (
        field &&
        bounds &&
        (bounds.top < 100 || bounds.bottom > innerHeight)
      ) {
        field.scrollIntoView({ block: 'center', behavior: 'instant' });
        field.querySelector<HTMLButtonElement>('.vs-upload-target')?.focus({
          preventScroll: true,
        });
      }
    });
    edited();
    setPhotoError('');
    if (!IMAGE_TYPES.has(file.type)) {
      setPhotoError(m['vikas.studio.file_type_error']());
      return;
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      setPhotoError(m['vikas.studio.file_size_error']());
      return;
    }
    trackMarketingEvent('photo_selected', { mode });
    setPhoto(file);
  }

  function dropPhoto(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length !== 1) {
      setPhotoError(m['vikas.studio.one_photo_error']());
      return;
    }
    selectPhoto(event.dataTransfer.files[0]);
  }

  async function changeMode(nextMode: MediaMode, sourcePhoto = photo) {
    if (modeSwitching.current || nextMode === mode) return;
    const next = templates.find((item) => item.mediaType === nextMode);
    const values = { ...form.state.values, prompt: next?.prompt ?? '' };
    if (onModeChange) {
      modeSwitching.current = true;
      draftEdited.current = false;
      await saveDraft(
        `/create/${nextMode}`,
        nextMode,
        next?.id ?? '',
        sourcePhoto,
        values
      );
      onModeChange(nextMode);
      return;
    }
    edited();
    setMode(nextMode);
    setTemplateId(next?.id ?? '');
    setPhoto(sourcePhoto);
    setPhotoError('');
    setSelectedTask(null);
    setOutputTab('preview');
    setCheckoutReturn(null);
    form.setFieldValue('prompt', values.prompt);
    requestAnimationFrame(() =>
      document.getElementById('studio')?.scrollIntoView()
    );
  }

  async function animateImage(id: string) {
    if (preparingVideo) return;
    setPreparingVideo(true);
    setAnimateError(false);
    try {
      const blob = await apiGetBlob(`/api/generations/${id}/download`);
      if (
        !IMAGE_TYPES.has(blob.type) ||
        !blob.size ||
        blob.size > MAX_IMAGE_BYTES
      )
        throw new Error('Invalid reference image');
      trackMarketingEvent('animate_result_clicked');
      await changeMode(
        'video',
        new File([blob], 'vikas-creation', { type: blob.type })
      );
    } catch {
      setAnimateError(true);
    } finally {
      setPreparingVideo(false);
    }
  }

  async function enterSignIn() {
    trackMarketingEvent('auth_prompt_clicked', { mode });
    await saveDraft(draftScope, mode, templateId, photo, draftValues);
    router.push(signInUrl);
  }

  function buyInStudio() {
    const plan = mode === 'video' ? videoOffer : imageOffer;
    if (!plan || !canChoosePayment) return;

    const detail = { source: 'studio', product: plan.productId, mode };
    trackMarketingEvent('purchase_cta_clicked', detail);
    if (!session?.user) {
      void enterSignIn();
      return;
    }
    payment.choose(plan);
  }

  function chooseTemplate(nextId: string) {
    edited();
    setTemplateId(nextId);
    const next = templates.find((item) => item.id === nextId);
    if (next) {
      setMode(next.mediaType);
      form.setFieldValue('prompt', next.prompt);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(form.state.values.prompt);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(m['vikas.studio.copy_error']());
    }
  }

  return (
    <section
      id="studio"
      className="vs-section"
      aria-labelledby="vikas-studio-heading"
    >
      <div className="vs-heading-row">
        <div>
          <span className="vs-eyebrow">
            <Sparkles size={14} />
            {m['vikas.studio.eyebrow']()}
          </span>
          <h2 id="vikas-studio-heading">{m['vikas.studio.title']()}</h2>
          <p>{m['vikas.studio.subtitle']()}</p>
        </div>
        <span className="vs-private-note">
          <LockKeyhole size={14} />
          {m['vikas.studio.private_note']()}
        </span>
      </div>

      <div
        className={cn(
          'vs-shell',
          hasCompletedOutput &&
            outputTab === 'preview' &&
            'has-completed-output'
        )}
      >
        <form
          className="vs-form"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          {draftStatus && (
            <div className="vs-draft-note" role="status">
              <p>
                {draftStatus === 'saved'
                  ? m['vikas.studio.draft_saved']()
                  : m['vikas.studio.draft_error']()}
              </p>
              <button type="button" onClick={discardDraft}>
                {m['vikas.studio.draft_discard']()}
              </button>
            </div>
          )}
          <div
            className="vs-mode-switch"
            role="group"
            aria-label={m['vikas.studio.mode_label']()}
          >
            <button
              type="button"
              aria-pressed={mode === 'image'}
              onClick={() => changeMode('image')}
            >
              <ImageIcon size={16} />
              {m['vikas.studio.image']()}
            </button>
            <button
              type="button"
              aria-pressed={mode === 'video'}
              onClick={() => changeMode('video')}
            >
              <Film size={16} />
              {m['vikas.studio.video']()}
              <span className="vs-duration">5s</span>
            </button>
          </div>

          {checkoutReturn && (
            <p role="status" className="vs-checkout-status">
              {checkoutReturn === 'cancel'
                ? m['vikas.studio.checkout_canceled']()
                : access.data && availableCredits >= credits
                  ? m['vikas.studio.checkout_confirmed']()
                  : m['vikas.studio.checkout_checking']()}
            </p>
          )}

          {mode === 'video' && (
            <div className="vs-video-offer" ref={paywallRef}>
              <div className="vs-video-offer-copy">
                <strong>{m['vikas.studio.video_offer_title']()}</strong>
                <p>
                  {videoPrice
                    ? m['vikas.studio.video_offer_price']({ price: videoPrice })
                    : m['vikas.studio.video_paywall']()}
                </p>
              </div>
              {videoPrice &&
                needsPayment &&
                canChoosePayment &&
                !working &&
                configured && (
                  <button
                    type="button"
                    className="vs-generate"
                    onClick={buyInStudio}
                  >
                    <span>
                      {m['vikas.studio.buy_video']({ price: videoPrice })}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
              <div className="vs-motion-example">
                <figure>
                  <img
                    src="/imgs/vikas/portrait-0.webp"
                    alt={m['vikas.studio.video_example_source']()}
                    width="540"
                    height="540"
                    loading="lazy"
                  />
                  <figcaption>
                    {m['vikas.studio.video_example_before']()}
                  </figcaption>
                </figure>
                <figure>
                  <video
                    controls
                    playsInline
                    preload="none"
                    src="/imgs/vikas/portrait-motion-example.mp4"
                    poster="/imgs/vikas/portrait-0.webp"
                    aria-label={m['vikas.studio.video_example_after']()}
                  />
                  <figcaption>
                    {m['vikas.studio.video_example_after']()}
                  </figcaption>
                </figure>
              </div>
              {!sessionPending &&
                (!session?.user ||
                  (needsPayment && access.data?.freeImageAvailable)) && (
                  <button
                    type="button"
                    className="vs-text-button"
                    onClick={() => void changeMode('image')}
                  >
                    {m['vikas.studio.try_image_first']()}
                    <ArrowRight size={15} />
                  </button>
                )}
            </div>
          )}

          <div className="vs-field">
            <div className="vs-label-row">
              <label htmlFor="vikas-photo">
                {m['vikas.studio.upload_title']()}
              </label>
              <span>
                {mode === 'image'
                  ? m['vikas.studio.optional']()
                  : m['vikas.studio.required']()}
              </span>
            </div>
            <input
              ref={fileInputRef}
              id="vikas-photo"
              className="vs-file-input"
              type="file"
              tabIndex={-1}
              accept="image/jpeg,image/png,image/webp"
              aria-invalid={Boolean(photoError)}
              aria-describedby={photoError ? 'vikas-photo-error' : undefined}
              onChange={(event) => {
                selectPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <div
              className={`vs-upload ${dragging ? 'is-dragging' : ''} ${photoPreview ? 'has-photo' : ''}`}
              data-clarity-mask={photo ? 'true' : undefined}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={dropPhoto}
            >
              <button
                type="button"
                className="vs-upload-target"
                aria-describedby={photoError ? 'vikas-photo-error' : undefined}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={m['vikas.studio.uploaded_alt']()}
                    onError={() => {
                      setPhoto(null);
                      setPhotoError(m['vikas.studio.image_error']());
                    }}
                  />
                ) : (
                  <span className="vs-upload-icon">
                    <Upload size={21} strokeWidth={1.5} />
                  </span>
                )}
                <span className="vs-upload-copy">
                  <strong>
                    {photo ? photo.name : m['vikas.studio.drop_title']()}
                  </strong>
                  <span>
                    {photo
                      ? m['vikas.studio.change_photo']()
                      : m['vikas.studio.file_hint']()}
                  </span>
                </span>
                {!photo && <ImagePlus size={18} className="vs-upload-plus" />}
              </button>
              {photo && (
                <button
                  type="button"
                  className="vs-photo-remove"
                  aria-label={m['vikas.studio.remove_photo']()}
                  onClick={() => {
                    edited();
                    setPhoto(null);
                    setPhotoError('');
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {photoError && (
              <p id="vikas-photo-error" className="vs-photo-error" role="alert">
                <Info size={15} />
                {photoError}
              </p>
            )}
          </div>

          <div className="vs-field">
            <label htmlFor="vikas-template">
              {m['vikas.studio.template_title']()}
            </label>
            <div className="vs-select-wrap">
              <select
                id="vikas-template"
                value={templateId}
                onChange={(event) => chooseTemplate(event.target.value)}
              >
                <option value="">{m['vikas.studio.custom_prompt']()}</option>
                {templates
                  .filter((item) => item.mediaType === mode)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>

          <form.Field name="prompt">
            {(field) => (
              <div className="vs-field">
                <div className="vs-label-row">
                  <label htmlFor="vikas-prompt">
                    {m['vikas.studio.prompt_title']()}
                  </label>
                  <button
                    type="button"
                    className="vs-copy"
                    onClick={() => void copyPrompt()}
                    disabled={!field.state.value.trim()}
                    aria-live="polite"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied
                      ? m['vikas.studio.copied']()
                      : m['vikas.studio.copy_prompt']()}
                  </button>
                </div>
                <Textarea
                  id="vikas-prompt"
                  data-clarity-mask="true"
                  className="vs-prompt"
                  value={field.state.value}
                  maxLength={2000}
                  placeholder={
                    mode === 'image'
                      ? m['vikas.studio.prompt_placeholder']()
                      : m['vikas.studio.video_placeholder']()
                  }
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    edited();
                    field.handleChange(event.target.value);
                  }}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby="vikas-prompt-help"
                />
                <div className="vs-prompt-meta" id="vikas-prompt-help">
                  <span>
                    {field.state.meta.errors.length
                      ? m['vikas.studio.prompt_length']()
                      : m['vikas.studio.prompt_hint']()}
                  </span>
                  <span>{field.state.value.length}/2000</span>
                </div>
              </div>
            )}
          </form.Field>

          <div className="vs-options-row">
            {mode === 'image' ? (
              <form.Field name="aspectRatio">
                {(field) => (
                  <div className="vs-field vs-format-field">
                    <label htmlFor="vikas-ratio">
                      {m['vikas.studio.format']()}
                    </label>
                    <div className="vs-select-wrap">
                      <select
                        id="vikas-ratio"
                        value={field.state.value}
                        onChange={(event) => {
                          edited();
                          field.handleChange(event.target.value as AspectRatio);
                        }}
                      >
                        {ASPECT_RATIOS.map((ratio) => (
                          <option key={ratio} value={ratio}>
                            {ratio} ·{' '}
                            {ratio === '1:1'
                              ? m['vikas.studio.square']()
                              : ratio === '16:9'
                                ? m['vikas.studio.landscape']()
                                : ratio === '9:16'
                                  ? m['vikas.studio.story']()
                                  : m['vikas.studio.portrait']()}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} aria-hidden="true" />
                    </div>
                  </div>
                )}
              </form.Field>
            ) : (
              <div className="vs-source-framing">
                <Film size={16} />
                <span>{m['vikas.studio.source_framing']()}</span>
              </div>
            )}
            <div className="vs-credit-cost">
              <span>{m['vikas.studio.generation_cost']()}</span>
              <strong>
                <Sparkles size={14} />
                {freeImage
                  ? m['vikas.pricing.free_short']()
                  : m['vikas.studio.credit_count']({ count: credits })}
              </strong>
            </div>
          </div>

          {session?.user && access.data && (
            <p className="vs-footer-note">
              {freeImage
                ? m['vikas.studio.free_hint']()
                : m['vikas.studio.paid_balance']({
                    count: availableCredits,
                  })}
            </p>
          )}
          {access.isError && (
            <p className="vs-error" role="alert">
              {m['vikas.studio.balance_error']()}{' '}
              <button type="button" onClick={() => void access.refetch()}>
                {m['vikas.studio.retry']()}
              </button>
            </p>
          )}
          {trialPaused && !working && (
            <div role="status" className="vs-service-notice">
              <p>{m['vikas.studio.trial_paused']()}</p>
              <button
                type="button"
                className="vs-copy"
                disabled={access.isFetching}
                onClick={() => void access.refetch()}
              >
                {m['vikas.studio.refresh_balance']()}
              </button>
            </div>
          )}
          {capabilities.isSuccess && !configured && !working ? (
            <div className="vs-service-notice" role="status">
              <Info size={17} />
              <p>{m['vikas.studio.configuration_hint']()}</p>
            </div>
          ) : null}
          {capabilities.isSuccess && !configured && !working ? (
            <Button type="button" className="vs-generate" disabled>
              <span>{m['vikas.studio.unavailable_button']()}</span>
              <Info size={17} />
            </Button>
          ) : !sessionPending && !session?.user ? (
            <Link
              href={signInUrl}
              className="vs-generate"
              onClick={(event) => {
                if (
                  event.button ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey
                )
                  return;
                event.preventDefault();
                void enterSignIn();
              }}
            >
              <span>{m['vikas.studio.sign_in_generate']()}</span>
              <ArrowRight size={18} />
            </Link>
          ) : needsPayment && !working ? (
            <div
              className="vs-paywall"
              role="status"
              ref={mode === 'image' ? paywallRef : undefined}
            >
              <p>
                {mode === 'video'
                  ? m['vikas.studio.video_paywall']()
                  : m['vikas.studio.image_paywall']()}
              </p>
              {canChoosePayment &&
                (mode === 'video' ? videoPrice : imageOffer) && (
                  <button
                    type="button"
                    className="vs-generate"
                    onClick={buyInStudio}
                  >
                    <span>
                      {videoPrice && mode === 'video'
                        ? m['vikas.studio.buy_video']({ price: videoPrice })
                        : imageOffer &&
                          m['vikas.studio.buy_image_credits']({
                            count:
                              imageOffer.credits.toLocaleString(getLocale()),
                            price: formatStudioPrice(imageOffer, getLocale()),
                          })}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )}
              <Link href="/pricing" className="vs-text-button">
                {m['vikas.studio.view_packs']()}
              </Link>
              <button
                type="button"
                className="vs-copy"
                disabled={access.isFetching}
                onClick={() => void access.refetch()}
              >
                {m['vikas.studio.refresh_balance']()}
              </button>
            </div>
          ) : (
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="vs-generate"
                  disabled={
                    working ||
                    isSubmitting ||
                    sessionPending ||
                    !configured ||
                    !access.data
                  }
                >
                  <span>
                    {working || isSubmitting
                      ? m['vikas.studio.generating']()
                      : capabilities.isPending || sessionPending
                        ? m['vikas.studio.checking_service']()
                        : capabilities.isError
                          ? m['vikas.studio.check_service']()
                          : mode === 'video'
                            ? m['vikas.studio.generate_video']()
                            : m['vikas.studio.generate_image']()}
                  </span>
                  {working || isSubmitting || capabilities.isPending ? (
                    <LoaderCircle size={18} className="vs-spinner" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                </Button>
              )}
            </form.Subscribe>
          )}

          {error && (
            <p className="vs-error" role="alert">
              <Info size={15} />
              <span>{error}</span>
            </p>
          )}
          {capabilities.isError ? (
            <p className="vs-availability">
              <Info size={14} />
              <span>
                {m['vikas.studio.config_error']()}{' '}
                <button
                  type="button"
                  onClick={() => void capabilities.refetch()}
                >
                  {m['vikas.studio.retry']()}
                </button>
              </span>
            </p>
          ) : configured ? (
            <p className="vs-footer-note">{m['vikas.studio.consent_note']()}</p>
          ) : null}
        </form>

        <div className="vs-output" ref={outputRef}>
          <div
            className="vs-output-nav"
            role="tablist"
            aria-label={m['vikas.studio.output_label']()}
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return;
              event.preventDefault();
              const nextTab =
                event.key === 'Home'
                  ? 'preview'
                  : event.key === 'End'
                    ? 'history'
                    : outputTab === 'preview'
                      ? 'history'
                      : 'preview';
              setOutputTab(nextTab);
              document.getElementById(`vikas-${nextTab}-tab`)?.focus();
            }}
          >
            <button
              type="button"
              role="tab"
              id="vikas-preview-tab"
              aria-controls="vikas-preview-panel"
              aria-selected={outputTab === 'preview'}
              tabIndex={outputTab === 'preview' ? 0 : -1}
              onClick={() => setOutputTab('preview')}
            >
              <ImageIcon size={15} />
              {m['vikas.studio.preview']()}
            </button>
            <button
              type="button"
              role="tab"
              id="vikas-history-tab"
              aria-controls="vikas-history-panel"
              aria-selected={outputTab === 'history'}
              tabIndex={outputTab === 'history' ? 0 : -1}
              onClick={() => setOutputTab('history')}
            >
              <History size={15} />
              {m['vikas.studio.history']()}
            </button>
            <span className="vs-output-mark">
              <Sparkles size={14} />
            </span>
          </div>

          {outputTab === 'preview' ? (
            <div
              id="vikas-preview-panel"
              role="tabpanel"
              aria-labelledby="vikas-preview-tab"
              tabIndex={0}
              className="vs-preview-panel"
            >
              {result?.status === 'success' && resultUrl ? (
                <>
                  <div className="vs-result-media" data-clarity-mask="true">
                    {mediaError ? (
                      <div className="vs-state">
                        <Info size={27} />
                        <p>{m['vikas.studio.preview_error']()}</p>
                      </div>
                    ) : result.mediaType === 'video' ? (
                      <video
                        src={resultUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onError={() => setMediaError(true)}
                        aria-label={m['vikas.studio.generated_video_alt']()}
                      />
                    ) : (
                      <img
                        src={resultUrl}
                        alt={m['vikas.studio.generated_image_alt']()}
                        onError={() => setMediaError(true)}
                      />
                    )}
                  </div>
                  <div className="vs-result-caption">
                    <span>
                      <Check size={15} />
                      {m['vikas.studio.download_expiry']()}
                    </span>
                    <a
                      href={`/api/generations/${result.id}/download`}
                      download
                      data-clarity-mask="true"
                    >
                      <ArrowDownToLine size={15} />
                      {m['vikas.studio.download']()}
                    </a>
                  </div>
                  {result.mediaType === 'image' && mode === 'image' && (
                    <div className="vs-result-video">
                      <button
                        type="button"
                        className="vs-text-button"
                        disabled={preparingVideo}
                        onClick={() => void animateImage(result.id)}
                      >
                        {preparingVideo ? (
                          <LoaderCircle className="vs-spinner" size={16} />
                        ) : (
                          <Film size={16} />
                        )}
                        {m['vikas.studio.animate_image']()}
                        <ArrowRight size={15} />
                      </button>
                      {animateError && (
                        <p className="vs-error" role="alert">
                          {m['vikas.studio.animate_failed']()}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : result?.status === 'success' && !resultUrl ? (
                <div className="vs-state" role="status">
                  <Info size={27} />
                  <p>{m['vikas.studio.result_missing']()}</p>
                </div>
              ) : generation.isPending || isWorking(result) ? (
                <div
                  className="vs-state vs-processing"
                  role="status"
                  aria-live="polite"
                >
                  <span className="vs-state-icon">
                    <LoaderCircle
                      size={26}
                      className={result?.error ? '' : 'vs-spinner'}
                    />
                  </span>
                  <h3>
                    {result?.error
                      ? m['vikas.studio.check_submission']()
                      : m['vikas.studio.working_title']()}
                  </h3>
                  <p>
                    {result?.error
                      ? m['vikas.studio.uncertain_submission']()
                      : m['vikas.studio.working_hint']()}
                  </p>
                  {result && (
                    <span
                      className="vs-task-reference"
                      data-clarity-mask="true"
                    >
                      {m['vikas.studio.task_reference']()}{' '}
                      {result.id.slice(-12)}
                    </span>
                  )}
                  {task.isError && (
                    <button
                      type="button"
                      className="vs-text-button"
                      onClick={() => void task.refetch()}
                    >
                      <RefreshCw size={14} />
                      {m['vikas.studio.check_status']()}
                    </button>
                  )}
                </div>
              ) : result?.status === 'failed' ||
                result?.status === 'canceled' ? (
                <div className="vs-state" role="status">
                  <Info size={28} />
                  <h3>{statusLabels[result.status]}</h3>
                  <p>{result.error || m['vikas.studio.failed_hint']()}</p>
                  <button
                    type="button"
                    className="vs-text-button"
                    onClick={() => {
                      setSelectedTask(null);
                      requestIdRef.current = null;
                    }}
                  >
                    <RefreshCw size={14} />
                    {m['vikas.studio.back_to_preview']()}
                  </button>
                </div>
              ) : (
                <div className="vs-style-preview">
                  <VikasArtwork
                    index={
                      selectedTemplate?.artwork ?? (mode === 'video' ? 2 : 1)
                    }
                    alt={
                      selectedTemplate?.title ?? m['vikas.studio.example_alt']()
                    }
                  />
                  <span className="vs-preview-badge">
                    <Sparkles size={12} />
                    {m['vikas.studio.style_preview']()}
                  </span>
                  {mode === 'video' && (
                    <span className="vs-motion-badge">
                      <Film size={14} />
                      {m['vikas.studio.motion_preview']()}
                    </span>
                  )}
                  <div className="vs-preview-caption">
                    <span>{m['vikas.studio.ai_example']()}</span>
                    <h3>
                      {selectedTemplate?.title ??
                        m['vikas.studio.preview_title']()}
                    </h3>
                    <p>{m['vikas.studio.preview_hint']()}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              id="vikas-history-panel"
              role="tabpanel"
              aria-labelledby="vikas-history-tab"
              tabIndex={0}
              className="vs-history-panel"
            >
              {!session?.user ? (
                <div className="vs-state">
                  <LockKeyhole size={27} />
                  <h3>{m['vikas.studio.history_sign_in']()}</h3>
                  <p>{m['vikas.studio.history_sign_in_hint']()}</p>
                  <Link href={signInUrl} className="vs-text-button">
                    {m['vikas.studio.sign_in']()}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : history.isPending ? (
                <div className="vs-state" role="status">
                  <LoaderCircle className="vs-spinner" size={26} />
                  <p>{m['vikas.studio.loading_history']()}</p>
                </div>
              ) : history.isError ? (
                <div className="vs-state">
                  <Info size={26} />
                  <p>{m['vikas.studio.history_error']()}</p>
                  <button
                    type="button"
                    className="vs-text-button"
                    onClick={() => void history.refetch()}
                  >
                    <RefreshCw size={14} />
                    {m['vikas.studio.retry']()}
                  </button>
                </div>
              ) : !history.data?.length ? (
                <div className="vs-state">
                  <ImagePlus size={30} />
                  <h3>{m['vikas.studio.empty_history']()}</h3>
                  <p>{m['vikas.studio.empty_history_hint']()}</p>
                </div>
              ) : (
                <div className="vs-history-list" data-clarity-mask="true">
                  {history.data.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="vs-history-item"
                      onClick={() => {
                        setSelectedTask(item);
                        setOutputTab('preview');
                        setMediaError(false);
                      }}
                    >
                      <span className="vs-history-icon">
                        {item.mediaType === 'video' ? (
                          <Film size={20} />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </span>
                      <span className="vs-history-info">
                        <strong>{item.prompt}</strong>
                        <span>
                          {statusLabels[item.status]} ·{' '}
                          {new Date(item.createdAt).toLocaleDateString(
                            getLocale() === 'zh' ? 'zh-CN' : 'en-IN',
                            { month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <StudioPaymentDialog payment={payment} />
    </section>
  );
}
