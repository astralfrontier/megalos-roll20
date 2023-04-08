/// <reference path="sheet.d.ts" />

// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

const ce_advantage_attrs = [
  'ce_toggle_advantage',
  'ce_advantage',
  'ce_disadvantage',
]

// Return a string (e.g. 3d20) to roll
// Look for advantage & disadvantage values in the retrieved attributes
// If enabled, modify input by those numbers
// If disabled, return the input unmodified
function modifiedDiceCount(
  diecount: any,
  diesize: any,
  v: GetAttrsCallbackValues,
  keep_highest = false
): string {
  if (v['ce_toggle_advantage'] != 'on') {
    return `${diecount}d${diesize}${keep_highest ? 'kh1' : ''}`
  }
  const updatedDieCount =
    parseInt(diecount) +
    parseInt(v['ce_advantage'] || '0') -
    parseInt(v['ce_disadvantage'] || '0')
  const rollstring =
    updatedDieCount < 1
      ? `2d${diesize}kl1`
      : `${updatedDieCount}d${diesize}${keep_highest ? 'kh1' : ''}`
  console.log(
    `Updated die count is ${updatedDieCount} rollstring is ${rollstring}`
  )
  return rollstring
}

function finishSkillRoll(outcome: StartRollCallbackValues) {
  const {
    rollId,
    results: {
      roll: { dice, expression },
    },
  } = outcome
  const [dicestmt, diff] = expression.split('>')
  let hits: number = 0
  const diffN = parseInt(diff)
  if (dicestmt.endsWith('kl1')) {
    const die = Math.min(...dice)
    hits = (die >= diffN ? 1 : 0) + (die == 20 ? 1 : 0)
  } else {
    hits = dice.reduce(
      (hits, die) => hits + (die >= diffN ? 1 : 0) + (die == 20 ? 1 : 0),
      0
    )
  }
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

function startSkillRoll(
  skillname: string,
  skillrank: number,
  v: GetAttrsCallbackValues,
  includeStatus = true
) {
  const diestring = modifiedDiceCount(skillrank, 20, v)
  const template = `&{template:check} {{name=${skillname}}} {{diff=[[0]]}} {{roll=[[${diestring}>?{Difficulty|15}]]}} {{message=[[0]]}}${
    includeStatus ? ' {{dazed=[[@{status_save_dazed}]]}}' : ''
  }`
  startRoll(template, finishSkillRoll)
}

function startSaveRoll(
  status: string,
  difficulty: number,
  v: GetAttrsCallbackValues
) {
  const diestring = modifiedDiceCount(1, 20, v)
  startRoll(
    `&{template:save} {{name=${status}}} {{roll=[[${diestring}>${difficulty}]]}} {{message=[[0]]}}`,
    finishSkillRoll
  )
}

function startAttackRoll(
  weaponname: string,
  weapondice: number,
  weapondamage: number,
  v: GetAttrsCallbackValues
) {
  const diestring = modifiedDiceCount(weapondice, 20, v)
  startRoll(
    `&{template:attack} {{name=${weaponname}}} {{diff=[[0]]}} {{roll=[[${diestring}>?{Defense|15}]]}} {{message=[[0]]}} {{damage=${weapondamage}}}`,
    finishSkillRoll
  )
}

on('clicked:repeating_skills:skill', (event) => {
  const { sourceAttribute } = event
  // SourceAttribute: repeating_skills_-NRFjaNa3LW-sC6ntcBd_skill
  getAttrs(
    [`${sourceAttribute}name`, `${sourceAttribute}rank`, ...ce_advantage_attrs],
    (v) => {
      const skillname = v[`${sourceAttribute}name`]
      const skillrank = parseInt(v[`${sourceAttribute}rank`])
      startSkillRoll(skillname, skillrank, v)
    }
  )
})

on('clicked:skilldefault', (event) => {
  getAttrs(ce_advantage_attrs, (v) => {
    startSkillRoll('Untrained Skill', 1, v)
  })
})

on('clicked:trait', (event) => {
  const trait = event.htmlAttributes['data-trait-attr']
  getAttrs([trait], (v) => {
    startSkillRoll(v[trait], 1, {}, false)
  })
})

on('clicked:save', (event) => {
  const status = event.htmlAttributes['data-status-name']
  const attrname = `status_save_${status}`
  getAttrs([attrname, ...ce_advantage_attrs], (v) => {
    const diff = parseInt(v[attrname]) || 10
    startSaveRoll(`${status.toUpperCase()}(${diff})`, diff, v)
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
          const setObj: any = {}
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
      'aether_current_5',
      ...ce_advantage_attrs,
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
        aether_current_5,
      } = v
      let weapon_final_damage =
        parseInt(weapon_core_damage) +
        (aether_current_1 == 'Throne Damage' ? 1 : 0) +
        (aether_current_2 == 'Throne Damage' ? 1 : 0) +
        (aether_current_3 == 'Throne Damage' ? 1 : 0) +
        (aether_current_4 == 'Throne Damage' ? 1 : 0) +
        (aether_current_5 == 'Throne Damage' ? 1 : 0)
      startAttackRoll(
        weapon_name,
        parseInt(weapon_dice),
        weapon_final_damage,
        v
      )
    }
  )
})

on('clicked:soak', (event) => {
  const label = event.htmlAttributes['data-soak-label']
  const attr_name = event.htmlAttributes['data-soak-attr']
  getAttrs(['role', attr_name, ...ce_advantage_attrs], (v) => {
    const dice = v['role'] == 'Tank' ? 2 : 1
    const diestring = modifiedDiceCount(dice, 6, v, true)
    startRoll(
      `&{template:soak} {{name=${label}}} {{roll=[[${diestring}+@{${attr_name}}]]}} {{barrier=[[@{barrier}]]}} {{exposed=[[@{status_save_exposed}]]}} {{shielded=[[@{condition_shielded}]]}}`,
      (outcome) => {
        finishRoll(outcome.rollId, {})
      }
    )
  })
})

on('clicked:addcondition', (event) => {
  const condition = event.htmlAttributes['data-condition-name']
  const O: any = {}
  O[`condition_${condition}`] = '2'
  setAttrs(O, {}, () => {})
})

const conditionNames = [
  'blink',
  'cloaked',
  'cover',
  'empowered',
  'focused',
  'haste',
  'regen',
  'shielded',
].map((name) => `condition_${name}`)

on('clicked:clearconditions', (event) => {
  getAttrs(conditionNames, (v) => {
    for (let condition of conditionNames) {
      const value = parseInt(v[condition])
      v[condition] = value > 1 ? `${value - 1}` : '0'
    }
    setAttrs(v, {}, () => {})
  })
})
