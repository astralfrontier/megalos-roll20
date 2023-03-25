// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

function finishSkillRoll(outcome) {
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

function startSkillRoll(skillname, skillrank) {
  startRoll(
    `&{template:check} {{name=${skillname}}} {{diff=[[0]]}} {{roll=[[${skillrank}d20>?{Difficulty|15}]]}} {{message=[[0]]}}`,
    finishSkillRoll
  )
}

function startSaveRoll(status, difficulty) {
  startRoll(
    `&{template:save} {{name=${status}}} {{roll=[[1d20>${difficulty}]]}} {{message=[[0]]}}`,
    finishSkillRoll
  )
}

function startAttackRoll(weaponname, weapondice, weapondamage) {
  startRoll(
    `&{template:attack} {{name=${weaponname}}} {{diff=[[0]]}} {{roll=[[${weapondice}d20>?{Defense|15}]]}} {{message=[[0]]}} {{damage=${weapondamage}}}`,
    finishSkillRoll
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

on('clicked:save', (event) => {
  const status = event.htmlAttributes['data-status-name']
  const attrname = `status_save_${status}`
  getAttrs([attrname], (v) => {
    const diff = parseInt(v[attrname]) || 10
    startSaveRoll(`${status.toUpperCase()}(${diff})`, diff)
  })
})

on('clicked:aethercurrent', (event) => {
  const number = event.htmlAttributes['data-aethercurrent-number']
  getAttrs(['class'], (v) => {
    const className = v.class
    startRoll(
      `&{template:aether} {{name=Aether Current (${number})}} {{roll=[[1d6]]}} {{message=[[0]]}}`,
      (outcome) => {
        const {
          rollId,
          results: {
            roll: { result },
          },
        } = outcome
        let newAetherCurrent = ''
        let message = ''
        switch (className) {
          case 'Invoker':
            newAetherCurrent = result % 2 ? 'Umbral Seal' : 'Astral Seal'
            message = newAetherCurrent
            break
          case 'Throne':
            newAetherCurrent = 'Used'
            message = 'Inflict damage'
            break
          case 'Witch':
            newAetherCurrent = result > 4 ? 'Surging Charge' : 'Weak Charge'
            message = newAetherCurrent
            break
        }
        if (newAetherCurrent) {
          const setObj = {}
          setObj[`aether_current_${number}`] = newAetherCurrent
          setAttrs(setObj, {}, () => {
            finishRoll(rollId, {
              message,
            })
          })
        } else {
          finishRoll(rollId, {
            message,
          })
        }
      }
    )
  })
})

/*
{
  "rollId": "-NRMbCHNIIyomtq2Shnc",
  "results": {
    "roll": {
      "result": 2,
      "dice": [
        2
      ],
      "expression": "1d6",
      "rolls": [
        {
          "sides": 6,
          "dice": 1,
          "results": [
            2
          ]
        }
      ]
    },
    "message": {
      "result": 0,
      "dice": [],
      "expression": "0",
      "rolls": []
    }
  }
}
 */

on('clicked:attack', (event) => {
  getAttrs(
    [
      'weapon_name',
      'weapon_dice',
      'weapon_core_damage',
      'aether_current_1',
      'aether_current_2',
      'aether_current_3',
      'aether_current_4',
    ],
    (v) => {
      const {
        weapon_name,
        weapon_dice,
        weapon_core_damage,
        aether_current_1,
        aether_current_2,
        aether_current_3,
        aether_current_4,
      } = v
      let weapon_final_damage =
        parseInt(weapon_core_damage) +
        (aether_current_1 == 'Throne Damage' ? 1 : 0) +
        (aether_current_2 == 'Throne Damage' ? 1 : 0) +
        (aether_current_3 == 'Throne Damage' ? 1 : 0) +
        (aether_current_4 == 'Throne Damage' ? 1 : 0)
      // TODO: other sources of damage?
      startAttackRoll(weapon_name, weapon_dice, weapon_final_damage)
    }
  )
})
