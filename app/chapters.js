/* Story chapters: AI-written fun summaries of library papers, 4-6 screen pages
   each. Method: numbers and chemistry from the cited papers; scenes and
   dialogue imagined and labelled so. New chapters append here; papers.js
   links them with story:'key'. */
const CHAPTERS = {
'lost-city': {
  title: 'The City That Should Not Exist',
  sub: 'The alkaline vent field that may be where life began — from Kelley et al., 2008 and Martin et al., 2008.',
  minutes: 12,
  paper: 'Kelley et al., 2008, Science — abiotic organics at Lost City',
  also: 'Martin et al., 2008, Phil. Trans. R. Soc. B — the alkaline-vent origin of life',
  level: 'active research',
  pages: [
    { h: 'The wrong postcard',
      kick: 'December 2000, halfway down the Atlantic.',
      paras: [
      'The crew of the submersible Alvin sank toward the Atlantis Massif expecting the usual postcard: black smokers — chimney stacks belching 350-degree, metal-black water over fresh lava. What the floodlights found instead was white. Towers of pale carbonate, one of them sixty metres tall, rising off rock a million and a half years old. Nothing in the textbooks said vents were allowed to look like that, or to live there.',
      'They named the field Lost City, after the towers. The tallest spire, Poseidon, would loom over a fifteen-storey building. And the strangest measurement of the day was not the size but the address: fifteen kilometres west of the Mid-Atlantic Ridge, far from any magma. Whatever was powering this place, it was not a volcano.',
      'A vent field with no volcano, of a colour no vent was supposed to be, still running after at least thirty thousand years. Somebody was going to have to rewrite the chapter — and then somebody noticed what the water was carrying.'] },
    { h: 'No magma, no problem',
      kick: 'The engine is rock drinking the sea.',
      paras: [
      'Beneath Lost City there is no magma chamber. There is mantle — dense green olivine rock, normally buried kilometres down, exposed here by faulting. Seawater seeps in, and the rock reacts with it in a process called serpentinization: olivine plus water becomes serpentine plus magnetite plus heat plus hydrogen gas. The mountain is rusting, and the rust reaction warms the water to a mere 40 to 90 degrees — hot-tub water, not furnace water.',
      'That mild fluid comes out radically transformed: pH 9 to 11, about as alkaline as household ammonia, loaded with dissolved hydrogen and methane. Every other known vent field is acidic; Lost City is a soda spring on the seafloor. The white towers are the fluid turned to stone — calcium carbonate precipitating where alkaline vent water meets normal seawater, plus brucite, growing a centimetre or so of new city whenever chemistry feels like it.',
      'So the checklist reads: warmth without magma, hydrogen without biology, towering mineral walls full of pores and chambers. If you were designing a cradle for chemistry, you could do worse. A few theorists started saying exactly that.'] },
    { h: 'The factory',
      kick: 'Kelley, 2008: the vents cook without life.',
      paras: [
      'The 2008 Science paper asked the blunt question: is anything organic down there actually made by the vent, rather than by the microbes living in it? The team measured formate, acetate, methane and hydrogen pouring out of the field at rates unseen at ordinary black smokers — and showed the chemistry adds up abiotically. Under Lost City conditions, dissolved carbon dioxide plus hydrogen reduces to simple organics with no enzyme and no cell involved.',
      'This matters because those four molecules are not random. Formate and acetate sit at the very root of the oldest known carbon-fixing metabolism, the acetyl-CoA pathway still used by deep-branching microbes today. The vent was manufacturing the exact feedstocks that the most ancient biochemistry eats.',
      'Lost City, in other words, is not just a heater with scenery. It is a chemical factory running the first half of metabolism for free, continuously, for tens of millennia — the wholesale supplier to whoever wanted to become alive. Which raised the heretical question: what if somebody did?'] },
    { h: 'The heresy',
      kick: 'Martin, 2008: life began in a place like this.',
      paras: [
      'The rival story most people know is the warm little pond: lightning, volcanoes, a surface puddle brewing. Martin and colleagues argued the pond has a fatal accounting problem — condensing building blocks into polymers in open water costs energy, and there is no cashier. A vent has one. Picture the porous carbonate walls: alkaline fluid inside at pH 11, Hadean ocean outside, mildly acidic. Across every thin mineral wall stands a permanent proton gradient — the same gradient every living cell on Earth today maintains across its membrane to make its energy currency.',
      'The proposal: the gradient came first, biology second. Mineral compartments concentrated the vent-made organics; iron-sulphur minerals in the walls catalysed reactions the way enzymes would later; and the proton motive force — the universal battery of all life — was simply inherited from geology. Proteins did not invent the battery. They moved into a building that already had wiring.',
      'It is still hypothesis, honestly labelled. Ponds have their own new evidence. But notice what the vent story explains for free: why all life runs on proton gradients, why the oldest metabolism eats exactly what vents exhale, and why the core of the genetic code looks forged in alkali. Three coincidences is a lot.'] },
    { h: 'Your turn',
      kick: 'Replay the hypothesis in the sandbox.',
      paras: [
      'The Hadean world is this chapter, playable. Paint a Vent in a rock basin and it holds near 90 degrees without any sun — Lost City numbers, capped so clustered vents cannot cheat. Meltwater gathers; the ticker notes the white smokers laying limestone as the fluid mineralises, the same carbonate Towers, one tile at a time.',
      'Then the long game. Salt the pool into brine so it survives the heat, dome it against the sulfur sky, and wait. No lightning, no flask, no sparks: the pool seeds germs by itself, rarely, the way the hypothesis says — warm water, minerals, time. The Genesis problem wants a hundred of them.',
      'Thirty thousand years of real vent, compressed into your evening. Darwin called it a warm little pond; this chapter bets it was a white little tower. Run both hypotheses — the pond is Earth, the tower is Hadean — and see which garden you prefer.'] },
  ],
  experiment: { title: 'Replay it: Genesis in the Hadean',
    steps: ['Open the Hadean world and paint a VENT in a dug rock basin.',
    'Let it melt a pool, then paint SALT in until the water reads brine.',
    'Cover the pool with a DOME and wait for the Genesis journal note.',
    'Watch the rim: white-smoker tiles turn pool-edge water to limestone.'] },
  sources: [
    'https://www.whoi.edu/oceanus/feature/lost-city-pumps-life-essential-chemicals-at-rates-unseen-at-typical-black-smokers/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2442388/'],
  dramatized: 'Dive dialogue and the “cashier” metaphor are imagined. Temperatures (40–90°C), pH (9–11), the 60-m Poseidon spire, ≥30,000 years of activity, and the abiotic formate/acetate/methane results are from the papers.'
},
'europa-abyss': {
  title: 'The Sea Under the Ice',
  sub: 'Europa hides a salty ocean beneath chaos terrain — from Galileo magnetometry and Hubble plume spectra.',
  minutes: 10,
  paper: 'Galileo magnetometer team — an induced field betrays a deep salty conductor',
  also: 'Hubble plume spectra — water vapour venting off the trailing hemisphere',
  level: 'active research',
  pages: [
    { h: 'The cracked egg',
      kick: 'Europa, photographed up close: red-brown cracks on dirty ice.',
      paras: [
      'The first close pictures looked like a cracked egg drawn on by a child. Dark red-brown lines thousands of kilometres long — the lineae — cross and recross a shell of dirty water ice, with patches of chaos terrain where the crust seems shattered into bergs and refrozen slush. Something below is moving. Ice does not crack itself.',
      'The giveaway came not from cameras but from a magnetometer. As Jupiter’s field sweeps past, Europa answers with an induced field of its own — the signature of a deep, salty, electrically conducting layer. Rock cannot do that. A globe-spanning salty ocean can. The cracks are the roof shifting over a sea.'] },
    { h: 'How deep the dark goes',
      kick: 'Fifteen kilometres of ice, then sixty of ocean.',
      paras: [
      'Best estimates put the ice shell at roughly fifteen to twenty-five kilometres thick, and the ocean below at sixty to one hundred and fifty deep — holding perhaps twice the water of all Earth’s oceans, in permanent darkness, under crushing pressure. The seafloor is rock, and rock plus water plus time is the oldest recipe there is.',
      'The surface still talks to the deep. Double ridges may mark water squeezing up through cracks; Hubble caught vapour plumes venting off the trailing hemisphere. If plumes sample the ocean, a flyby can taste the abyss without drilling a metre. That is the bet behind every future mission.'] },
    { h: 'What powers the dark',
      kick: 'No sun — so tides and chemistry split the bill.',
      paras: [
      'Sunlight never reaches the ocean, so something else must pay for chemistry. Jupiter provides the first half: tides knead Europa’s interior on every orbit, and tidal friction warms rock that may host seafloor vents — black-smoker country without the sunlit sea above it.',
      'Radiation pays the second half. Jupiter’s belts sandblast the surface ice, splitting water into oxygen and peroxide that ride the cracking crust downward over millions of years. A dark ocean with oxygen snow falling from the roof is not Earth’s ocean — but it is an ocean with both fuel and rust, and life is picky about little else.'] },
    { h: 'Why brine matters',
      kick: 'Salt is antifreeze, and Europa is full of it.',
      paras: [
      'Pure water freezes at zero, but Europa’s ocean is thought to be a magnesium-sulfate and sodium-chloride brine — and dissolved salt cheats the freezing point downward by tens of degrees. Brine stays liquid where fresh water would be rock. On a moon whose surface sits near minus 160, that chemistry is the difference between an ocean and a paperweight.',
      'The sandbox honours it: salt plus water makes brine, germs detox it, and brine pools survive cold that kills fresh water. Melt chaos ice with heaters and the pool you get behaves like the moon’s own — liquid far below zero, waiting for something to swim in it.'] },
    { h: 'Your turn',
      kick: 'Replay the moon in the sandbox.',
      paras: [
      'The Europa world is this chapter, playable. Five heaters over the ice bedrock hold open water at brutal ambient cold — one heater makes only slush, exactly as the heat budget says. Salt the pool into brine, dome it, and plant moss in the hothouse. Nothing about the setup is forgiving, which is the point: Europa does not want you there.',
      'Then the long game. Sponges filter the pool, algae greens it, and if you are patient, fish graze the algae — a three-level food web under an ice sky. A dedicated orbiter is en route to taste the real plumes this decade. Your pool is practice.'] },
  ],
  experiment: { title: 'Replay it: an abyss in miniature',
    steps: ['Open the Europa world and set five heaters over flat ice until a pool holds.',
    'Paint SALT into the pool until the water reads brine, then cover it with a DOME.',
    'Plant ALGAE, then FISH, and watch the hunt journal note when grazers feed.',
    'Try painting moss with one heater only — and read the warning the game gives you.'] },
  sources: [
    'https://en.wikipedia.org/wiki/Europa_(moon)'],
  dramatized: 'The “cracked egg” framing and “oxygen snow” metaphor are imagined. Ice-shell thickness (~15–25 km), ocean depth estimates, the induced magnetic field, lineae and chaos terrain, tidal heating, radiolytic oxidants, and plume detections are from the cited literature.'
},
'titan-haze': {
  title: 'The Moon That Rains Gasoline',
  sub: 'Titan sculpts ice with liquid methane — from Cassini RADAR seas and the Huygens landing, 2005.',
  minutes: 11,
  paper: 'Cassini-Huygens, ESA/NASA — Huygens surface package, 2005',
  also: 'NASA New Frontiers — Dragonfly rotorcraft to Titan, arriving mid-2030s',
  level: 'established science',
  pages: [
    { h: 'An orange marble',
      kick: 'Bigger than Mercury, thicker air than Earth.',
      paras: [
      'Through a telescope Titan is a disappointment: a smooth orange ball, no craters, no seas, no detail at all. That blandness is the thickest atmosphere of any moon — nitrogen like Earth’s, laced with a few percent methane, pressing down at 1.5 bar. Sunlight cannot reach the ground; it dies in the haze, cooking methane into a permanent orange smog of complex organics called tholins.',
      'Voyager 1 detoured past in 1980 and bounced off the same curtain. For a quarter century Titan was chemistry inferred from orbit: lakes suspected, rain modelled, surface unseen. Then Cassini arrived carrying a guest — a small European probe named Huygens with a one-way ticket down through the smog.',
      'Nobody had ever landed blind on a world this alien. The parachute sequence ran on a timer, the batteries held two hours, and the target was a dark plain near the equator that radar hinted might be damp. On 14 January 2005, Huygens dropped into the orange and started reporting.'] },
    { h: 'Splashdown on ice',
      kick: 'Cobbles in a dry riverbed, minus 180 degrees.',
      paras: [
      'Two and a half hours under parachute, through cloud decks of methane rain that never reaches the ground — the lowest air is too dry, so droplets evaporate mid-fall, virga on another world. Then the surface: not rock but water ice, hard as granite at minus 180, strewn with rounded cobbles of ice photographed sitting in braided, dried riverbeds.',
      'Rounded stones mean tumbling water — except the liquid was methane, raining from methane clouds into methane rivers, flash-flooding and drying the way desert washes do on Earth. Huygens even measured the landing site’s dampness: the ground had been wet recently, then dried. A weather report from the outer solar system.',
      'One heater in the sandbox tells the same story in miniature: on Titan, ambient cold wins every budget you do not double. The moon’s own numbers are minus 180 at the surface, colder than dry ice, with water-ice bedrock doing the structural job that basalt does here.'] },
    { h: 'Seas of lighter fluid',
      kick: 'Kraken Mare is bigger than the Caspian Sea.',
      paras: [
      'Cassini’s radar pierced the haze and found what Huygens could not see: polar basins of smooth, radar-dark liquid hundreds of kilometres wide. Kraken Mare sprawls over some 400,000 square kilometres; Ligeia and Punga Mare join it. Depth soundings bounce off a sea of liquid methane and ethane, with river valleys feeding in and rain clouds gathering overhead — a full water cycle with no water in it.',
      'Around the equator, where seas never reach, the wind has built something stranger: dune fields of dark organic sand, grains of solid hydrocarbons marching for thousands of kilometres. The dunes, the rivers, the seas and the rain are one machine, driven by Saturn’s seasons on a 29-year clock.',
      'The sandbox honours the substitution honestly: our oil seas stand in for liquid methane, and pumice sails them because the physics of floating is the same. Nothing drinks here but the scenery — at minus 180, chemistry naps. Which raises the obvious question: could anything ever wake it?'] },
    { h: 'The prebiotic kitchen',
      kick: 'Hydrogen cyanide falls from the sky for free.',
      paras: [
      'Up in the haze, ultraviolet light and Saturn’s radiation smash nitrogen and methane into hydrogen cyanide, acetylene and benzene — the feedstocks of prebiotic chemistry, manufactured at industrial scale and rained onto the surface. Titan is running the Miller-Urey experiment as weather, and has been for aeons. The dunes may be deep in the complex organics life would need.',
      'What Titan lacks is the second ingredient: liquid water at the surface. But impact melt and possible cryovolcanoes can mix water with organics briefly, and a deep subsurface water ocean is strongly suspected. Every mixing event is a fresh origin-of-life experiment, flash-frozen mid-run.',
      'That is why Dragonfly is going. NASA’s nuclear rotorcraft will hop between dune fields and crater floors in the mid-2030s, tasting organics where water once mixed with them — field geology by drone, on a moon that rains fuel. Until it lands, the dunes keep their secret.'] },
    { h: 'Your turn',
      kick: 'Replay the haze in the sandbox.',
      paras: [
      'The Titan world is this chapter, playable. Paint the oil seas and sail pumice across them — a stand-in for methane you can push with your pointer. The bedrock is ice, the sky is orange, and one heater buys only slush: Oasis wants twenty tiles of open water, and the ambient takes the first heater as tribute.',
      'Then the long game. Two heaters under a dome, a sprinkler, and moss in the Hothouse — forty of them, the only green for a billion kilometres. Pin suns to glass the dunes like Dragonfly’s landing site, and smelt gold from the ore, because even practice colonies need funding.',
      'Titan does not want you there and never will. That is precisely why the Huygens team went. Run their descent in miniature — and read the journal when your first pool holds.'] },
  ],
  experiment: { title: 'Replay it: a hothouse at minus 180',
    steps: ['Open the Titan world and paint an OIL sea, then sail PUMICE across it with the pointer.',
    'Set two heaters under a DOME with a sprinkler and plant MOSS until Hothouse reads forty.',
    'Pin SUNS over dune sand until Sun glass reads vitrified — Dragonfly glass.',
    'Try the same pool with one heater only, and read the warning the game gives you.'] },
  sources: [
    'https://en.wikipedia.org/wiki/Titan_(moon)',
    'https://science.nasa.gov/mission/dragonfly/'],
  dramatized: 'The “virga report” framing and “tribute” metaphor are imagined. Atmospheric pressure (1.5 bar), Huygens descent time and cobble photographs, Kraken Mare’s scale, dune composition, tholin chemistry, and Dragonfly’s planned mid-2030s arrival are from the cited sources.'
},
};
