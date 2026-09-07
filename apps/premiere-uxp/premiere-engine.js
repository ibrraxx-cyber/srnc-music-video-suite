const app = require("premierepro");

function ticksFromFrames(frames, timebase) {
  return app.TickTime.createWithFrameAndTickTime ? app.TickTime.createWithFrameAndTickTime(frames, 0) : null;
}

async function getContext() {
  const project = await app.Project.getActiveProject();
  if (!project) throw new Error("No active Premiere project.");
  const sequence = await project.getActiveSequence();
  if (!sequence) throw new Error("No active sequence.");
  return { project, sequence };
}

async function getSelectedClips(sequence) {
  const selected = [];
  const trackCount = await sequence.getVideoTrackCount();
  for (let i = 0; i < trackCount; i++) {
    const track = await sequence.getVideoTrack(i);
    const items = track.getTrackItems(app.Constants.TrackItemType.CLIP, false);
    for (const item of items) {
      if (item.isSelected) selected.push(item);
    }
  }
  return selected;
}

async function inspectSelection() {
  const { sequence } = await getContext();
  const clips = await getSelectedClips(sequence);
  return { sequenceName: sequence.name, count: clips.length };
}

async function applyNativeComponentKeyframes(componentParam, values) {
  if (!componentParam || !(await componentParam.areKeyframesSupported())) return false;
  const keyframes = [];
  for (const point of values) {
    const key = componentParam.createKeyframe(point.value);
    key.position = point.time;
    keyframes.push(key);
  }
  for (const key of keyframes) {
    const action = componentParam.createAddKeyframeAction(key);
    await action.perform();
  }
  return true;
}

async function applyPreset(preset, controls = {}) {
  const { project, sequence } = await getContext();
  const clips = await getSelectedClips(sequence);
  if (!clips.length) throw new Error("Select at least one video clip in the timeline.");

  // v0.2 establishes the real host connection and selection validation.
  // Effect-specific mappings are kept declarative until the installed Premiere
  // effect match-names/parameter layouts are detected on the target machine.
  const result = {
    presetId: preset.id,
    kind: preset.kind,
    selectedClips: clips.length,
    sequence: sequence.name,
    controls,
    nativeApi: true,
    applied: false,
    reason: "Preset recognized; effect mapping will be resolved from installed components."
  };

  await project.save();
  return result;
}

module.exports = { getContext, getSelectedClips, inspectSelection, applyPreset, applyNativeComponentKeyframes };
