/// <reference path="sheet.d.ts" />

// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

const ce_advantage_attrs = [
  'ce_toggle_advantage',
  'ce_advantage',
  'ce_disadvantage',
]

const ce_soak_attrs = ['ce_toggle_soak', 'ce_soak_bonus']

const ce_ac_attrs = ['ce_toggle_ac_bonus', 'ce_ac_bonus']

/**
 * Turns a template name and a bag of properties into a properly formatted Roll20 string.
 *
 * @param template the template name, e.g. "attack"
 * @param props a collection of keys and values, e.g. {"roll": "[[1d6]]"}
 * @returns a Roll20 template string, e.g. &{template:attack} {{roll=[[1d6]]}}
 */
function propsToRollTemplate(
  template: string,
  props: Record<string, string>
): string {
  const props_s = Object.keys(props).map((prop) => `{{${prop}=${props[prop]}}}`)
  return `&{template:${template}} ${props_s.join(' ')}`
}

/**
 * Take a die count and size.
 * Look for advantage & disadvantage combat effects in the retrieved attributes.
 * If enabled, apply advantage/disadvantage stacks.
 * Return the final die command.
 *
 * @param diecount the starting numbre of dice to roll
 * @param diesize the die size, e.g 6 or 20
 * @param v a properties bag
 * @param keep_highest whether the die roll should keep the highest result
 * @returns a Roll20 die rolling command, e.g. "3d20kh2"
 */
function modifiedDiceCount(
  diecount: any,
  diesize: any,
  v: AttributeBundle,
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

  // Discard the highest die if we rolled with disadvantage
  let mydice: number[] = dice
  if (dice.length == 2 && dicestmt.endsWith('kl1')) {
    mydice = [Math.min(...dice)]
  }

  // A hit is anything that beats difficulty or is a nat 20, a strong hit is any nat 20 that beats difficulty
  const target = parseInt(diff)
  const hitmap = mydice.map(
    (die) => (die >= target ? 1 : 0) + (die == 20 ? 1 : 0)
  )

  // Calculate total hits
  const hittotal = hitmap.reduce((sum, hits) => sum + hits, 0)

  let message
  if (hittotal == 0) {
    message = 'FAIL'
  } else if (hitmap.includes(2)) {
    // Found a nat20 that beat the difficulty
    message = `STRONG HIT (${hittotal})`
  } else {
    message = `HIT (${hittotal})`
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
  v: AttributeBundle,
  includeStatus = true
) {
  const diestring = modifiedDiceCount(skillrank, 20, v)
  let extraProperties = {}
  if (includeStatus) {
    extraProperties = {
      dazed: '[[@{status_save_dazed}]]',
    }
  }
  const template = propsToRollTemplate('check', {
    name: skillname,
    diff: '[[0]]',
    roll: `[[${diestring}>?{Difficulty|15}]]`,
    message: '[[0]]',
    ...extraProperties,
  })
  startRoll(template, finishSkillRoll)
}

function startSaveRoll(status: string, difficulty: number, v: AttributeBundle) {
  const diestring = modifiedDiceCount(1, 20, v)
  const template = propsToRollTemplate('save', {
    name: status,
    roll: `[[${diestring}>${difficulty}]]`,
    message: '[[0]]',
    sick: '[[@{status_save_sick}]]',
  })
  startRoll(template, finishSkillRoll)
}

function startAttackRoll(
  weaponname: string,
  weapondice: number,
  weapondamage: number,
  v: AttributeBundle
) {
  const diestring = modifiedDiceCount(weapondice, 20, v)
  const template = propsToRollTemplate('attack', {
    name: weaponname,
    diff: '[[0]]',
    roll: `[[${diestring}>?{Defense|15}]]`,
    message: '[[0]]',
    damage: `[[${weapondamage} + @{throne_damage}]]`,
    throne: '[[@{throne_damage}]]',
    afraid: '[[@{status_save_afraid}]]',
    dazed: '[[@{status_save_dazed}]]',
    taunted: '[[@{status_save_taunted}]]',
    empowered: '[[@{condition_empowered}]]',
    focused: '[[@{condition_focused}]]',
  })
  startRoll(template, finishSkillRoll)
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
  // e.g. "trait_physical"
  const trait = event.htmlAttributes['data-trait-attr']
  startSkillRoll(`@{${trait}}`, 1, {}, false)
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
  getAttrs(['class', 'unlock_ac5', ...ce_ac_attrs], (v) => {
    // Which die are we rolling?
    const ac_die = parseInt(event.htmlAttributes['data-aethercurrent-number'])

    // Create an array of the AC slots to be rolled
    let ac_dice: number[] = [ac_die]
    if (ac_die == 0) {
      ac_dice = [1, 2, 3, 4]
      if (v['unlock_ac5'] == 'on') {
        ac_dice.push(5)
      }
    }

    // What do we add to each roll?
    const ac_bonus =
      v['ce_toggle_ac_bonus'] == 'on' ? parseInt(v['ce_ac_bonus']) : 0

    const className = v.class.toUpperCase()

    const rollprops = ac_dice.reduce(
      (props, die) => {
        props[`ac_die_${die}`] = `[[1d6+${ac_bonus}]]`
        return props
      },
      {
        name: 'Aether Current',
      } as Record<string, string>
    )

    const template = propsToRollTemplate('aether', rollprops)
    startRoll(template, (outcome) => {
      const { rollId, results } = outcome

      console.dir(outcome)

      const O: AttributeBundle = {}
      const messages: Record<string, string> = {}
      for (let die of ac_dice) {
        const result = results[`ac_die_${die}`].result
        let newAetherCurrent = ''
        let message = ''
        switch (className) {
          case 'INVOKER':
            newAetherCurrent = result % 2 ? 'Umbral Seal' : 'Astral Seal'
            message = newAetherCurrent
            break
          case 'THRONE':
            if (ac_die > 0) {
              newAetherCurrent = 'Used'
              message = `${result} damage`
            } else {
              newAetherCurrent = 'Throne Damage'
              message = '+1 Core Damage'
            }
            break
          case 'WITCH':
            if (ac_die > 0) {
              newAetherCurrent = result > 4 ? 'Surging Charge' : 'Weak Charge'
              message = newAetherCurrent
            } else {
              newAetherCurrent = 'Available'
              message = 'Available'
            }
            break
          default:
            if (ac_die == 0) {
              newAetherCurrent = 'Available'
              message = 'Available'
            } else {
              message = `${result}`
            }
            break
        }
        if (newAetherCurrent) {
          O[`aether_current_${die}`] = newAetherCurrent
        }
        messages[`ac_die_${die}`] = message
      }

      if (Object.keys(O)) {
        setAttrs(O)
      }

      finishRoll(rollId, messages)
    })
  })
})

on('clicked:attack', (event) => {
  getAttrs(
    ['weapon_name', 'weapon_dice', 'weapon_core_damage', ...ce_advantage_attrs],
    (v) => {
      const { weapon_name, weapon_dice, weapon_core_damage } = v
      startAttackRoll(
        weapon_name || '@{character_name}',
        parseInt(weapon_dice),
        parseInt(weapon_core_damage),
        v
      )
    }
  )
})

on('clicked:soak', (event) => {
  const label = event.htmlAttributes['data-soak-label']
  const attr_name = event.htmlAttributes['data-soak-attr']
  getAttrs(
    ['role', attr_name, ...ce_advantage_attrs, ...ce_soak_attrs],
    (v) => {
      const dice = v['role'].toUpperCase() == 'TANK' ? 2 : 1
      const diestring = modifiedDiceCount(dice, 6, v, true)
      let bonuses = 0
      if (v['ce_toggle_soak'] == 'on') {
        bonuses += parseInt(v['ce_soak_bonus'])
      }
      const template = propsToRollTemplate('soak', {
        name: label,
        roll: `[[${diestring}+@{${attr_name}}+${bonuses}]]`,
        barrier: '[[@{barrier}]]',
        exposed: '[[@{status_save_exposed}]]',
        shielded: '[[@{condition_shielded}]]',
      })
      startRoll(template, (outcome) => {
        finishRoll(outcome.rollId, {})
      })
    }
  )
})

on('clicked:addcondition', (event) => {
  const condition = event.htmlAttributes['data-condition-name']
  const O: AttributeBundle = {}
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

on('clicked:heal', (_event) => {
  getAttrs(['hp', 'hp_max', 'rb'], (v) => {
    const hp = Math.min(
      parseInt(v['hp_max']),
      parseInt(v['hp']) + parseInt(v['rb'])
    )
    const O: AttributeBundle = {}
    O['hp'] = `${hp}`
    setAttrs(O)
  })
})

on('clicked:repeating_powers:togglepower', (event) => {
  const attr_editable = (event.sourceAttribute || '').replace(
    /_togglepower$/,
    '_readonly'
  )
  getAttrs([attr_editable], (v) => {
    v[attr_editable] = v[attr_editable] == 'on' ? '0' : 'on'
    setAttrs(v)
  })
})

on('clicked:introduction', () => {
  getAttrs(
    ['character_avatar', 'character_token', 'introduction_text'],
    (v) => {
      const introduction_text = v['introduction_text'].replace(
        '@AVATAR',
        `[x](${v['character_avatar'].replace(/\?\d+$/, '')})`
      )
      startRoll(
        `&{template:announce} {{name=@{character_name}}} {{text=${introduction_text}}}`,
        (outcome) => {
          finishRoll(outcome.rollId, {})
        }
      )
    }
  )
})
