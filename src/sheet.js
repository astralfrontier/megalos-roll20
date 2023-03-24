// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

function startSkillRoll(skillname, skillrank) {
  startRoll(
    `&{template:check} {{name=${skillname}}} {{diff=[[0]]}} {{roll=[[${skillrank}d20>?{Difficulty|15}]]}} {{message=[[0]]}}`,
    (outcome) => {
      const {
        rollId,
        results: {
          roll: { dice, expression },
        },
      } = outcome
      const [_dicestmt, diff] = expression.split('>')
      const hits = dice.reduce(
        (hits, die) => hits + (die >= diff ? 1 : 0) + (die == 20 ? 1 : 0),
        0
      )
      let message
      if (hits == 0) {
        message = 'FAIL'
      } else if (dice.includes(20)) {
        message = `STRONG HIT (${hits})`
      } else {
        message = `HIT (${hits})`
      }
      finishRoll(rollId, {
        diff: `${diff}`,
        roll: dice.map((die) => `${die}`).join(' '),
        message,
      })
    }
  )
}

on('clicked:repeating_skills:skill', (event) => {
  const { sourceAttribute } = event
  // SourceAttribute: repeating_skills_-NRFjaNa3LW-sC6ntcBd_skill
  getAttrs([`${sourceAttribute}name`, `${sourceAttribute}rank`], (v) => {
    const skillname = v[`${sourceAttribute}name`]
    const skillrank = v[`${sourceAttribute}rank`]
    startSkillRoll(skillname, skillrank)
  })
})

on('clicked:skilldefault', (event) => {
  startSkillRoll('Untrained Skill', 1)
})

on('clicked:trait', (event) => {
  startSkillRoll('Trait Reroll', 1)
})
