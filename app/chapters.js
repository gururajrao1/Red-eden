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
'venus-furnace': {
  title: 'The Twin That Boiled',
  sub: 'Venus may have held oceans for billions of years — from the Venera landings and climate modelling.',
  minutes: 11,
  paper: 'Venera 9-14 + VEGA, USSR, 1975-1985 — surface photography under 92 bar',
  also: 'Way & Del Genio and successors — a temperate early Venus, then runaway',
  level: 'established science',
  pages: [
    { h: 'The morning star lies',
      kick: 'Same size as Earth, spinning backwards.',
      paras: [
      'Venus is almost Earth’s twin in mass and size, wrapped in clouds so bright they cast shadows on a moonless night. For centuries astronomers drew jungles under those clouds. The clouds turned out to be concentrated sulfuric acid riding hundred-metre-per-second winds, and the surface had never been seen by any telescope at all.',
      'The Soviet Venera programme went to look in person. One probe after another dropped through the acid decks through the 1970s, most dying on the way down. Then Venera 9 landed in 1975 and switched on its camera: cracked basalt plains under an orange sky, pebbles with edges too sharp for any river. Then, like every lander after it, it started dying.',
      'The numbers on the telemetry were the shock. Around 460 degrees at the surface — hotter than a pizza oven, day and night, poles and equator. Pressure like a kilometre under the sea. Nothing built for Earth survives there; the longest-lived lander, Venera 13, managed just over two hours.'] },
    { h: 'An hour on the surface',
      kick: 'Two hours to photograph eternity.',
      paras: [
      'Imagine the landing ellipse as a work shift. The parachute melts away in the heat and the lander free-falls the last stretch, thumping into basalt. Cameras pan, drills bite, spectrometers sniff: rock like Earth’s ocean floor, air that is nearly all carbon dioxide, light filtered orange through the acid haze. Then seals soften, circuits drift, and the signal thins into noise.',
      'Every Venus surface fact we own was bought inside one of those shifts. The rocks, the temperature, the crushing pressure, the yellowish sky — all of it comes from a handful of Soviet panoramas and a few hours of chemistry. No rover has ever driven there. No sample has ever come home.',
      'The sandbox honours the hostility honestly: the Venus world runs at the true 460-degree ambient, water boils on contact, and life is simply impossible. It is the only world in the game with no biology quests at all — a kiln with weather.'] },
    { h: 'The ocean that left',
      kick: 'Venus may have been blue for billions of years.',
      paras: [
      'Here is the twist the models insist on. Venus gets nearly twice Earth’s sunlight, but a young, fast-spinning Venus with an ocean may have grown a permanent dayside cloud shield — a parasol that kept the surface temperate. Simulations hold those oceans for billions of years: a second blue marble, possibly longer-lived than our own.',
      'The evidence for the lost ocean is written in hydrogen. Venus’s air holds far more deuterium than ordinary hydrogen, and the light kind escapes to space first — so the ratio is a gauge of water lost. By that gauge, Venus has bled at least an ocean’s worth of hydrogen, maybe much more.',
      'When the water went, the thermostat broke. Without oceans to dissolve it, carbon dioxide piled up from volcanoes until the air itself weighed 92 atmospheres and trapped every photon twice over. That is the runaway greenhouse: not a warmer Earth, but a different planet wearing Earth’s clothes.'] },
    { h: 'Acid skies',
      kick: 'It rains acid that never lands.',
      paras: [
      'The clouds that fooled the Victorians are real chemistry: sulfuric acid droplets fifty kilometres up, so reflective the planet shines like a lamp. Below them the droplets evaporate — virga, like Titan’s methane rain — and sulfur compounds cycle back up on winds that circle the planet in four days while the ground turns once in 243.',
      'In 2020 a team reported phosphine in those clouds, a gas that on Earth means either life or industry. The detection is fiercely debated — later looks disagree, and no consensus exists. Treat it as science in progress: a great excuse to watch how a claim gets stress-tested, not a discovery.',
      'The clouds are also why the surface photographs look orange. Sunlight dies twice crossing the haze, and what reaches the basalt is the colour of old pennies. Stand on Venus and the sky would glow above you like a furnace door.'] },
    { h: 'Your turn',
      kick: 'Replay the kiln in the sandbox.',
      paras: [
      'The Venus world is this chapter, playable. Nothing alive survives it, so the quests are metallurgy: volcanic glass from basalt, marble from reef rock, diamonds from coal, steel from charcoal and ore — every one of them honest about the heat budget, because the planet supplies the furnace free.',
      'Then the long game. Paint an ocean on the basalt and watch what the models say happened: steam takes the sky and never comes back. The deuterium gauge in the journal is counting while you watch.',
      'Venus is the control experiment for every other world in the game. Earth with the thermostat broken. Run the numbers yourself — and read the journal when your first ocean boils.'] },
  ],
  experiment: { title: 'Replay it: boil an ocean',
    steps: ['Open the Venus world and paint a WATER ocean on the basalt; watch it flash to steam.',
    'Forge volcanic GLASS from basalt, then MARBLE, DIAMOND and STEEL — the full kiln line.',
    'Hold a lava lake open by pouring fresh LAVA faster than crust wins.',
    'Try planting one moss spore, and read the warning the game gives you.'] },
  sources: [
    'https://en.wikipedia.org/wiki/Venera',
    'https://science.nasa.gov/venus/'],
  dramatized: 'The “work shift” framing and “parasol” metaphor are imagined. Venera landing dates and survival times (Venera 13 at 127 minutes), surface temperature and pressure, retrograde spin, deuterium evidence for water loss, and the debated phosphine detection are from the cited sources.'
},
'hadean-dawn': {
  title: 'Hell With Water',
  sub: 'The first half-billion years ran hot, anoxic and bombarded — from Jack Hills zircons and the faint young Sun.',
  minutes: 12,
  paper: 'Jack Hills zircon record (Wilde et al., 2001 and successors) — 4.4-billion-year-old crust',
  also: 'Faint young Sun paradox and Hadean climate modelling',
  level: 'active research',
  pages: [
    { h: 'Named for the underworld',
      kick: 'Magma oceans, then rain.',
      paras: [
      'The Hadean runs from Earth’s birth to about four billion years ago, named for Hades because the first act is genuinely hellish: a Moon-forming collision that melted the whole planet, a glowing magma ocean, and an atmosphere of vaporised rock. Nothing in it would recognise the Earth as family.',
      'Then it cooled — fast, by geological standards. Within a couple of hundred million years the rains began, and the steam condensed into oceans on a planet still being resurfaced by lava. Hell with water: that contradiction is the whole chapter.',
      'The sandbox opens there. Lava vents, sulfur skies, no oxygen anywhere, acid brewing at the fumaroles — and, against every instinct, the first gardens. The Hadean world is the only one where heat is a resource instead of a hazard.'] },
    { h: 'The pebbles that rewrote hell',
      kick: 'One crystal, 4.4 billion years old.',
      paras: [
      'For decades textbooks drew the Hadean as unbroken lava. Then geologists in Western Australia’s Jack Hills found zircons — grains of staggeringly tough mineral — dated to 4.4 billion years, barely 150 million after the planet formed. Zircons grow in continental-type magmas, and these ones carry chemical fingerprints of liquid water.',
      'One pebble does not make a beach, but hundreds of such grains now say the same thing: solid crust, liquid water, maybe even continents, hundreds of millions of years earlier than anyone expected. Hell had beaches.',
      'That is why the Hadean chapter matters for origins. If oceans existed that early, the cradle had far more time than the lava-everywhere picture allowed — and the chemistry had water to work in. Your vent pools in the game sit on exactly that bet.'] },
    { h: 'The dim sun problem',
      kick: 'Sunlight at 70%, oceans anyway.',
      paras: [
      'Stars brighten as they age, and four billion years ago the Sun shone about 30 percent dimmer. A dimmer sun over a watery Earth should mean a frozen Earth — yet the zircons say liquid water. That contradiction is the faint young Sun paradox, astronomy’s longest invoice.',
      'The leading payment is greenhouse gas: a thick early atmosphere of carbon dioxide, methane and maybe hydrogen, holding in what little sun there was. Sagan and Mullen priced it in 1972 and the account has roughly balanced since, with the exact gas mix still argued over.',
      'The paradox cuts both ways, which is why Venus gets a chapter too. Earth held its water with greenhouse help; Venus lost its oceans to greenhouse excess. Same physics, opposite outcomes — and Mars froze for lack of either. Three planets, one equation.'] },
    { h: 'Bombardment',
      kick: 'Delivery trucks or sterilisation crews?',
      paras: [
      'Through all of this, rocks kept falling. Whether impacts arrived as one late cataclysm or a long drizzle is still contested — the famous Late Heavy Bombardment may be partly a sampling mirage — but the early Earth was unquestionably hit, hard and often.',
      'Each side of the argument hands the origin story something. Impacts deliver organics and metals, dig hydrothermal systems, and melt ice into lakes; big enough impacts also boil oceans and reset the clock. Life, if it started early, may have started more than once — with only the last attempt surviving to leave descendants.',
      'The game compresses the drizzle into gameplay: meteors are offstage, but the chemistry they fed — sulfur skies, acid ponds, hot brine pools — is the Hadean world’s whole weather system. Garden in it accordingly.'] },
    { h: 'Your turn',
      kick: 'Replay the cradle in the sandbox.',
      paras: [
      'The Hadean world is this chapter, playable. Brew acid at a vent, garden germs under glass, bloom archaea in a hot pool by day — then push toward the Genesis note, the game’s abiogenesis moment, in salted vent brine under a dome.',
      'Then the new work. Soda flats crust trona where damp salt meets lime, and the hot-spring quest wants twelve archaea before dusk. The cradle rewards mornings: seed early, read the pool temperature, and never trust the night.',
      'The Hadean is the origin story with the serial numbers filed by time. Run the chemistry yourself — and read the journal when your first pool blooms.'] },
  ],
  experiment: { title: 'Replay it: a morning in the Hadean',
    steps: ['Open the Hadean world, wall a ROCK basin and fill a WATER pool inside it.',
    'Seed ARCHAEA the same morning and count the bloom before dusk.',
    'Salt a flat with LIME scattered and mist it to crust TRONA.',
    'Push a vent pool toward the Genesis note: brine, dome, patience.'] },
  sources: [
    'https://en.wikipedia.org/wiki/Hadean',
    'https://en.wikipedia.org/wiki/Faint_young_Sun_paradox'],
  dramatized: 'The “invoice” and “delivery trucks” framings are imagined. The magma ocean and Moon-forming impact, Jack Hills zircon ages and water fingerprints, the 30-percent-dimmer Sun, the contested bombardment chronology, and the greenhouse-gas resolution are from the cited sources.'
},
};
