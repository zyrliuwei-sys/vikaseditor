import type { TemplatePage } from '@/config/template-pages';

/** Distinct editorial guidance for the existing nine English template pages. */
export const TEMPLATE_EDITORIAL: Record<
  TemplatePage['id'],
  {
    introduction: string;
    changes: [string, string, string];
    skinTones: string;
    problems: [string, string, string];
  }
> = {
  'golden-hour': {
    introduction:
      'Golden Hour Hero suits a portrait that needs a clear subject and a believable outdoor setting. Start with a sharp photograph taken at eye level, with both eyes visible and room around the shoulders. The Mumbai street in the prompt is a creative setting, not a requirement to change the person’s identity. Replace it with a familiar lane if that tells your story better, and keep the light direction consistent across the face and background.',
    changes: [
      'Light: a low, warm source from one side adds shape to the cheeks and a gentle edge to the hair, while a little fill light keeps the opposite eye visible instead of burying half the face in darkness.',
      'Clothing and scene: the black leather jacket and old street create the film-portrait mood, but you can ask to retain your original outfit and use a quieter wall behind the shoulders to make the person the clear subject.',
      'Colour: amber highlights and restrained brown shadows warm the scene; the intention is to colour the surroundings and lighting, so ask for natural skin colour rather than an orange filter across the entire photograph.',
    ],
    skinTones:
      'Indian skin tones span a wide range of depths and undertones, so use the reference photo as the colour guide instead of requesting a generic complexion. For this warm look, add “preserve the person’s natural skin tone, with neutral facial midtones and warm sunlight at the edges.” If cheeks turn orange, reduce the amber grading before increasing brightness. To use a saree, replace the jacket instruction with the garment’s actual colour, fabric and border; otherwise the two clothing directions compete. A cream cotton saree and an emerald silk saree catch sunlight differently, so name the fabric and ask to retain its texture. Keep highlights on the forehead and gold jewellery soft, and inspect the eyes and nose before accepting the final portrait.',
    problems: [
      'Face does not match: use a closer, sharper reference and explicitly preserve the eyes, nose, jaw and age; remove instructions for a celebrity face or heavy beauty retouching that compete with identity.',
      'Background is too blurry: replace “shallow depth of field” with “moderate depth of field, readable street shapes”; keep the street secondary so signs and pedestrians do not overwhelm the portrait.',
      'Colours look grey: ask for warmer highlights and a slightly richer jacket, while keeping neutral skin midtones; avoid raising saturation everywhere, which can make a natural complexion look orange.',
    ],
  },
  'emerald-saree': {
    introduction:
      'Emerald Saree is built around fabric, jewellery and soft portrait light rather than a dramatic background. Choose a source photo where the face and shoulder line are clear. A visible pallu or neckline gives the model useful garment structure to preserve. The example green is a starting point: a specific weave, border and drape usually produces a more coherent edit than a long list of luxury adjectives or several conflicting outfit changes.',
    changes: [
      'Light: broad, soft illumination brings out facial detail and the folds of the saree without hard shadows, so the eyes stay readable and shiny jewellery does not become the brightest part of the composition.',
      'Clothing and scene: emerald fabric and restrained gold accessories supply the focal details; specifying a single border pattern and a simple backdrop helps preserve a recognisable drape instead of inventing overlapping layers of cloth.',
      'Colour: deep green provides contrast with warm gold, while the face should keep the reference photograph’s own undertone; reduce green reflected light on the chin if the saree starts tinting the skin.',
    ],
    skinTones:
      'Treat the face in your reference as the target, whether the complexion is light, medium or deep. Add “keep the original skin tone and texture; do not lighten the face” when a fashion prompt produces an overly pale result. Emerald fabric can cast green reflections under the chin, so request neutral soft light on the face and keep the green concentrated in the garment. Describe the saree you want in practical terms: silk or cotton, plain or patterned, narrow or broad gold border, and which shoulder carries the pallu. If the source already shows the desired drape, ask to preserve it. Use a lower jewellery emphasis when earrings or a necklace obscure the jaw. Compare hands, face and neckline for consistent colour before sharing.',
    problems: [
      'Face does not match: simplify jewellery and hair instructions, use a well-lit reference, and ask to retain facial proportions and age; elaborate styling should not replace the person’s own features.',
      'Background is too blurry: request a softly detailed studio wall or courtyard with moderate depth, rather than complete bokeh; keep the fabric border sharper than distant architectural details.',
      'Colours look grey: ask for a deep emerald saree with controlled gold highlights and neutral facial light; increase garment richness before changing exposure or saturation on the skin.',
    ],
  },
  'midnight-city': {
    introduction:
      'Midnight City turns a portrait into a night-street scene with cool signs and warm reflections. The source still needs a visible face: a nearly black photograph gives the model very little identity detail to work with. Choose one dominant sign colour and one secondary accent. A clean jacket outline and a few readable street shapes often feel more cinematic than filling every corner with glowing signs, smoke and lens flares.',
    changes: [
      'Light: cyan and magenta reflections create the night mood around the subject, while a neutral light on the face prevents bright signs from turning both eyes and cheeks into blocks of coloured illumination.',
      'Clothing and scene: the city backdrop adds shop fronts, pavement and distant traffic; retaining a simple outfit silhouette gives the model fewer opportunities to merge sleeves, hair and background signage into one shape.',
      'Colour: cool shadows sit beside selective warm or pink highlights, but a small area of neutral colour in the face helps the scene read as a night portrait rather than a completely blue photograph.',
    ],
    skinTones:
      'Neon is reflected light, not a reason to replace the person’s complexion. Start by asking for natural skin midtones matching the reference, then allow cyan or magenta only along the edges of the face. On deeper skin, request visible detail in the shadow cheek rather than a brighter overall complexion. On lighter skin, reduce clipped highlights on the nose and forehead. For a saree version, name one fabric colour and keep the pallu separated from the street lights; dark blue fabric against blue neon may need a subtle warm edge light. Preserve the original blouse neckline and border pattern if they are visible in the reference. Check that hands receive the same lighting treatment as the face, especially near a phone or bag.',
    problems: [
      'Face does not match: remove fog and strong neon from the facial area, then use a sharper reference and ask for the original eye shape, jawline and age under neutral facial light.',
      'Background is too blurry: specify recognisable street geometry, a few defined shop fronts and moderate depth of field; avoid demanding sharp lettering on every sign, which can distract from the person.',
      'Colours look grey: choose one clear cyan or magenta light source and preserve deep blacks in the surroundings; increasing all colours together can muddy the face and flatten the night scene.',
    ],
  },
  'diwali-glow': {
    introduction:
      'Diwali Glow combines a festive portrait with diyas, marigolds and warm evening light. Begin with a photo where the face and hands are visible, especially if you want the person to hold a lamp. Keep the greeting or family message separate from the generated picture so spelling stays under your control. For a Diwali video idea, first create and review a still, then use a gentle push-in with small flame movement in the photo-to-video studio.',
    changes: [
      'Light: warm lamps brighten the lower edges of the scene, but a soft light near face level keeps the eyes visible and avoids the exaggerated upward shadows that can make a festive portrait look unsettling.',
      'Clothing and scene: a crimson saree, marigold decoration and a few diyas suggest a celebration without filling every surface; preserve the garment’s drape and leave breathing room around hands, lamps and jewellery.',
      'Colour: red fabric, orange flowers and gold light form the palette, while natural skin tones and a slightly darker background prevent the entire frame from becoming a single flat orange wash.',
    ],
    skinTones:
      'Warm diyas can push any complexion towards orange, so ask for the original skin tone with soft neutral fill on the face and warm accents from the lamps. Do not use “fair skin” as a substitute for good exposure. For deeper skin, preserve detail in the shadow side and avoid brightening the whole face to match the flame. Describe your saree’s actual fabric, border and drape, whether crimson silk, mustard cotton or another choice, and remove the default crimson instruction if you change it. Keep gold jewellery below the brightness of the eyes. When a lamp is held, check that both hands match the face and that fingers do not merge with the diya. Use the finished image as a checked starting frame for subtle video motion.',
    problems: [
      'Face does not match: reduce ornate jewellery and flower placement near the face, supply a clearer reference, and ask to preserve facial proportions; keep the diya below the chin rather than in front of it.',
      'Background is too blurry: request a small number of recognisable diyas and marigold strands at moderate depth; removing excessive bokeh makes the festival setting clearer without sharpening every distant light.',
      'Colours look grey: strengthen the crimson fabric and warm lamp highlights separately, while preserving neutral skin midtones; avoid stacking a faded-film treatment over an already dim festive scene.',
    ],
  },
  'sunset-together': {
    introduction:
      'Sunset Together works best from a single photograph containing both people, with separate, visible faces. Similar camera distance and lighting help the two subjects remain part of the same scene. Decide whether you want a quiet beach, an open terrace or a simple horizon before adding outfit details. This is a couple-portrait direction, so preserve the relationship between the poses instead of asking the model to invent a complex embrace or move every hand.',
    changes: [
      'Light: low evening light outlines both people and gives the scene depth, while gentle front fill keeps each face visible so one partner does not disappear into silhouette beside a much brighter face.',
      'Clothing and scene: a calm horizon and coordinated but distinct outfits keep the pair central; retaining each person’s original pose and leaving space between their arms reduces merged hands and fabric.',
      'Colour: peach and amber tones connect sky and surroundings, with quieter clothing colours beneath them; the two faces should retain their individual complexions instead of being forced into the same skin shade.',
    ],
    skinTones:
      'A couple may have different skin tones and undertones, and the edit should preserve that difference. Ask to match each person’s complexion to the reference separately, with the same direction of evening light on both faces. If one face becomes too dark, request local fill light rather than lightening both people. For a saree, describe its colour and fabric and keep the pallu clear of the other person’s hands. If the partner wears a kurta or jacket, name that outfit separately so garment instructions do not mix. Avoid asking for identical glowing skin or heavy smoothing. Check the exposed arms and hands as well as the faces, and keep the sunset slightly less bright if it is causing pale, washed-out edges around the subjects.',
    problems: [
      'Faces do not match: use a reference with both faces sharp and unobstructed, name the left and right person separately in the instruction, and avoid asking for a completely new pose at the same time.',
      'Background is too blurry: request a readable horizon and a few defined shoreline or terrace details with moderate depth; too many soft light effects can remove the sense of a shared place.',
      'Colours look grey: add gentle peach highlights to the sky and keep clothing colours distinct, while preserving each complexion; avoid a global faded filter that lowers contrast on both faces.',
    ],
  },
  'pink-editorial': {
    introduction:
      'Pink Editorial is the page name for the look displayed as Spotlight in the template picker. Both names refer to this same style and the same unchanged URL. A strong pink backdrop, clean pose and controlled fashion lighting give it a magazine-portrait feel. Use a source with clear eyes and an uncluttered shoulder line, then decide whether to keep the original clothes or deliberately replace one garment before adding accessories.',
    changes: [
      'Light: broad studio light gives the face an even, readable shape, with a small directional highlight for definition; keeping this controlled is more useful than requesting several spotlights that create conflicting facial shadows.',
      'Clothing and scene: a pink studio setting and a confident fashion pose replace a busy everyday background; a single clear outfit description helps retain a plausible neckline, sleeve shape and shoulder position.',
      'Colour: saturated pink surrounds the person, but the face needs neutral midtones and distinct lip colour; reducing pink spill on the cheeks keeps the editorial palette from looking like a coloured skin filter.',
    ],
    skinTones:
      'Pink backdrops can reflect colour onto the skin, so ask for a neutral facial light and the person’s original complexion rather than “pink glowing skin.” For deeper tones, keep soft highlights on the cheekbones while preserving the depth of the shadows. For lighter tones, avoid blending the face into a pale pink background. A saree adaptation works best with a specific fabric and one defined border; describe how the pallu sits over the shoulder instead of adding several competing draping instructions. If you want to keep a printed saree, request that the original pattern remain visible and use a simpler background. Limit beauty retouching to temporary distractions, and check the jaw, eye shape and skin texture against the reference before accepting the Spotlight edit.',
    problems: [
      'Face does not match: remove requests for a model-like face and dramatic beauty retouching, keep the original eye and jaw shapes, and choose a source photograph with clear features rather than a tiny social thumbnail.',
      'Background is too blurry: a studio wall can be smooth without being out of focus; ask for a clean pink surface with a controlled shadow and crisp subject edges instead of heavy bokeh.',
      'Colours look grey: specify a rich pink background and neutral skin exposure, then reduce any matte or faded-film instruction; keep fabric and lips distinct rather than applying magenta to every surface.',
    ],
  },
  'cinematic-push': {
    introduction:
      'Cinematic Push is a photo-to-video direction: the camera moves gently towards a largely still subject. Begin with a finished portrait you already like, because camera motion will not repair a distorted face or hand. The still examples here illustrate suitable starting frames rather than playable videos. A five-second clip is easier to control when the push-in is the main action and the person makes only a small, natural movement.',
    changes: [
      'Light: the original portrait lighting should remain stable during the camera move, with only subtle environmental variation; asking for a new lighting setup halfway through the shot can cause facial brightness and identity to drift.',
      'Clothing and scene: a slow camera approach adds motion without replacing the outfit or location, so keep the shoulder line, saree border and background geometry fixed while allowing only small movement in loose fabric.',
      'Colour: the finished clip should carry the starting image’s palette from beginning to end; request consistent white balance and exposure to avoid a warm opening frame turning cold or washed out as the camera approaches.',
    ],
    skinTones:
      'Prepare the skin colour in the still image before animating it. Ask the video prompt to preserve the reference complexion and lighting throughout the shot rather than adding a new beauty or skin-lightening effect. For deeper skin tones, a clear, gently lit starting face is more reliable than asking the animation to recover detail hidden in darkness. If the person wears a saree, keep the border, blouse and drape unchanged and limit fabric motion to a slight breeze at the loose edge. Avoid a large turn that exposes areas absent from the source photograph. Use a slow push-in with no face reshaping, and compare the first and last frames for changes in cheeks, hands, jewellery and garment colour before keeping the clip.',
    problems: [
      'Face does not match: start from a sharper approved portrait, reduce head movement and camera travel, and ask to preserve identity in every frame; a subtle push is safer than combining a zoom with a large turn.',
      'Background is too blurry: begin with a source that contains useful background detail and request a gentle push with stable focus; motion cannot reliably reconstruct architecture that was already blurred in the still.',
      'Colours look grey: ask for constant exposure and the original colour grade across the full clip; remove fading or dramatic relighting instructions that flatten the image as the camera moves forward.',
    ],
  },
  'night-drive': {
    introduction:
      'Night Drive uses passing city reflections to animate a night portrait. It is a visual scene, not a demonstration of safe driving behaviour, and a stationary passenger-style composition gives the model a simpler starting point. Select an image with a clear face and a believable window edge. Keep motion in the reflected lights and distant street rather than asking the person, vehicle and camera to perform several large actions simultaneously.',
    changes: [
      'Light: moving reflections cross the surrounding window and clothing while the face stays readable under a steady soft source, so the clip feels nocturnal without repeatedly hiding the eyes behind bright streaks or darkness.',
      'Clothing and scene: a restrained city-at-night setting supplies glass, distant traffic and passing lights; preserving the pose and garment outline helps prevent seat edges, jewellery and reflections from merging into the person.',
      'Colour: cool blue surroundings and selective warm road lights create contrast, while stable facial midtones keep the person recognisable; rapid changes between green, red and purple can make the skin look inconsistent frame to frame.',
    ],
    skinTones:
      'Begin with a night image where the person’s natural complexion is still visible. Ask for a constant neutral fill on the face and moving coloured reflections on the window instead of across the entire skin surface. For deeper tones, lift detail only in the shadowed features; avoid a blanket request for lighter skin. A saree can work in this setting if its border and pallu are clearly separated from the seat and window. Name the fabric colour and request that it stay consistent as lights pass, especially when dark green cloth could blend into the background. Keep loose fabric motion minimal inside the scene. Review several frames for sudden colour changes on the hands and face, and reduce the reflection intensity if they obscure facial features.',
    problems: [
      'Face does not match: reduce the speed and brightness of reflections over the face, keep the head mostly still and use a clearer starting image; moving light should change the atmosphere rather than reshape features.',
      'Background is too blurry: ask for a stable window frame and a few readable street shapes with subtle motion, not extreme light trails; the source image must already contain the structure you want to retain.',
      'Colours look grey: preserve a defined cool background and a small warm accent while holding facial exposure constant; remove heavy fog or faded-film instructions that turn every reflection into a dull haze.',
    ],
  },
  'living-memory': {
    introduction:
      'Living Memory adds restrained motion to a photograph that already matters to you. Choose a clear scan or a well-lit digital original, and preserve its age, clothes and setting rather than treating it as a fashion makeover. The aim is a gentle sense of movement, such as a small smile or a slight breeze. The examples are still starting-frame references; generated motion is an interpretation and does not document something that actually happened.',
    changes: [
      'Light: soft illumination should stay close to the source photograph, with no dramatic new shadows crossing the face; stable lighting helps an animated memory retain the familiar appearance of the original person and moment.',
      'Clothing and scene: the original outfit and setting carry much of the photograph’s meaning, so preserve their shapes and allow only small movement instead of replacing a familiar room, saree or hairstyle with a new scene.',
      'Colour: a gentle warm treatment can unify an old image, but retain believable garment colours and natural facial variation; aggressive colourisation or a heavy nostalgic filter can remove the details that make the photograph recognisable.',
    ],
    skinTones:
      'Use the best available reference for the person’s actual complexion, especially when an old print has a yellow cast or faded colour. If you have no reliable colour reference, keep the original monochrome treatment rather than guessing a skin tone. For colour photographs, request the same complexion, age and visible skin texture throughout the animation; do not use smoothing to erase features that identify the person. Preserve the saree’s existing drape, border and blouse instead of replacing them with a modern pattern. Small movement at a loose fabric edge is enough for a quiet scene. Keep the face mostly facing its original direction, and compare the opening and closing frames with the source for changes in expression, eye shape, hands and jewellery.',
    problems: [
      'Face does not match: choose a clearer scan, retain the person’s age and original expression, and reduce animation to a subtle smile or blink; avoid combining restoration, a new pose and strong movement in one request.',
      'Background is too blurry: retain the source room or landscape with minimal camera motion and moderate focus; if the original is damaged, prepare a clearer still before asking for an animated interpretation.',
      'Colours look grey: distinguish intentional monochrome from faded colour, then request a restrained correction only where a reliable reference exists; excessive saturation can invent garment and skin colours that were never in the photograph.',
    ],
  },
};
