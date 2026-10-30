import { NextResponse } from 'next/server';
import { getAuthenticatedWorkspaceContext } from '@/lib/auth';

export async function POST(req: Request) {
  const ctx = await getAuthenticatedWorkspaceContext(req);
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const action = String(body.action || 'spark_prompt');
  const prompt = String(body.prompt || '').trim();
  const modality = String(body.modality || 'image');

  if (action === 'spark_prompt') {
    const base = prompt || 'Isometric dark fantasy arcane relic';
    const enhancements: Record<string, string> = {
      image: `${base}, masterwork game concept art, stylized hand-painted PBR materials, rim lighting, subsurface scattering, crisp silhouette, Unreal Engine 5 quality, 8k`,
      video: `${base}, smooth 60fps orbital camera movement, volumetric fog, dynamic particle embers, cinematic color grading`,
      '3d': `${base}, watertight manifold 3D game asset, symmetrical T-pose/orthographic alignment, clean quad topology, 4K PBR Albedo/Normal/Roughness maps`,
      audio: `${base}, studio-grade spatial game audio, crisp transient response, zero background noise, loop-ready envelope`,
      texture: `${base}, 100% seamless X/Y tileable surface texture, uniform orthographic lighting, zero directional shadows, high-frequency micro-normal detail`,
      skybox: `${base}, 360-degree equirectangular panorama, seamless horizon line, HDRI dynamic range lighting`,
    };
    return NextResponse.json({
      enhancedPrompt: enhancements[modality] || enhancements.image,
    });
  }

  return NextResponse.json({
    reply: `Scenario Agent (${ctx.project.name}): For "${prompt || 'your asset pipeline'}", I recommend starting with **FLUX.1 Dev** or a **Composed LoRA** in Image Studio, isolating the background with **PhotoRoom Background Removal**, and piping the output into **Hunyuan3D 2.5** or a **Workflow App** for batch production.`,
  });
}
