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
};
