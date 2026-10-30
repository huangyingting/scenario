import { prisma } from './prisma';
import { SYSTEM_MODELS } from './system-catalog';

export type GenerationRequest = {
  teamId: string;
  projectId: string;
  userId: string;
  modality:
    | 'image'
    | 'video'
    | '3d'
    | 'audio'
    | 'text'
    | 'texture'
    | 'skybox'
    | 'world'
    | 'upscale'
    | 'reframe'
    | 'remove-bg'
    | 'vectorize'
    | 'pixelate';
  modelId?: string;
  prompt: string;
  negativePrompt?: string;
  sourceAssetId?: string;
  parameters?: {
    aspectRatio?: string;
    width?: number;
    height?: number;
    numSamples?: number;
    steps?: number;
    guidance?: number;
    seed?: number;
    seamless?: boolean;
    durationSeconds?: number;
    resolution?: string;
    cameraMotion?: string;
    outputFormat?: string;
    polycount?: string;
    audioMode?: string;
    voicePreset?: string;
    scaleFactor?: number;
    pixelGridSize?: number;
    systemPrompt?: string;
    temperature?: number;
  };
};

function hashSeed(input: string, baseSeed = 1337): number {
  let h = baseSeed ^ 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h >>> 0);
}

function escapeXml(raw: string): string {
  return (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function selectPalette(seed: number, prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('cyberpunk') || lower.includes('neon') || lower.includes('mech')) {
    return { bg1: '#090614', bg2: '#1a0b2e', primary: '#00f0ff', secondary: '#ff007f', accent: '#facc15', glow: '#7c3aed' };
  }
  if (lower.includes('forest') || lower.includes('emerald') || lower.includes('nature') || lower.includes('poison')) {
    return { bg1: '#05140d', bg2: '#0c291e', primary: '#10b981', secondary: '#34d399', accent: '#a3e635', glow: '#059669' };
  }
  if (lower.includes('fire') || lower.includes('dragon') || lower.includes('lava') || lower.includes('forge')) {
    return { bg1: '#180705', bg2: '#2d0f0a', primary: '#f97316', secondary: '#ef4444', accent: '#fde047', glow: '#ea580c' };
  }
  const palettes = [
    { bg1: '#080b14', bg2: '#121b2e', primary: '#0099ff', secondary: '#38bdf8', accent: '#f59e0b', glow: '#2563eb' },
    { bg1: '#0d0917', bg2: '#1e1436', primary: '#a855f7', secondary: '#ec4899', accent: '#38bdf8', glow: '#7e22ce' },
    { bg1: '#071318', bg2: '#0f2933', primary: '#14b8a6', secondary: '#2dd4bf', accent: '#fbbf24', glow: '#0d9488' },
  ];
  return palettes[seed % palettes.length];
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateArtworkSvg(params: {
  prompt: string;
  modelName: string;
  modality: string;
  width: number;
  height: number;
  seed: number;
  transparentBg?: boolean;
  pixelate?: boolean;
  seamless?: boolean;
  skybox?: boolean;
}): { dataUrl: string; svgSource: string } {
  const { prompt, modelName, modality, width, height, seed, transparentBg, pixelate, seamless, skybox } = params;
  const pal = selectPalette(seed, prompt);
  const titleText = escapeXml(prompt.slice(0, 56));
  const modelText = escapeXml(modelName);
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  if (seamless || modality === 'texture') {
    const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <pattern id="pbrGrid" width="128" height="128" patternUnits="userSpaceOnUse">
          <rect width="128" height="128" fill="${pal.bg1}"/>
          <path d="M 0 64 L 64 0 L 128 64 L 64 128 Z" fill="${pal.bg2}" stroke="${pal.primary}" stroke-width="2" stroke-opacity="0.45"/>
          <circle cx="64" cy="64" r="22" fill="${pal.glow}" fill-opacity="0.35" stroke="${pal.accent}" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="16" fill="${pal.primary}" fill-opacity="0.25"/>
          <circle cx="128" cy="0" r="16" fill="${pal.primary}" fill-opacity="0.25"/>
          <circle cx="0" cy="128" r="16" fill="${pal.primary}" fill-opacity="0.25"/>
          <circle cx="128" cy="128" r="16" fill="${pal.primary}" fill-opacity="0.25"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pbrGrid)"/>
      <rect x="24" y="${height - 76}" width="${width - 48}" height="52" rx="10" fill="#09090b" fill-opacity="0.78" stroke="${pal.primary}" stroke-opacity="0.4"/>
      <text x="42" y="${height - 45}" fill="#f4f4f5" font-family="Inter, monospace" font-size="18" font-weight="600">PBR SEAMLESS TILE · ${titleText}</text>
    </svg>`;
    return { dataUrl: svgToDataUrl(tileSvg), svgSource: tileSvg };
  }

  if (skybox || modality === 'skybox') {
    const skySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" width="1600" height="800">
      <defs>
        <linearGradient id="skyDome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${pal.bg1}"/>
          <stop offset="50%" stop-color="${pal.bg2}"/>
          <stop offset="78%" stop-color="${pal.glow}"/>
          <stop offset="100%" stop-color="#050507"/>
        </linearGradient>
        <radialGradient id="nebulaGlow" cx="65%" cy="32%" r="40%">
          <stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.85"/>
          <stop offset="45%" stop-color="${pal.primary}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${pal.bg1}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="800" fill="url(#skyDome)"/>
      <rect width="1600" height="800" fill="url(#nebulaGlow)"/>
      <circle cx="1040" cy="240" r="78" fill="${pal.accent}" fill-opacity="0.9"/>
      <circle cx="420" cy="190" r="42" fill="${pal.secondary}" fill-opacity="0.75"/>
      <ellipse cx="800" cy="400" rx="760" ry="260" fill="none" stroke="${pal.primary}" stroke-opacity="0.22" stroke-dasharray="8 8"/>
      <path d="M 0 580 Q 260 440 520 550 T 1040 520 T 1600 570 L 1600 800 L 0 800 Z" fill="#090a10" stroke="${pal.primary}" stroke-width="2" stroke-opacity="0.5"/>
      <text x="48" y="750" fill="#f4f4f5" font-family="Inter, sans-serif" font-size="22" font-weight="600">360° EQUIRECTANGULAR SKYBOX · ${titleText}</text>
    </svg>`;
    return { dataUrl: svgToDataUrl(skySvg), svgSource: skySvg };
  }

  if (pixelate) {
    const cells: string[] = [];
    const cols = 16;
    const rows = 16;
    const cw = Math.floor(width / cols);
    const ch = Math.floor(height / rows);
    const colors = [pal.bg1, pal.bg2, pal.primary, pal.secondary, pal.accent, pal.glow];
    for (let r = 2; r < rows - 2; r++) {
      for (let c = 2; c < cols / 2; c++) {
        const v = (seed + r * 31 + c * 17) % 7;
        if (v > 1) {
          const color = colors[v % colors.length];
          cells.push(`<rect x="${c * cw}" y="${r * ch}" width="${cw}" height="${ch}" fill="${color}"/>`);
          cells.push(`<rect x="${(cols - 1 - c) * cw}" y="${r * ch}" width="${cw}" height="${ch}" fill="${color}"/>`);
        }
      }
    }
    const pxSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="${pal.bg1}"/>
      ${cells.join('\n')}
      <text x="32" y="${height - 32}" fill="#ffffff" font-family="monospace" font-size="20">16-BIT PIXEL SPRITE · SEED ${seed}</text>
    </svg>`;
    return { dataUrl: svgToDataUrl(pxSvg), svgSource: pxSvg };
  }

  const bgMarkup = transparentBg
    ? `<defs>
        <pattern id="alphaCheck" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#18181b"/>
          <rect x="16" width="16" height="16" fill="#27272a"/>
          <rect y="16" width="16" height="16" fill="#27272a"/>
          <rect x="16" y="16" width="16" height="16" fill="#18181b"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#alphaCheck)"/>`
    : `<defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${pal.bg1}"/>
          <stop offset="60%" stop-color="${pal.bg2}"/>
          <stop offset="100%" stop-color="#070709"/>
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="44%" r="44%">
          <stop offset="0%" stop-color="${pal.primary}" stop-opacity="0.55"/>
          <stop offset="55%" stop-color="${pal.glow}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${pal.bg1}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      <rect width="100%" height="100%" fill="url(#coreGlow)"/>`;

  const r1 = Math.round(Math.min(width, height) * 0.26);
  const r2 = Math.round(Math.min(width, height) * 0.16);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${bgMarkup}
    <!-- Isometric Platform & Runic Geometry -->
    <g transform="translate(${cx}, ${cy - 20})">
      <polygon points="0,${-r1} ${r1},0 0,${r1} ${-r1},0" fill="${pal.bg2}" stroke="${pal.primary}" stroke-width="3" stroke-opacity="0.8"/>
      <polygon points="0,${-r1 + 28} ${r1 - 28},0 0,${r1 - 28} ${-r1 + 28},0" fill="none" stroke="${pal.accent}" stroke-width="2" stroke-dasharray="10 6"/>
      <polygon points="0,${-r2 - 40} ${r2},${-20} 0,${r2 - 10} ${-r2},${-20}" fill="${pal.primary}" fill-opacity="0.35" stroke="${pal.secondary}" stroke-width="2.5"/>
      <polygon points="0,${-r2 - 40} ${r2},${-20} 0,${-15}" fill="${pal.accent}" fill-opacity="0.45"/>
      <circle cx="0" cy="-25" r="26" fill="${pal.accent}" fill-opacity="0.9"/>
      <circle cx="0" cy="-25" r="46" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.5"/>
    </g>
    <!-- Metadata HUD Footer -->
    <rect x="28" y="${height - 104}" width="${width - 56}" height="76" rx="14" fill="#0b0b0e" fill-opacity="0.82" stroke="${pal.primary}" stroke-opacity="0.45"/>
    <text x="52" y="${height - 68}" fill="#f4f4f5" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700">${titleText}</text>
    <text x="52" y="${height - 40}" fill="#9ca3af" font-family="JetBrains Mono, monospace" font-size="14">${modelText} · ${width}×${height} · SEED ${seed}</text>
  </svg>`;

  return { dataUrl: svgToDataUrl(svg), svgSource: svg };
}

function generateWavefrontObjMesh(prompt: string, seed: number): string {
  const scale = 1.0 + ((seed % 40) / 100);
  const h = (1.4 * scale).toFixed(4);
  const s = (0.85 * scale).toFixed(4);
  return [
    `# Scenario 3D PBR Mesh Export`,
    `# Prompt: ${prompt.replace(/\r?\n/g, ' ')}`,
    `# Seed: ${seed}`,
    `o ScenarioGameAsset_${seed}`,
    `v 0.0000 ${h} 0.0000`,
    `v -${s} 0.0000 ${s}`,
    `v ${s} 0.0000 ${s}`,
    `v ${s} 0.0000 -${s}`,
    `v -${s} 0.0000 -${s}`,
    `v 0.0000 -${h} 0.0000`,
    `vn 0.0000 0.7071 0.7071`,
    `vn 0.7071 0.7071 0.0000`,
    `vn 0.0000 0.7071 -0.7071`,
    `vn -0.7071 0.7071 0.0000`,
    `vt 0.5000 1.0000`,
    `vt 0.0000 0.5000`,
    `vt 1.0000 0.5000`,
    `vt 0.5000 0.0000`,
    `f 1/1/1 2/2/1 3/3/1`,
    `f 1/1/2 3/2/2 4/3/2`,
    `f 1/1/3 4/2/3 5/3/3`,
    `f 1/1/4 5/2/4 2/3/4`,
    `f 6/4/1 3/3/1 2/2/1`,
    `f 6/4/2 4/3/2 3/2/2`,
    `f 6/4/3 5/3/3 4/2/3`,
    `f 6/4/4 2/3/4 5/2/4`,
  ].join('\n');
}

function generatePlayableWavDataUrl(seed: number, durationSec = 2): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * Math.min(Math.max(durationSec, 1), 4);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const baseFreq = 220 + (seed % 260);
  const fifthFreq = baseFreq * 1.498;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 1.1) * Math.min(1, t * 25);
    const wave =
      0.6 * Math.sin(2 * Math.PI * baseFreq * t) +
      0.3 * Math.sin(2 * Math.PI * fifthFreq * t) +
      0.1 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);
    const sample = Math.max(-1, Math.min(1, wave * envelope));
    buffer.writeInt16LE(Math.round(sample * 28000), 44 + i * 2);
  }

  return `data:audio/wav;base64,${buffer.toString('base64')}`;
}

export async function executeMultiModalGeneration(req: GenerationRequest) {
  const startTime = Date.now();
  const prompt = (req.prompt || '').trim() || 'Stylized dark fantasy game asset';
  const negativePrompt = (req.negativePrompt || '').trim();

  // Check Project Quality Gate Guardrails
  const project = await prisma.project.findUnique({
    where: { id: req.projectId },
  });

  let finalPrompt = prompt;
  if (project?.guardrailsJson) {
    try {
      const guardrails = JSON.parse(project.guardrailsJson) as {
        enabled?: boolean;
        bannedTerms?: string[] | string;
        bannedKeywords?: string[];
        requiredStyleSuffix?: string;
      };
      if (guardrails.enabled !== false) {
        const rawList = Array.isArray(guardrails.bannedTerms)
          ? guardrails.bannedTerms
          : Array.isArray(guardrails.bannedKeywords)
            ? guardrails.bannedKeywords
            : typeof guardrails.bannedTerms === 'string'
              ? guardrails.bannedTerms.split(',')
              : [];
        if (rawList.length > 0) {
          const lowerPrompt = prompt.toLowerCase();
          const hit = rawList.find(
            (term) => term.trim() && lowerPrompt.includes(term.trim().toLowerCase())
          );
          if (hit) {
            throw new Error(
              `Prompt blocked by Project Quality Gate: contains banned term "${hit.trim()}".`
            );
          }
        }
      }
      if (guardrails.requiredStyleSuffix?.trim()) {
        const suffix = guardrails.requiredStyleSuffix.trim();
        if (!finalPrompt.toLowerCase().includes(suffix.toLowerCase())) {
          finalPrompt = `${finalPrompt}, ${suffix}`;
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Project Quality Gate')) {
        throw e;
      }
    }
  }

  // Resolve Model
  const customModel = req.modelId
    ? await prisma.aiModel.findFirst({ where: { id: req.modelId } })
    : null;
  const systemModel =
    SYSTEM_MODELS.find((m) => m.id === req.modelId) ||
    SYSTEM_MODELS.find((m) => m.modality === req.modality) ||
    SYSTEM_MODELS[0];

  const modelId = customModel?.id || systemModel.id;
  const modelName = customModel?.name || systemModel.name;
  const baseUnitCost = customModel?.oscuCost || systemModel.oscuCost || 10;

  const numSamples = Math.min(Math.max(Number(req.parameters?.numSamples || 1), 1), 4);
  const totalOscuCost = baseUnitCost * numSamples;

  const width = Number(req.parameters?.width || (req.modality === 'skybox' || req.modality === 'world' ? 1600 : 1024));
  const height = Number(req.parameters?.height || (req.modality === 'skybox' || req.modality === 'world' ? 800 : 1024));
  const baseSeed = Number(req.parameters?.seed || Math.floor(100000 + (Date.now() % 899999)));

  const toolBadgeMap: Record<string, string> = {
    image: 'Txt2Img',
    video: 'Img2Video',
    '3d': 'Img23d',
    audio: 'AudioSynth',
    text: 'TextLLM',
    texture: 'PBRTexture',
    skybox: 'Skybox360',
    world: 'WorldSplat',
    upscale: 'Upscale',
    reframe: 'Reframe',
    'remove-bg': 'RemoveBG',
    vectorize: 'Vectorize',
    pixelate: 'Pixelate',
  };

  const normalizedAssetModality = ['upscale', 'reframe', 'remove-bg', 'vectorize', 'pixelate'].includes(
    req.modality
  )
    ? 'image'
    : req.modality === 'world'
      ? 'skybox'
      : req.modality;

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUniqueOrThrow({
      where: { id: req.teamId },
      include: { oscuBuckets: { orderBy: { priority: 'asc' } } },
    });

    let newBalance = org.oscuBalance - totalOscuCost;
    if (newBalance < 0 && org.autoRefillEnabled) {
      newBalance += org.autoRefillAmount;
      await tx.oscuBucket.create({
        data: {
          teamId: org.id,
          name: 'Auto-Refill Batch',
          totalUnits: org.autoRefillAmount,
          remainingUnits: org.autoRefillAmount,
          priority: 2,
        },
      });
    }

    const clampedBalance = Math.max(0, newBalance);
    await tx.organization.update({
      where: { id: org.id },
      data: { oscuBalance: clampedBalance },
    });

    const activeBucket = org.oscuBuckets.find((b) => b.remainingUnits > 0);
    if (activeBucket) {
      await tx.oscuBucket.update({
        where: { id: activeBucket.id },
        data: {
          remainingUnits: Math.max(0, activeBucket.remainingUnits - totalOscuCost),
        },
      });
    }

    const job = await tx.inferenceJob.create({
      data: {
        teamId: req.teamId,
        projectId: req.projectId,
        userId: req.userId,
        modality: req.modality,
        modelId,
        modelName,
        prompt: finalPrompt,
        negativePrompt,
        parametersJson: JSON.stringify(req.parameters || {}),
        status: 'COMPLETED',
        oscuCost: totalOscuCost,
        durationMs: Math.max(120, Date.now() - startTime + 240),
        completedAt: new Date(),
      },
    });

    await tx.oscuTransaction.create({
      data: {
        teamId: req.teamId,
        projectId: req.projectId,
        userId: req.userId,
        amount: -totalOscuCost,
        balanceAfter: clampedBalance,
        reason: 'INFERENCE',
        description: `${modelName} (${req.modality}) × ${numSamples}`,
        referenceId: job.id,
      },
    });

    const createdAssets = [];
    for (let i = 0; i < numSamples; i++) {
      const sampleSeed = hashSeed(`${finalPrompt}:${i}`, baseSeed + i);
      const art = generateArtworkSvg({
        prompt: finalPrompt,
        modelName,
        modality: req.modality,
        width: req.modality === 'upscale' ? width * 2 : width,
        height: req.modality === 'upscale' ? height * 2 : height,
        seed: sampleSeed,
        transparentBg: req.modality === 'remove-bg',
        pixelate: req.modality === 'pixelate',
        seamless: req.modality === 'texture' || Boolean(req.parameters?.seamless),
        skybox: req.modality === 'skybox' || req.modality === 'world',
      });

      let artifactPayload = art.svgSource;
      let mimeType = 'image/svg+xml';
      let durationSec: number | null = null;
      const metadata: Record<string, unknown> = {
        steps: req.parameters?.steps || 28,
        guidance: req.parameters?.guidance || 3.5,
        aspectRatio: req.parameters?.aspectRatio || '1:1',
        sourceAssetId: req.sourceAssetId || null,
      };

      if (req.modality === '3d') {
        artifactPayload = generateWavefrontObjMesh(finalPrompt, sampleSeed);
        mimeType = 'model/obj';
        metadata.outputFormat = req.parameters?.outputFormat || 'GLB';
        metadata.polycount = req.parameters?.polycount || 'Medium (25k tris)';
        metadata.pbrMaps = ['Albedo', 'Normal', 'Metallic', 'Roughness'];
      } else if (req.modality === 'audio') {
        durationSec = Number(req.parameters?.durationSeconds || 3);
        artifactPayload = generatePlayableWavDataUrl(sampleSeed, durationSec);
        mimeType = 'audio/wav';
        metadata.audioMode = req.parameters?.audioMode || 'Sound Effects';
        metadata.voicePreset = req.parameters?.voicePreset || 'Cinematic Trailer Impact';
      } else if (req.modality === 'video') {
        durationSec = Number(req.parameters?.durationSeconds || 5);
        mimeType = 'video/svg+xml';
        metadata.resolution = req.parameters?.resolution || '1080p';
        metadata.cameraMotion = req.parameters?.cameraMotion || 'Orbit';
      } else if (req.modality === 'text') {
        mimeType = 'text/markdown';
        artifactPayload = [
          `# Asset Production Brief: ${finalPrompt}`,
          ``,
          `- **Visual Direction**: High-contrast dark fantasy silhouette with physically based metallic trim and emissive rune accents.`,
          `- **Recommended Polycount**: 18,500 tris (LOD0) / 6,200 tris (LOD1).`,
          `- **Shader & PBR Channels**: 2048×2048 Albedo, Tangent-Space Normal, Packed ORM (Occlusion/Roughness/Metallic), and Emissive mask.`,
          `- **Engine Integration**: Ready for Unreal Engine 5 Nanite & Unity URP.`,
        ].join('\n');
      } else if (req.modality === 'texture') {
        metadata.seamless = true;
        metadata.pbrChannels = ['Albedo', 'Normal', 'Height', 'Roughness', 'AO'];
      }

      const asset = await tx.asset.create({
        data: {
          teamId: req.teamId,
          projectId: req.projectId,
          userId: req.userId,
          inferenceJobId: job.id,
          modality: normalizedAssetModality,
          toolBadge: toolBadgeMap[req.modality] || 'Txt2Img',
          title: finalPrompt.slice(0, 64),
          prompt: finalPrompt,
          negativePrompt,
          modelId,
          modelName,
          mimeType,
          width: req.modality === 'upscale' ? width * 2 : width,
          height: req.modality === 'upscale' ? height * 2 : height,
          durationSec,
          seed: sampleSeed,
          dataUrl: art.dataUrl,
          artifactPayload,
          tagsJson: JSON.stringify([req.modality, modelName.split(' ')[0]]),
          metadataJson: JSON.stringify(metadata),
          publishedToExplore: false,
        },
      });
      createdAssets.push(asset);
    }

    return { job, assets: createdAssets, oscuBalance: clampedBalance };
  });

  return result;
}
