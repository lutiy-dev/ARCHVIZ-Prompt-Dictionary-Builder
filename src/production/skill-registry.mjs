/** Bundled OVizLAB Skill Registry.
 * Source snapshot: lutiy-dev/GitHab-Skills @ 9b1715c3743a516d6a5c3bee86b0253ff20047d6
 * Metadata only. This module does not fetch, install or execute Skills.
 */
export const OVIZLAB_SKILLS_REPO='lutiy-dev/GitHab-Skills';
export const OVIZLAB_SKILLS_SHA='9b1715c3743a516d6a5c3bee86b0253ff20047d6';

const raw=[
 ['repository-auditor','GitHub Core','Inspect a GitHub repository for architecture, code health, documentation, automation, dependencies, licensing and security. Report evidence-backed KEEP/UPDATE/DISCARD decisions without destructive actions.'],
 ['pr-ci-verifier','GitHub Core','Review pull requests and continuous-integration evidence, identify minimal fixes, and distinguish passing automation from unverified runtime, security, accessibility and deployment behavior.'],
 ['pages-pwa-verifier','GitHub Core','Verify GitHub Pages, Cloudflare Pages and progressive web app deployment pipelines from source to built artifact and browser behavior, including paths, metadata, service worker and cache behavior.'],
 ['archviz-portfolio-director','Archviz & Portfolio','Plan and curate a premium commercial architectural visualization portfolio with verifiable project claims.'],
 ['archviz-shot-director','Archviz & Portfolio','Develop camera and visual storytelling shot briefs for photorealistic exterior render production.'],
 ['archviz-material-lookdev','Archviz & Portfolio','Guide physically plausible architectural material look-development in 3ds Max and Corona with repeatable material QA.'],
 ['archviz-atmosphere-lighting','Archviz & Portfolio','Direct realistic architectural light, weather, seasonal mood and environmental depth without altering architecture.'],
 ['archviz-ai-finishing','Archviz & Portfolio','Prepare reproducible masked AI finishing passes for Corona architectural renders with geometry safeguards.'],
 ['archviz-animation-director','Archviz & Portfolio','Design architectural camera movement and cinematic shot sequences for Unreal, 3ds Max or rendered animation.'],
 ['archviz-vfx-compositing','Archviz & Portfolio','Plan controlled architectural VFX and compositing such as weather, reflections, screen replacement and motion graphics.'],
 ['archviz-video-editing','Archviz & Portfolio','Edit an architectural showreel or project film with narrative pacing, clean transitions, deliverable checks and audio rights.'],
 ['portfolio-delivery-qc','Archviz & Portfolio','Validate stills, motion assets, metadata and presentation exports for a premium portfolio.'],
 ['h3-prompt-writing','Video Generation','Write MiniMax H3 video generation prompts for T2VA, I2VA, FL2VA, L2VA, and Ref2VA.'],
 ['3dsmax-maxscript','Production & Engineering','Create and audit 3ds Max MAXScript or pymxs automation with scene-safe, version-aware tests.'],
 ['archviz-geometry-guardian','Production & Engineering','Guard architectural geometry and proportions across Corona rendering, retouching and AI postproduction.'],
 ['comfyui-workflow-builder','Production & Engineering','Author version-aware importable ComfyUI workflow JSON with explicit model and node dependencies and reproducibility gates.'],
 ['creative-image-direction','Production & Engineering','Translate an art brief into controlled image-generation prompts, references, variations and critique checkpoints for commercial archviz.'],
 ['safe-implementer','Production & Engineering','Implement narrowly approved changes in an existing codebase while preserving existing behavior, configuration and a reversible rollback path.'],
 ['regression-guardian','Production & Engineering','Derive and verify platform-specific regression gates from previously confirmed working behaviors before accepting a change.'],
 ['android-release-verifier','Production & Engineering','Audit Android APK release readiness across Gradle, CI, signing continuity, in-place update compatibility and real-device QA.'],
 ['skill-maintainer','Production & Engineering','Evaluate third-party Codex skills for license, security, duplication and compatibility before adding a traceable, minimal skill to a controlled library.'],
 ['web-frontend-builder','Production & Engineering','Build accessible responsive websites and client portals with controlled design-system and browser checks.'],
 ['web3d-gltf-pipeline','Production & Engineering','Build and validate an architectural 3D-to-web pipeline from 3ds Max assets through GLB/glTF to an interactive site.'],
 ['codex-usage-guardian','Production & Engineering','Use when lower Codex token use, context overhead, repeated tool work, or quota consumption is requested while preserving task completion and required validation.'],
 ['browser-document-operator','Production & Engineering','Use for multi-step browser and document workflows: authenticated forms, PDFs, official applications, uploads, submission tracking, and approval-efficient execution with verifiable results.']
];

export const SKILL_REGISTRY=Object.freeze(raw.map(([id,category,description])=>Object.freeze({
 id,category,description,
 repository:OVIZLAB_SKILLS_REPO,
 path:`skills/${id}/SKILL.md`,
 sha:OVIZLAB_SKILLS_SHA,
 execution_allowed:false
})));

export function getSkill(id){return SKILL_REGISTRY.find(skill=>skill.id===id)||null;}

export function validateSkillPin(id){
 const skill=getSkill(id);
 if(!skill)return {status:'BLOCKED',reason:'UNKNOWN_SKILL',execution_allowed:false};
 const validRepo=skill.repository===OVIZLAB_SKILLS_REPO;
 const validPath=skill.path===`skills/${skill.id}/SKILL.md`;
 const validSha=/^[0-9a-f]{40}$/.test(skill.sha)&&skill.sha===OVIZLAB_SKILLS_SHA;
 if(!validRepo||!validPath||!validSha)return {status:'BLOCKED',reason:'PIN_METADATA_MISMATCH',execution_allowed:false};
 return {
  status:'SOURCE_PINNED_METADATA_VALIDATED',
  skill_id:skill.id,
  category:skill.category,
  repository:skill.repository,
  path:skill.path,
  sha:skill.sha,
  source_fetch_performed:false,
  execution_allowed:false,
  notice:'Pinned metadata matches the bundled canonical registry. Runtime discovery and Skill execution are NOT verified.'
 };
}
